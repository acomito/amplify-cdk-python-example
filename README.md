# Amplify CDK Python Example

This project consists of a FastAPI backend, a frontend application, and CDK infrastructure code deployed using AWS Amplify and AWS App Runner.

## Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm or yarn
- Git
- AWS CLI configured with appropriate credentials

## Project Structure

```
.
├── backend/           # FastAPI backend application
├── frontend/         # Frontend application
├── cdk/             # AWS CDK infrastructure code
├── amplify.yml      # AWS Amplify build configuration
├── apprunner.yaml   # AWS App Runner configuration
├── buildspec.yml    # AWS CodeBuild configuration
└── package.json     # Root package.json for development scripts
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/acomito/amplify-cdk-python-example.git
cd amplify-cdk-python-example
```

### 2. Backend Setup

First, create and activate a Python virtual environment:

#### For Windows:

```cmd
python -m venv venv
.\venv\Scripts\activate
```

#### For macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Key backend dependencies include:

- FastAPI (>=0.68.0,<0.69.0)
- Uvicorn (>=0.15.0,<0.16.0)
- Pydantic (>=1.8.0,<2.0.0)
- Pandas (>=2.2.0,<3.0.0)
- python-dotenv (>=1.0.0,<2.0.0)

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Root Dependencies

From the project root:

```bash
npm install
```

## Running the Application

### Development Mode

You can run both the frontend and backend concurrently using:

```bash
npm run start:dev
```

Or run them separately:

#### Backend Only

```bash
npm run start:backend
```

#### Frontend Only

```bash
npm run start:frontend
```

The backend will be available at `http://localhost:8000`
The frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, you can access:

- API documentation at `http://localhost:8000/docs`
- Alternative API documentation at `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file in both the frontend and backend directories based on the `.env.example` file. Required variables include:

```env
# Backend environment variables
DATABASE_URL=your_database_url
API_KEY=your_api_key
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Frontend environment variables
REACT_APP_API_URL=http://localhost:8000
REACT_APP_REGION=your_aws_region
REACT_APP_USER_POOL_ID=your_user_pool_id
REACT_APP_USER_POOL_CLIENT_ID=your_user_pool_client_id
```

## Deployment

The project is configured for deployment using AWS services:

### AWS Amplify

- Frontend deployment is handled through `amplify.yml`
- Supports automatic builds and deployments

### AWS App Runner

- Backend deployment is configured through `apprunner.yaml`
- Provides serverless container deployment

### AWS CodeBuild

- CI/CD pipeline is configured through `buildspec.yml`
- Handles building and testing of the application

For deployment:

1. Ensure AWS CLI is configured with appropriate credentials
2. Follow the deployment guides for each service:
   - [AWS Amplify Console](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
   - [AWS App Runner](https://docs.aws.amazon.com/apprunner/latest/dg/what-is-apprunner.html)

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

ISC
