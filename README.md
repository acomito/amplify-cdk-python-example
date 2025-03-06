# Amplify CDK Python Example

This project consists of a FastAPI backend, a frontend application, and CDK infrastructure code.

## Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm or yarn
- Git

## Project Structure

```
.
├── backend/         # FastAPI backend application
├── frontend/        # Frontend application
├── cdk/            # AWS CDK infrastructure code
└── package.json    # Root package.json for development scripts
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

Create a `.env` file in both the frontend and backend directories if needed. Example:

```env
# backend/.env
DATABASE_URL=your_database_url
API_KEY=your_api_key

# frontend/.env
REACT_APP_API_URL=http://localhost:8000
```

## Deployment

Deployment instructions will be added soon.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

ISC
