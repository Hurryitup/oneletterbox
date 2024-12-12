#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { IamStack } from '../lib/iam-stack';

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

const iamStack = new IamStack(app, 'OneletterboxIam', {
  env,
  description: 'IAM resources for Oneletterbox',
  usersTable: databaseStack.usersTable,
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