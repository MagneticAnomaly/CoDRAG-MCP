#!/bin/bash
# CLaRa-Remembers-It-All - One-Command Setup
# Usage: curl -fsSL https://raw.githubusercontent.com/EricBintner/CLaRa-Remembers-It-All/main/setup.sh | bash

set -e

echo "🧠 CLaRa-Remembers-It-All Setup"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Python version
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    if [[ $(echo "$PYTHON_VERSION >= 3.10" | bc -l 2>/dev/null || python3 -c "print(1 if $PYTHON_VERSION >= 3.10 else 0)") == 1 ]]; then
        PYTHON_CMD="python3"
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Python 3.10+ required. Please install Python 3.10 or later."
    exit 1
fi

echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION found"

# Clone if not already in repo
if [ ! -f "pyproject.toml" ] || ! grep -q "clara-remembers-it-all" pyproject.toml 2>/dev/null; then
    echo -e "${BLUE}→${NC} Cloning repository..."
    git clone https://github.com/EricBintner/CLaRa-Remembers-It-All.git
    cd CLaRa-Remembers-It-All
else
    echo -e "${GREEN}✓${NC} Already in CLaRa-Remembers-It-All directory"
fi

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo -e "${BLUE}→${NC} Creating virtual environment..."
    $PYTHON_CMD -m venv .venv
fi

# Activate and install
echo -e "${BLUE}→${NC} Installing dependencies..."
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -e .

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the server:"
echo "  cd CLaRa-Remembers-It-All"
echo "  source .venv/bin/activate"
echo "  clara-server"
echo ""
echo "Or run directly:"
echo "  cd CLaRa-Remembers-It-All && source .venv/bin/activate && clara-server"
echo ""
echo "First run downloads the model (~14GB, takes 5-10 min)"
echo "Server will be available at: http://localhost:8765"
