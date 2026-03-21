FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for MySQL client and ML models (like XGBoost)
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Create a non-root user for security
RUN useradd -m celeryuser && chown -R celeryuser:celeryuser /app
USER celeryuser

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
