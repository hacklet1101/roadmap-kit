#!/bin/sh

# ROADMAP-KIT Entrypoint
# Runs scanner and starts Vite dashboard

set -e

echo "🗺️  ROADMAP-KIT Docker Container"
echo "================================="

# Check if roadmap.json exists
if [ ! -f /app/roadmap.json ]; then
    echo "⚠️  roadmap.json not found"
    echo "Creating from template..."
    cp /app/templates/roadmap.template.json /app/roadmap.json
fi

# Run scanner to update roadmap
echo "🔄 Scanning Git history..."
cd /app
node scanner.js || echo "⚠️  Scanner failed (might not be a git repo)"

# Copy roadmap.json to dashboard public folder
echo "📋 Copying roadmap to dashboard..."
mkdir -p /app/dashboard/public
cp /app/roadmap.json /app/dashboard/public/roadmap.json

# Start Vite dev server
echo "🚀 Starting dashboard on http://localhost:3001"
cd /app/dashboard
exec npm run dev -- --host 0.0.0.0
