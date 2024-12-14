import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly inboxesTable: dynamodb.Table;
  public readonly subscriptionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Users table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Add GSI for email lookups
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create the Inboxes table
    this.inboxesTable = new dynamodb.Table(this, 'InboxesTable', {
      tableName: 'Inboxes',
      partitionKey: {
        name: 'partitionKey',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sortKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Add GSI for date-based queries
    this.inboxesTable.addGlobalSecondaryIndex({
      indexName: 'UserDateIndex',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'receivedAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create the Subscriptions table
    this.subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: 'Subscriptions',
      partitionKey: {
        name: 'partitionKey',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sortKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Add GSI for email alias lookups
    this.subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'InboxIndex',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for publisher lookups
    this.subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'PublisherIndex',
      partitionKey: {
        name: 'GSI2PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'lastReceived',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add tags to all tables
    const tables = [this.usersTable, this.inboxesTable, this.subscriptionsTable];
    tables.forEach(table => {
      cdk.Tags.of(table).add('Environment', 'production');
      cdk.Tags.of(table).add('Service', 'oneletterbox');
    });

    // Output table names and ARNs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'The name of the Users table',
      exportName: 'UsersTableName',
    });

    new cdk.CfnOutput(this, 'InboxesTableName', {
      value: this.inboxesTable.tableName,
      description: 'The name of the Inboxes table',
      exportName: 'InboxesTableName',
    });

    new cdk.CfnOutput(this, 'SubscriptionsTableName', {
      value: this.subscriptionsTable.tableName,
      description: 'The name of the Subscriptions table',
      exportName: 'SubscriptionsTableName',
    });
  }
} 