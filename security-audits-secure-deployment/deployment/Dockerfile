# ─── Secure Dockerfile ───────────────────────────────────────────────────────
# Week 6: Docker Security Best Practices

# Stage 1: Build
FROM node:20-alpine AS builder

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy dependency files first (layer caching)
COPY package*.json ./

# Install production deps only
RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY --chown=appuser:appgroup . .

# Stage 2: Production image (minimal attack surface)
FROM node:20-alpine AS production

# Security hardening
RUN apk add --no-cache dumb-init && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/week4 ./week4
COPY --from=builder --chown=appuser:appgroup /app/package.json .

# Switch to non-root user
USER appuser

# Expose app port (not privileged)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "week4/server.js"]
