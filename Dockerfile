# Base image (lightweight Node.js Debian-slim with glibc support)
FROM node:22-slim

# Install CA certificates to enable trusted HTTPS requests inside the container
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the client and server bundles
RUN npm run build

# Expose the port that the application runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application using start.js script to bridge environment variables
CMD ["node", "start.js"]
