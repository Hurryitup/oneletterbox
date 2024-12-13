# Mail Processor Tests

This directory contains test files and a local development server for the mail processor Lambda function.

## Directory Structure

```
tests/
├── fixtures/           # Test data files
│   └── example_email.json
├── local_dev.py       # Local development server
└── README.md          # This file
```

## Local Development Server

The `local_dev.py` script provides a FastAPI server that simulates the SES -> SNS -> Lambda flow locally.

### Setup

1. From the `mail_processor` directory, create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install development dependencies:
```bash
pip install -e ".[dev]"
```

3. Configure environment variables by copying and editing `.env`:
```bash
cp .env.example .env
# Edit .env with your AWS credentials if testing with real AWS services
```

### Running the Server

1. Start the development server:
```bash
# Using npm script (recommended):
npm run dev

# Or using Python directly:
python -m uvicorn tests.local_dev:app --reload
```

2. Test the health endpoint:
```bash
curl http://localhost:8000/health
```

3. Process a test email:
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/example_email.json
```

### Example Email Format

The `fixtures/example_email.json` file contains a sample email event in the format:
```json
{
    "mail": {
        "commonHeaders": {
            "from": ["newsletter@example.com"],
            "subject": "Test Newsletter"
        },
        "destination": ["user+test@oneletterbox.com"]
    },
    "receipt": {
        "action": {
            "bucketName": "test-bucket",
            "objectKey": "test-key"
        }
    }
}
```

## Running Tests

(Future: Add instructions for running unit tests and integration tests) 