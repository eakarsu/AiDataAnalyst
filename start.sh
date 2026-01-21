#!/bin/bash

# AI Data Analyst - Start Script
# This script cleans up ports, sets up the database, seeds data, and starts the application

set -e

echo "========================================"
echo "   AI Data Analyst - Starting Up"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3001
FRONTEND_PORT=5173
DB_NAME="ai_data_analyst"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to clean up ports
cleanup_ports() {
    print_status "Cleaning up ports..."

    # Kill process on backend port
    if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
        print_warning "Port $BACKEND_PORT is in use. Killing process..."
        kill -9 $(lsof -t -i :$BACKEND_PORT) 2>/dev/null || true
        sleep 1
    fi

    # Kill process on frontend port
    if lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
        print_warning "Port $FRONTEND_PORT is in use. Killing process..."
        kill -9 $(lsof -t -i :$FRONTEND_PORT) 2>/dev/null || true
        sleep 1
    fi

    print_success "Ports cleaned up"
}

# Function to check PostgreSQL
check_postgres() {
    print_status "Checking PostgreSQL..."

    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed. Please install it first."
        exit 1
    fi

    # Check if PostgreSQL is running
    if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        print_warning "PostgreSQL is not running. Attempting to start..."

        # Try to start PostgreSQL (macOS)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        fi

        sleep 3

        if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
            print_error "Could not start PostgreSQL. Please start it manually."
            exit 1
        fi
    fi

    print_success "PostgreSQL is running"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."

    # Create database if it doesn't exist
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME" 2>/dev/null || true

    print_success "Database ready"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    cd "$(dirname "$0")"

    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..

    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..

    print_success "Dependencies installed"
}

# Function to seed database
seed_database() {
    print_status "Seeding database with sample data..."

    cd "$(dirname "$0")/backend"
    npm run seed
    cd ..

    print_success "Database seeded with 15+ items per feature"
}

# Function to start the application
start_application() {
    print_status "Starting the application..."

    cd "$(dirname "$0")"

    # Start backend in background
    print_status "Starting backend server on port $BACKEND_PORT..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to be ready
    sleep 3

    # Start frontend in background
    print_status "Starting frontend server on port $FRONTEND_PORT..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    # Wait for frontend to be ready
    sleep 3

    echo ""
    echo "========================================"
    print_success "Application started successfully!"
    echo "========================================"
    echo ""
    echo -e "${GREEN}Frontend:${NC} http://localhost:$FRONTEND_PORT"
    echo -e "${GREEN}Backend:${NC}  http://localhost:$BACKEND_PORT"
    echo ""
    echo -e "${YELLOW}Demo Credentials:${NC}"
    echo "  Email:    demo@aianalyst.com"
    echo "  Password: demo123456"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""

    # Handle Ctrl+C
    trap "echo ''; print_status 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_success 'Servers stopped'; exit 0" INT

    # Keep script running
    wait
}

# Main execution
main() {
    cd "$(dirname "$0")"

    echo ""

    # Step 1: Clean up ports
    cleanup_ports
    echo ""

    # Step 2: Check PostgreSQL
    check_postgres
    echo ""

    # Step 3: Setup database
    setup_database
    echo ""

    # Step 4: Install dependencies
    install_dependencies
    echo ""

    # Step 5: Seed database
    seed_database
    echo ""

    # Step 6: Start the application
    start_application
}

# Run main function
main
