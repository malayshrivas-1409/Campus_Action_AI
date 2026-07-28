#!/bin/bash

# Campus Action AI - Setup Script
# This script initializes the development environment

set -e

echo "🚀 Campus Action AI - Setup"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

echo "✅ Docker and Python are installed"
echo ""

# Setup backend environment
echo "🔧 Setting up backend..."
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your GROQ_API_KEY"
    echo "    Get one from: https://console.groq.com"
else
    echo "✅ backend/.env already exists"
fi
echo ""

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build
echo "✅ Docker images built"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d
echo "✅ Services started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10
echo ""

# Check health
echo "🏥 Checking service health..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend might still be starting..."
fi
echo ""

# Print next steps
echo "✨ Setup complete!"
echo ""
echo "📱 Access the application:"
echo "  - Frontend:  http://localhost:5173"
echo "  - Backend:   http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo ""
echo "🔑 Next steps:"
echo "  1. Edit backend/.env with your GROQ_API_KEY (if not done already)"
echo "  2. Restart backend: docker-compose restart backend"
echo "  3. Open http://localhost:5173 in your browser"
echo ""
echo "📖 For more info, see README.md"
