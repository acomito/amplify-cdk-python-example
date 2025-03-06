# Use Python 3.11 slim as the base image for a smaller footprint
FROM public.ecr.aws/docker/library/python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Start a new stage for the final image
FROM public.ecr.aws/docker/library/python:3.11-slim

# Create a non-root user
RUN useradd -m -u 1001 appuser

WORKDIR /app

# Copy only the built wheels from builder
COPY --from=builder /app/wheels /wheels

# Install the built wheels
RUN pip install --no-cache /wheels/*

# Copy the application code
COPY . .

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 