# ============================================
# Multi-stage Dockerfile for Admin Web (Next.js + Nginx)
# ============================================

# Stage 1: Dependencies - Install dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Set Node.js memory limit for dependency installation
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy package files
COPY package*.json ./

# Install dependencies with cache mount (BuildKit feature)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Stage 2: Builder - Build Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Set Node.js memory limit for build (512MB for Next.js build)
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (excluding files in .dockerignore)
COPY . .

# Set build-time environment variables from build args
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js application with cache mount for .next cache
RUN --mount=type=cache,target=/app/.next/cache \
    set -e && \
    echo "Building with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" && \
    npm run build && \
    echo "Build completed successfully" && \
    ls -la .next/ && \
    if [ ! -d ".next/standalone" ]; then \
    echo "ERROR: .next/standalone directory not found!" && \
    echo "Build output:" && \
    ls -la .next/ && \
    exit 1; \
    fi

# Stage 3: Runner - Production (Next.js Standalone Only)
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built Next.js standalone application
# Next.js standalone output structure:
# - .next/standalone/ contains the server
# - .next/static/ contains static assets
# - public/ contains public files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
# Limit Node.js memory for production (96MB heap for frontend)
ENV NODE_OPTIONS="--max-old-space-size=96"

# Health check (accept 200 or 307 redirect)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/', (r) => process.exit([200, 307].includes(r.statusCode) ? 0 : 1))"

# Start Next.js standalone server
CMD ["node", "server.js"]
