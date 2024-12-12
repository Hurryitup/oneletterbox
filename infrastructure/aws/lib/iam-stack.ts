import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface IamStackProps extends cdk.StackProps {
  usersTable: dynamodb.Table;
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
          ],
        }),
      ],
    });

    // Attach policy to user
    this.apiUser.attachInlinePolicy(dynamoDbPolicy);

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
    cdk.Tags.of(this.apiUser).add('Environment', 'production');
    cdk.Tags.of(this.apiUser).add('Service', 'oneletterbox');
  }
} 