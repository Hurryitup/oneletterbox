from fastapi import FastAPI, Request
from mail_processor import lambda_handler
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Mail Processor Local Dev")

@app.post("/")
async def process_email(request: Request):
    """
    Simulate SES -> SNS -> Lambda event locally
    """
    # Get the raw request body
    body = await request.body()
    
    # Create a mock SNS event
    event = {
        "Records": [
            {
                "Sns": {
                    "Message": body.decode()
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
            "AWS_REGION": os.getenv("AWS_REGION"),
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 