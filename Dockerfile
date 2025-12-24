# Build stage
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL (can be overridden at build time)
ARG VITE_PUPIL_AGENTS_API=https://pupiltree-agents-31151155377.asia-south1.run.app
ENV VITE_PUPIL_AGENTS_API=${VITE_PUPIL_AGENTS_API}

ARG VITE_PUPILTREEAI_BASE_URL=https://pupiltree-ai-31151155377.asia-south1.run.app
ENV VITE_PUPILTREEAI_BASE_URL=${VITE_PUPILTREEAI_BASE_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
