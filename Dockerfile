FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend source and build
COPY ui/ ./ui/
RUN cd ui && npm install && npm run build

# Copy backend source
COPY app/ ./app/

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]