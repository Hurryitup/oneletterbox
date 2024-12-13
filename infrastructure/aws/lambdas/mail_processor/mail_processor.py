import json
import boto3
import uuid
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from botocore.exceptions import ClientError

import string

class JsonFormatter(logging.Formatter):
    """
    Formats logs as JSON with extra fields
    """
    def format(self, record):
        # Get the original format
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
        }
        
        # Add extra fields
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in ['args', 'asctime', 'created', 'exc_info', 'exc_text', 'filename',
                             'funcName', 'levelname', 'levelno', 'lineno', 'module', 'msecs',
                             'msg', 'name', 'pathname', 'process', 'processName', 'relativeCreated',
                             'stack_info', 'thread', 'threadName']:
                    try:
                        json.dumps(value)  # Check if value is JSON serializable
                        log_data[key] = value
                    except (TypeError, ValueError):
                        log_data[key] = str(value)
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Remove existing handlers
for handler in logger.handlers:
    logger.removeHandler(handler)

# Add JSON formatter to CloudWatch handler
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger.addHandler(handler)

def extract_email_details(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract email details from the SES message.
    Handles different message formats (direct from SES or via SNS).
    """
    logger.info("Extracting email details from message", extra={
        "email_data": json.dumps(message) if isinstance(message, dict) else message
    })
    
    try:
        # If the message came through SNS, it will be JSON string
        if isinstance(message, str):
            message = json.loads(message)
        
        mail_data = message.get('mail', {})
        receipt_data = message.get('receipt', {})
        
        # Try different paths for sender and subject
        sender = None
        subject = None
        
        # Try commonHeaders path
        common_headers = mail_data.get('commonHeaders', {})
        if common_headers:
            sender = common_headers.get('from', [None])[0]
            subject = common_headers.get('subject')
        
        # Fallback to direct headers
        if not sender:
            sender = mail_data.get('source')
        if not subject:
            subject = mail_data.get('subject')
        
        # Get S3 details
        action = receipt_data.get('action', {})
        s3_bucket = action.get('bucketName')
        s3_key = action.get('objectKey')
        
        if not all([sender, subject, s3_bucket, s3_key]):
            missing = [k for k, v in {
                'sender': sender,
                'subject': subject,
                's3_bucket': s3_bucket,
                's3_key': s3_key
            }.items() if not v]
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        
        return {
            'sender': sender,
            'subject': subject,
            's3_bucket': s3_bucket,
            's3_key': s3_key,
            'recipients': mail_data.get('destination', []),
            's3_location': f's3://{s3_bucket}/{s3_key}'
        }
    except Exception as e:
        logger.error(
            "Error extracting email details",
            extra={
                "error_type": str(type(e).__name__),
                "error_details": str(e),
                "raw_data": json.dumps(message) if isinstance(message, dict) else message
            },
            exc_info=True
        )
        raise

def update_subscription_stats(table, user_id: str, inbox: str, timestamp: str, publisher: str) -> None:
    """
    Update subscription stats with proper error handling and initialization
    """
    try:
        # First, try to get the current item
        response = table.get_item(
            Key={
                'partitionKey': f'USER#{user_id}',
                'sortKey': f'INBOX#{inbox}'
            }
        )
        
        # If item exists, update it
        if 'Item' in response:
            current_stats = response['Item'].get('stats', {})
            total_received = current_stats.get('totalReceived', 0) + 1
            
            table.update_item(
                Key={
                    'partitionKey': f'USER#{user_id}',
                    'sortKey': f'INBOX#{inbox}'
                },
                UpdateExpression='SET lastReceived = :timestamp, GSI2PK = :publisher, stats = :stats',
                ExpressionAttributeValues={
                    ':timestamp': timestamp,
                    ':publisher': f'PUBLISHER#{publisher}',
                    ':stats': {
                        'totalReceived': total_received,
                        'lastUpdated': timestamp
                    }
                }
            )
        else:
            # Create new item with initial stats
            table.put_item(
                Item={
                    'partitionKey': f'USER#{user_id}',
                    'sortKey': f'INBOX#{inbox}',
                    'lastReceived': timestamp,
                    'GSI2PK': f'PUBLISHER#{publisher}',
                    'stats': {
                        'totalReceived': 1,
                        'lastUpdated': timestamp
                    },
                    'createdAt': timestamp
                }
            )
    except ClientError as e:
        logger.error(
            "Error updating subscription stats",
            extra={
                "error_code": e.response['Error']['Code'],
                "error_message": e.response['Error']['Message'],
                "user_id": user_id,
                "inbox": inbox,
                "publisher": publisher
            },
            exc_info=True
        )
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process incoming emails from SES via SNS.
    Stores email data in DynamoDB and raw content in S3.
    """
    logger.info("Processing incoming email event", extra={
        "event_data": json.dumps(event)
    })
    
    # Initialize AWS services
    dynamodb = boto3.resource('dynamodb')
    issues_table = dynamodb.Table(os.environ['ISSUES_TABLE'])
    subscriptions_table = dynamodb.Table(os.environ['SUBSCRIPTIONS_TABLE'])

    # Process each record from SNS
    records = event.get('Records', [])
    processed_items = []
    
    for record in records:
        try:
            # Parse SNS message containing SES email data
            sns_message = record.get('Sns', {}).get('Message')
            if not sns_message:
                raise ValueError("No SNS message found in record")
            
            logger.info("Processing SNS message", extra={
                "sns_data": sns_message
            })
            
            # Extract email details
            email_details = extract_email_details(sns_message)
            
            # Generate a unique ID for this issue
            issue_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            
            # Process each recipient
            for inbox in email_details['recipients']:
                try:
                    user_id = get_user_id_from_alias(inbox)
                    
                    # Skip processing for unregistered users
                    if user_id is None:
                        logger.info(
                            "Skipping email processing for unregistered recipient",
                            extra={
                                "email": inbox
                            }
                        )
                        continue
                        
                    logger.info(
                        "Processing email for recipient",
                        extra={
                            "user_id": user_id,
                            "email": inbox
                        }
                    )
                    
                    # Create issue record
                    issue_item = {
                        'partitionKey': f'INBOX#{inbox}',
                        'sortKey': f'ISSUE#{issue_id}',
                        'GSI1PK': f'USER#{user_id}',
                        'receivedAt': timestamp,
                        'issueId': issue_id,
                        'sender': email_details['sender'],
                        'subject': email_details['subject'],
                        's3Location': email_details['s3_location'],
                        'contentType': 'email/rfc822',  # Standard email format
                        'status': 'received',
                        'archived': False,
                        'starred': False
                    }
                    
                    # Store the issue
                    issues_table.put_item(Item=issue_item)
                    
                    # Update subscription stats
                    update_subscription_stats(
                        subscriptions_table,
                        user_id,
                        inbox,
                        timestamp,
                        email_details['sender']
                    )
                    
                    processed_items.append({
                        'inbox': inbox,
                        'issue_id': issue_id,
                        'status': 'success'
                    })
                    
                except Exception as e:
                    logger.error(
                        "Error processing email for recipient",
                        extra={
                            "recipient": inbox,
                            "error_type": str(type(e).__name__),
                            "error_details": str(e),
                            "issue_id": issue_id,
                            "email_details": json.dumps(email_details)
                        },
                        exc_info=True
                    )
                    processed_items.append({
                        'inbox': inbox,
                        'issue_id': issue_id,
                        'status': 'error',
                        'error': str(e)
                    })
        
        except Exception as e:
            logger.error(
                "Error processing SNS record",
                extra={
                    "record_data": json.dumps(record),
                    "error_type": str(type(e).__name__),
                    "error_details": str(e)
                },
                exc_info=True
            )
            processed_items.append({
                'status': 'error',
                'error': str(e)
            })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Email processing complete',
            'processed_items': processed_items
        })
    }


def get_user_id_from_alias(email: str) -> Optional[str]:
    """
    Extract user ID from email alias and look up in Users table.
    Returns None if user doesn't exist, indicating a deadletter case.
    """
    # Remove alias part if present (e.g., user+alias@domain.com -> user@domain.com)
    base_email = email.split('+')[0] + '@' + email.split('@')[1]
    
    logger.info("Looking up user by email", extra={
        "email": base_email,
        "original_alias": email
    })
    
    try:
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb')
        users_table = dynamodb.Table(os.environ['USERS_TABLE'])
        
        # Query Users table by email using GSI
        response = users_table.query(
            IndexName='EmailIndex',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={
                ':email': base_email
            }
        )
        
        # If user exists, return their ID
        if response.get('Items'):
            user = response['Items'][0]
            logger.info("Found existing user", extra={
                "user_id": user['id'],
                "email": base_email
            })
            return user['id']
        
        # If user doesn't exist, log it as a deadletter case
        logger.warning("Unregistered email address - marking as deadletter", extra={
            "email": base_email,
            "original_alias": email,
            "reason": "User not found in database"
        })
        return None
        
    except ClientError as e:
        logger.error(
            "Error looking up user",
            extra={
                "error_code": e.response['Error']['Code'],
                "error_message": e.response['Error']['Message'],
                "email": base_email
            },
            exc_info=True
        )
        raise
    except Exception as e:
        logger.error(
            "Unexpected error in user lookup",
            extra={
                "error_type": str(type(e).__name__),
                "error_details": str(e),
                "email": base_email
            },
            exc_info=True
        )
        raise
