#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install development dependencies
echo "Installing development dependencies..."
pip install -e ".[dev]"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOL
ISSUES_TABLE=Issues
SUBSCRIPTIONS_TABLE=Subscriptions
AWS_REGION=us-east-1
# Add these if testing locally
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
EOL
fi

# Create example email for testing
if [ ! -f "example_email.json" ]; then
    echo "Creating example email..."
    cat > example_email.json << EOL
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
EOL
fi

echo "Development environment setup complete!"
echo "To start the development server:"
echo "1. Activate the virtual environment: source .venv/bin/activate"
echo "2. Run the server: npm run dev"
echo "3. Test with: curl -X POST -H 'Content-Type: application/json' -d @example_email.json http://localhost:8000/" 