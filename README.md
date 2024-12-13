# OneLetterBox

A modern newsletter aggregator and reader built with React, TypeScript, and AWS.

## Architecture

The project uses a monorepo structure with Turborepo for managing multiple packages:

```
oneletterbox/
├── apps/
│   ├── web/               # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   └── package.json
│   └── api/               # Express backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── models/
│       │   └── services/
│       └── package.json
└── infrastructure/
    └── aws/               # AWS CDK infrastructure
        ├── lib/
        │   ├── database-stack.ts
        │   ├── lambda-stack.ts
        │   └── iam-stack.ts
        └── package.json
```

### Technology Stack

- **Frontend**:
  - React with TypeScript
  - TailwindCSS for styling
  - React Router for navigation
  - Axios for API calls
  - Context API for state management

- **Backend**:
  - Express.js with TypeScript
  - JWT for authentication
  - AWS DynamoDB for data storage
  - Middleware for auth and error handling

- **Infrastructure**:
  - AWS CDK for infrastructure as code
  - DynamoDB for database
  - Lambda for serverless functions
  - SES for email processing
  - S3 for email storage
  - IAM for access management

## Prerequisites

- Node.js (v16 or later)
- AWS Account with configured credentials
- AWS CLI installed and configured
- Git
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Infrastructure Deployment

1. Configure AWS credentials:
```bash
aws configure
```

2. Install infrastructure dependencies:
```bash
cd infrastructure/aws
npm install
```

3. Bootstrap AWS CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

4. Configure SES domain:
   - Verify your domain in SES (Amazon Simple Email Service)
   - Request production access if needed
   - Configure domain verification records in your DNS

5. Deploy the stacks:
```bash
# Deploy all stacks
cdk deploy --all

# Or deploy individual stacks
cdk deploy OneletterboxDatabase
cdk deploy OneletterboxLambda
cdk deploy OneletterboxIam
```

6. Note the outputs:
   - DynamoDB table names
   - Lambda function ARNs
   - S3 bucket name
   - SES rule set name

7. Configure environment variables:
   - Copy `.env.example` to `.env` in each service directory
   - Update with values from stack outputs

### Infrastructure Components

The infrastructure consists of several stacks:

- **Database Stack** (`DatabaseStack`):
  - Users table with GSI for email lookups
  - Issues table for newsletter content
  - Subscriptions table for user subscriptions

- **Lambda Stack** (`LambdaStack`):
  - Mail processor function for handling incoming emails
  - SES rules for email routing
  - S3 bucket for email storage
  - SNS topic for notifications

- **IAM Stack** (`IamStack`):
  - Service roles and policies
  - Cross-service permissions

### Updating Infrastructure

To update the infrastructure:

1. Make changes to the CDK code
2. Run `cdk diff` to review changes
3. Deploy updates:
```bash
cdk deploy --all
```

### Destroying Infrastructure

To tear down the infrastructure:
```bash
cdk destroy --all
```

Note: Some resources (like S3 buckets and DynamoDB tables) have deletion protection enabled. You'll need to manually remove them or update their removal policies.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/oneletterbox.git
cd oneletterbox
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create `apps/api/.env`:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
```

## Running the Application

1. Start the API server:
```bash
cd apps/api
npm run dev
```

2. Start the web application:
```bash
cd apps/web
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3001

## Features

- User authentication and account management
- Newsletter aggregation and reading
- Category and source-based filtering
- Chronological sorting (ascending/descending)
- Responsive design
- Account preferences and settings

## Development

The project uses Turborepo for managing the monorepo. Common commands:

```bash
# Run all applications
npm run dev

# Build all applications
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## API Endpoints

### Authentication
- `POST /api/account/register` - Register new user
- `POST /api/account/login` - Login user
- `GET /api/account/profile` - Get user profile
- `PATCH /api/account/profile` - Update user profile
- `POST /api/account/change-password` - Change password

### Newsletters
- `GET /api/newsletters` - Get all newsletters
- `GET /api/newsletters/:id` - Get specific newsletter