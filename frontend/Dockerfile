# Multi-stage build for React application

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install Node.js for serving the app in development
RUN apk add --no-cache nodejs npm

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the source for development mode
COPY --from=builder /app /app

WORKDIR /app

# Expose port
EXPOSE 3000

# For development, we'll run npm start instead of nginx
CMD ["npm", "start"]
