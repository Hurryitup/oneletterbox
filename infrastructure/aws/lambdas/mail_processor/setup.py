from setuptools import setup, find_packages

setup(
    name="mail_processor",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "python-dateutil>=2.8.2",
    ],
    extras_require={
        "dev": [
            "setuptools>=65.0.0",
            "boto3-stubs[essential]>=1.26.0",
            "black",
            "isort",
            "mypy",
            "fastapi>=0.104.0",
            "uvicorn>=0.24.0",
            "python-dotenv>=1.0.0",
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "httpx>=0.25.0",  # For testing FastAPI
        ]
    }
) 