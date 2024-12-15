import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface IamStackProps extends cdk.StackProps {
  usersTable: dynamodb.Table;
  inboxesTable: dynamodb.Table;
  emailBucket: s3.Bucket;
}

export class IamStack extends cdk.Stack {
  public readonly apiUser: iam.User;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    // Create API user
    this.apiUser = new iam.User(this, 'ApiUser', {
      userName: 'oneletterbox-api',
    });

    // Create policy for DynamoDB access
    const dynamoDbPolicy = new iam.Policy(this, 'DynamoDbPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
          ],
          resources: [
            props.usersTable.tableArn,
            `${props.usersTable.tableArn}/index/*`,
            props.inboxesTable.tableArn,
            `${props.inboxesTable.tableArn}/index/*`,
          ],
        }),
      ],
    });

    // Create policy for S3 access
    const s3Policy = new iam.Policy(this, 'S3Policy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:ListBucket',
          ],
          resources: [
            props.emailBucket.bucketArn,
            `${props.emailBucket.bucketArn}/*`,
          ],
        }),
      ],
    });

    // Attach policies to user
    this.apiUser.attachInlinePolicy(dynamoDbPolicy);
    this.apiUser.attachInlinePolicy(s3Policy);

    // Create access key for API user
    const accessKey = new iam.CfnAccessKey(this, 'ApiUserAccessKey', {
      userName: this.apiUser.userName,
    });

    // Output access key details
    new cdk.CfnOutput(this, 'ApiUserAccessKeyId', {
      value: accessKey.ref,
      description: 'The access key ID for the API user',
      exportName: 'ApiUserAccessKeyId',
    });

    new cdk.CfnOutput(this, 'ApiUserSecretAccessKey', {
      value: accessKey.attrSecretAccessKey,
      description: 'The secret access key for the API user',
      exportName: 'ApiUserSecretAccessKey',
    });

    // Add tags
    cdk.Tags.of(this.apiUser).add('Environment', 'development');
    cdk.Tags.of(this.apiUser).add('Service', 'oneletterbox');
  }
} 