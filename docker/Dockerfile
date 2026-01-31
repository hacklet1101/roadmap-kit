# ROADMAP-KIT Dockerfile
# Lightweight Node.js image for running the dashboard

FROM node:20-alpine

# Install git (required for scanner)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy roadmap-kit files
COPY package.json ./
COPY scanner.js ./
COPY cli.js ./
COPY dashboard ./dashboard

# Install dependencies
RUN npm install

# Install dashboard dependencies
WORKDIR /app/dashboard
RUN npm install

# Back to root
WORKDIR /app

# Expose port
EXPOSE 3001

# Set entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
