from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import health, users, data, customers
from dotenv import load_dotenv
import os
import uvicorn
from scripts.on_startup import seed_example_customers

# Load environment variables
load_dotenv()

app = FastAPI(
    title="My FastAPI Application",
    description="A modular FastAPI application with separated routes",
    version="1.0.0",
    debug=os.getenv('DEBUG', 'False').lower() == 'true'
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(data.router)
app.include_router(customers.router)

@app.on_event("startup")
async def startup_event():
    """Run startup tasks."""
    await seed_example_customers()

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)