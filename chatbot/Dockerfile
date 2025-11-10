# ============================================
# Multi-stage Dockerfile for Chatbot Service (Python FastAPI)
# Optimized for minimal memory usage
# ============================================

# Stage 1: Builder - Install dependencies
FROM python:3.10-slim AS builder

WORKDIR /app

# Install only build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runner - Production image
FROM python:3.10-slim AS runner

WORKDIR /app

# Install only runtime dependencies (no gcc needed)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy only required application files
COPY api_server.py .
COPY api_helpers.py .
COPY chatbot.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV BE_URL=http://backend:8000/api
# Limit Python memory (optional, helps with large requests)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONHASHSEED=random

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:7860/api/health', timeout=5)" || exit 1

# Run api_server.py directly
CMD ["python", "api_server.py"]

