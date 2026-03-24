# Use the existing backend Dockerfile but from the root context
# This satisfies Render if it defaults to a Docker build environment

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements from the backend subdirectory
COPY backend/requirements.txt ./requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend/ .

# Create a non-root user and setup directories
RUN useradd -m celeryuser && \
    mkdir -p /app/temp_uploads && \
    chown -R celeryuser:celeryuser /app && \
    chmod -R 775 /app/temp_uploads
USER celeryuser

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
