#!/bin/bash

# Exit on error
set -e

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

# Check if AWS region is set, default to us-east-1
if [ -z "$AWS_REGION" ]; then
    export AWS_REGION="us-east-1"
    echo "AWS_REGION not set, defaulting to us-east-1"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Bootstrap CDK (if not already done)
echo "Bootstrapping CDK..."
npm run bootstrap

# Deploy stacks in order
echo "Deploying Database stack..."
npm run deploy:db

echo "Deploying Lambda stack..."
npm run deploy:lambda

echo "Deploying IAM stack..."
npm run deploy:iam

echo "Deployment complete!"

# Get the outputs
echo "Getting stack outputs..."
aws cloudformation describe-stacks --stack-name OneletterboxDatabase --query 'Stacks[0].Outputs' --output table
aws cloudformation describe-stacks --stack-name OneletterboxLambda --query 'Stacks[0].Outputs' --output table
aws cloudformation describe-stacks --stack-name OneletterboxIam --query 'Stacks[0].Outputs' --output table