#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { IamStack } from '../lib/iam-stack';
import { LambdaStack } from '../lib/lambda-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

// Create the stacks
const databaseStack = new DatabaseStack(app, 'OneletterboxDatabase', {
  env,
  description: 'DynamoDB tables for Oneletterbox',
});

// Create S3 bucket for storing emails
const emailBucket = new s3.Bucket(databaseStack, 'EmailBucket', {
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  encryption: s3.BucketEncryption.S3_MANAGED,
  lifecycleRules: [
    {
      expiration: cdk.Duration.days(30), // Retain emails for 30 days
    },
  ],
});

// Create Lambda stack
const lambdaStack = new LambdaStack(app, 'OneletterboxLambda', {
  env,
  description: 'Lambda functions for Oneletterbox',
  inboxesTable: databaseStack.inboxesTable,
  subscriptionsTable: databaseStack.subscriptionsTable,
  emailBucket: emailBucket,
  usersTable: databaseStack.usersTable,
});

const iamStack = new IamStack(app, 'OneletterboxIam', {
  env,
  description: 'IAM resources for Oneletterbox',
  usersTable: databaseStack.usersTable,
  inboxesTable: databaseStack.inboxesTable,
  emailBucket: emailBucket,
});

// Add tags to all resources
const tags = {
  Environment: 'production',
  Service: 'oneletterbox',
  ManagedBy: 'cdk',
};

Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
}); 