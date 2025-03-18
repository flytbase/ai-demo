# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install runtime dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3

# Copy built assets from build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]