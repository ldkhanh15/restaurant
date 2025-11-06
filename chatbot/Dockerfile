# Chatbot - Python FastAPI
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements if exists, otherwise create one
COPY requirements.txt* ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        pip install --no-cache-dir \
            fastapi==0.115.0 \
            uvicorn[standard]==0.30.0 \
            requests==2.31.0 \
            google-generativeai==0.8.0 \
            Pillow==10.4.0 \
            python-magic==0.4.27 \
            pydantic==2.9.0; \
    fi

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs && \
    touch logs/chatbot.log

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:7860/api/health').raise_for_status()" || exit 1

# Run FastAPI server
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "7860"]

