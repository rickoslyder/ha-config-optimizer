#!/bin/bash
# Deployment wrapper script for Home Assistant LLM Config Optimizer addon

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

# Check for virtual environment and use it
PYTHON_CMD="python3"
PIP_CMD="pip3"

if [ -d "venv" ]; then
    print_info "Using virtual environment..."
    source venv/bin/activate
    PYTHON_CMD="python"
    PIP_CMD="pip"
elif [ -d "env" ]; then
    print_info "Using virtual environment..."
    source env/bin/activate
    PYTHON_CMD="python"
    PIP_CMD="pip"
fi

# Check if deployment requirements are installed
if ! $PYTHON_CMD -c "import watchdog" &> /dev/null; then
    print_warning "Installing deployment requirements..."
    if ! $PIP_CMD install -r deploy_requirements.txt; then
        print_error "Failed to install deployment requirements"
        print_info "Try creating a virtual environment first:"
        print_info "  python3 -m venv venv"
        print_info "  source venv/bin/activate"
        print_info "  pip install -r deploy_requirements.txt"
        exit 1
    fi
fi

# Parse command line arguments
WATCH_MODE=false
CONFIG_ONLY=false
CLEAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch|-w)
            WATCH_MODE=true
            shift
            ;;
        --config-only|-c)
            CONFIG_ONLY=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Deploy Home Assistant LLM Config Optimizer addon via Samba"
            echo ""
            echo "Options:"
            echo "  --watch, -w        Watch for file changes and auto-deploy"
            echo "  --config-only, -c  Only deploy configuration files"
            echo "  --clean           Clean remote addon directory first"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                 Deploy once"
            echo "  $0 --watch        Deploy and watch for changes"
            echo "  $0 --config-only  Deploy only config files"
            echo "  $0 --clean        Clean and deploy everything"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build command
CMD="$PYTHON_CMD deploy.py"

if [ "$WATCH_MODE" = true ]; then
    CMD="$CMD --watch"
fi

if [ "$CONFIG_ONLY" = true ]; then
    CMD="$CMD --config-only"
fi

if [ "$CLEAN" = true ]; then
    CMD="$CMD --clean"
fi

# Print banner
echo "🏠🤖 Home Assistant LLM Config Optimizer - Deployment Tool"
echo "=========================================================="
print_info "Starting deployment process..."

# Execute deployment
eval $CMD

# Success message
if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "  1. Go to Home Assistant > Settings > Add-ons"
    echo "  2. Find 'LLM Config Optimizer' in Local add-ons"
    echo "  3. Click 'Install' (if first time) or 'Restart' (if updating)"
    echo "  4. Start the add-on and open the web interface"
else
    print_error "Deployment failed!"
    exit 1
fi