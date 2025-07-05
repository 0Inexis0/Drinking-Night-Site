#!/bin/bash

# Drinking Nights Tracker - Linux Start Script

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Set server IP address
export HOST=45.81.233.134
export PORT=3000

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting Drinking Nights Tracker server on $HOST:$PORT..."
node server.js

# Keep the script running
exec $SHELL 