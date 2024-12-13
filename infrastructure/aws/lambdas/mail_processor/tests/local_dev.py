from fastapi import FastAPI, Request
import sys
import os

# Add the parent directory to the Python path so we can import mail_processor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mail_processor import lambda_handler
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Mail Processor Local Dev")

@app.post("/")
async def process_email(request: Request):
    """
    Simulate SES -> SNS -> Lambda event locally
    """
    # Get the request body as JSON
    email_data = await request.json()
    
    # Create a mock SNS event with the JSON payload
    event = {
        "Records": [
            {
                "Sns": {
                    "Message": json.dumps(email_data)  # Properly encode the JSON data
                }
            }
        ]
    }
    
    # Call the Lambda handler
    result = lambda_handler(event, None)
    return result

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "environment": {
            "ISSUES_TABLE": os.getenv("ISSUES_TABLE"),
            "SUBSCRIPTIONS_TABLE": os.getenv("SUBSCRIPTIONS_TABLE"),
            "USERS_TABLE": os.getenv("USERS_TABLE"),
            "EMAIL_BUCKET": os.getenv("EMAIL_BUCKET"),
            "AWS_REGION": os.getenv("AWS_REGION"),
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 