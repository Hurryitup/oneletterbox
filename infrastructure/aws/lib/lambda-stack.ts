import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as path from 'path';

interface LambdaStackProps extends cdk.StackProps {
  issuesTable: dynamodb.Table;
  subscriptionsTable: dynamodb.Table;
  emailBucket: s3.Bucket;
  usersTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly mailProcessorFunction: lambda.Function;
  public readonly emailTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create SNS topic for incoming emails
    this.emailTopic = new sns.Topic(this, 'EmailTopic', {
      displayName: 'Incoming Email Notifications',
    });

    // Create the mail processor Lambda function
    this.mailProcessorFunction = new lambda.Function(this, 'MailProcessor', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'mail_processor.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/mail_processor')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ISSUES_TABLE: props.issuesTable.tableName,
        SUBSCRIPTIONS_TABLE: props.subscriptionsTable.tableName,
        EMAIL_BUCKET: props.emailBucket.bucketName,
        USERS_TABLE: props.usersTable.tableName,
      },
    });

    // Grant DynamoDB permissions
    props.issuesTable.grantWriteData(this.mailProcessorFunction);
    props.subscriptionsTable.grantReadWriteData(this.mailProcessorFunction);
    props.usersTable.grantReadData(this.mailProcessorFunction);

    // Also grant explicit permissions for the GSI
    this.mailProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:Query',
          'dynamodb:Scan'
        ],
        resources: [
          props.usersTable.tableArn,
          `${props.usersTable.tableArn}/index/*`
        ],
      })
    );

    // Grant S3 permissions
    props.emailBucket.grantRead(this.mailProcessorFunction);

    // Allow Lambda to be triggered by SNS
    this.emailTopic.addSubscription(
      new subscriptions.LambdaSubscription(this.mailProcessorFunction)
    );

    // Add CloudWatch Logs permissions
    this.mailProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );


    // Create SES Receipt Rule Set
    const ruleSet = new ses.ReceiptRuleSet(this, 'EmailRules', {
        receiptRuleSetName: 'oneletterbox-rules',
      });
  
      // Create SES Receipt Rule
      const rule = ruleSet.addRule('ProcessEmails', {
        recipients: ['oneletterbox.com'], // This will catch all emails to @oneletterbox.com
        scanEnabled: true, // Enable spam and virus scanning
        tlsPolicy: ses.TlsPolicy.REQUIRE, // Require TLS
        actions: [
          // Store email in S3
          new sesActions.S3({
            bucket: props.emailBucket,
            objectKeyPrefix: 'inbox/',
            topic: this.emailTopic,
          }),
        ],
      });

    // Output the SNS topic ARN
    new cdk.CfnOutput(this, 'EmailTopicArn', {
      value: this.emailTopic.topicArn,
      description: 'The ARN of the SNS topic for incoming emails',
      exportName: 'EmailTopicArn',
    });


    // Output the Receipt Rule Set Name
    new cdk.CfnOutput(this, 'ReceiptRuleSetName', {
        value: ruleSet.receiptRuleSetName,
        description: 'The name of the SES receipt rule set',
        exportName: 'ReceiptRuleSetName',
      });
  }
} 