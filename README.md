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
  - IAM for access management

## Prerequisites

- Node.js (v16 or later)
- AWS Account with configured credentials
- AWS CLI installed and configured
- Git

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

4. Deploy AWS infrastructure:
```bash
cd infrastructure/aws
npm install
npm run cdk deploy
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