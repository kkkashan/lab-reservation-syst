# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template (uses envsubst for BACKEND_URL)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Expose port
EXPOSE 80

# BACKEND_URL env var — set at deploy time in Azure Container Apps
# For docker-compose, defaults to http://backend:3001
ENV BACKEND_URL=http://backend:3001

# Only substitute BACKEND_URL — leave nginx variables ($host, $uri, etc.) alone
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

# Health check (use 127.0.0.1 — Alpine resolves localhost to ::1 IPv6 first)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/health || exit 1

# nginx:alpine auto-processes /etc/nginx/templates/*.template at startup
CMD ["nginx", "-g", "daemon off;"]
