from fastapi import FastAPI
from routes import health, users, data
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="My FastAPI Application",
    description="A modular FastAPI application with separated routes",
    version="1.0.0",
    debug=os.getenv('DEBUG', 'False').lower() == 'true'
)

# Include routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(data.router)

@app.get("/")
async def root():
    try:
        return {
            "message": "Welcome to the API",
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "environment": os.getenv('APP_ENV', 'production')
        }
    except Exception as e:
        return {"error": str(e)}