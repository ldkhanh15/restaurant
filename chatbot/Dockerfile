# ============================================
# Dockerfile for Chatbot Service (Python FastAPI)
# ============================================

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only required application files
COPY api_server.py .
COPY api_helpers.py .
COPY chatbot.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV BE_URL=http://backend:8000/api

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:7860/api/health', timeout=5)" || exit 1

# Run api_server.py directly
CMD ["python", "api_server.py"]

