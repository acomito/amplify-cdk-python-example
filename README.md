# Amplify CDK Python Example

This project consists of a FastAPI backend with Plotly visualization support, a React TypeScript frontend using Vite, and CDK infrastructure code deployed using AWS Amplify and AWS App Runner.

## Prerequisites

- Python 3.7 or higher
- Node.js 18 or higher
- npm or yarn
- Git
- AWS CLI configured with appropriate credentials

## Project Structure

```
.
├── backend/           # FastAPI backend application
│   ├── routes/       # API route handlers
│   ├── main.py      # Main FastAPI application
│   └── requirements.txt
├── frontend/         # React TypeScript frontend
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   └── package.json
├── cdk/             # AWS CDK infrastructure code
├── amplify.yml      # AWS Amplify build configuration
├── apprunner.yaml   # AWS App Runner configuration
├── buildspec.yml    # AWS CodeBuild configuration
└── package.json     # Root package.json for development scripts
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/acomito/amplify-cdk-python-example.git
cd amplify-cdk-python-example
```

### 2. Install Dependencies

The project includes convenience scripts to install all dependencies:

```bash
# Install all dependencies (both frontend and backend)
npm run install:dev

# Or install separately:
npm run install:backend  # Install backend dependencies
npm run install:frontend # Install frontend dependencies
```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run start:dev
```

Or run them separately:

```bash
npm run start:backend  # Runs the FastAPI backend
npm run start:frontend # Runs the Vite dev server
```

The backend will be available at `http://localhost:8000`
The frontend will be available at `http://localhost:5173`

## Key Dependencies

### Backend

- FastAPI (>=0.68.0,<0.69.0)
- Uvicorn (>=0.15.0,<0.16.0)
- Pydantic (>=1.8.0,<2.0.0)
- Pandas (>=2.2.0,<3.0.0)
- Plotly (>=5.18.0,<6.0.0)

### Frontend

- React 18
- TypeScript
- Vite
- AWS Amplify UI React (^6.5.5)
- Plotly.js
- React Plotly.js

## Environment Variables

Create `.env` files in both frontend and backend directories using the provided `.env.example` files as templates:

### Backend (.env)

```env
DATABASE_URL=your_database_url
API_KEY=your_api_key
AWS_REGION=your_aws_region
```

### Frontend (.env)

```env
VITE_APP_API_URL=http://localhost:8000
```

## API Documentation

When running the backend, access:

- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## Deployment

The project uses AWS services for deployment:

- **Frontend**: AWS Amplify (configured via `amplify.yml`)
- **Backend**: AWS App Runner (configured via `apprunner.yaml`)
- **Infrastructure**: AWS CDK
- **CI/CD**: AWS CodeBuild (configured via `buildspec.yml`)

## Contributing

Please see [CONTRIBUTING.md](frontend/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

ISC - See [LICENSE](frontend/LICENSE) for details.

# TODO:

Add a retool admin panel for dynamodb: https://www.youtube.com/watch?v=Zds3lP3CCHc&ab_channel=Retool
