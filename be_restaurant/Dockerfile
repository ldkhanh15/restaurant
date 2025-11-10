# ============================================
# Multi-stage Dockerfile for Backend (be_restaurant)
# ============================================

# Stage 1: Builder - Install dependencies and build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Set Node.js memory limit for build (reduce from default)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with cache mount (BuildKit feature)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production=false --prefer-offline --no-audit

# Copy source code
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Runner - Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy swagger.yaml for API documentation
COPY swagger.yaml ./

# Copy .env file (if exists)
COPY .env* ./

# Create directories for uploads and logs
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Set Node.js memory limit for production (256MB heap for backend)
ENV NODE_OPTIONS="--max-old-space-size=256"

# Health check - increased start_period for database sync
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]

