#!/bin/bash

# ============================================================
# ROADMAP-KIT Setup Script
# ============================================================
# This script sets up roadmap-kit in your project.
# Run from the root of the project where roadmap-kit folder exists.
#
# Usage:
#   cd your-project
#   ./roadmap-kit/setup.sh
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default port
DEFAULT_PORT=6969

echo ""
echo -e "${CYAN}  ╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║       🗺️  ROADMAP-KIT Setup           ║${NC}"
echo -e "${CYAN}  ╚═══════════════════════════════════════╝${NC}"
echo ""

# ============ CHECKS ============

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Please install Node.js 18+ first: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version is too old (v$NODE_VERSION)${NC}"
    echo "  Please upgrade to Node.js 18 or higher"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"

# Detect if we're running from inside roadmap-kit or from project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"roadmap-kit"* ]]; then
    # Running from within roadmap-kit, go to parent
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_ROOT"
else
    PROJECT_ROOT="$(pwd)"
fi

echo -e "${GREEN}✓${NC} Project root: $PROJECT_ROOT"

# Check if roadmap-kit folder exists
if [ ! -d "roadmap-kit" ]; then
    echo -e "${RED}✗ roadmap-kit folder not found${NC}"
    echo "  Make sure you copied the roadmap-kit folder to your project root."
    exit 1
fi

echo -e "${GREEN}✓${NC} roadmap-kit folder found"
echo ""

# ============ INSTALL DEPENDENCIES ============

echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Install roadmap-kit root dependencies
cd roadmap-kit
if [ ! -d "node_modules" ]; then
    npm install --silent
    echo -e "${GREEN}✓${NC} CLI dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} CLI dependencies already installed"
fi

# Install dashboard dependencies
cd dashboard
if [ ! -d "node_modules" ]; then
    npm install --silent
    echo -e "${GREEN}✓${NC} Dashboard dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dashboard dependencies already installed"
fi

cd "$PROJECT_ROOT"
echo ""

# ============ CREATE ROADMAP.JSON ============

if [ ! -f "roadmap-kit/roadmap.json" ]; then
    echo -e "${BLUE}📋 Creating roadmap.json...${NC}"

    if [ -f "roadmap-kit/templates/roadmap.template.json" ]; then
        cp roadmap-kit/templates/roadmap.template.json roadmap-kit/roadmap.json
        echo -e "${GREEN}✓${NC} roadmap.json created"
    else
        # Create minimal roadmap.json
        cat > roadmap-kit/roadmap.json << 'EOF'
{
  "project_info": {
    "name": "My Project",
    "version": "1.0.0",
    "description": "Project description",
    "purpose": "Project purpose",
    "stack": [],
    "architecture": "",
    "total_progress": 0,
    "last_sync": null,
    "conventions": {
      "naming": {},
      "file_structure": "",
      "database": "",
      "styling": "",
      "error_handling": ""
    },
    "shared_resources": {
      "ui_components": [],
      "utilities": [],
      "database_tables": []
    }
  },
  "features": []
}
EOF
        echo -e "${GREEN}✓${NC} roadmap.json created (minimal template)"
    fi
else
    echo -e "${YELLOW}⚠${NC} roadmap.json already exists"
fi

# ============ ADD NPM SCRIPTS ============

if [ -f "package.json" ]; then
    echo ""
    echo -e "${BLUE}📝 Checking package.json scripts...${NC}"

    if grep -q '"roadmap"' package.json 2>/dev/null; then
        echo -e "${YELLOW}⚠${NC} npm scripts already configured"
    else
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['roadmap'] = 'cd ./roadmap-kit/dashboard && npm run dev';
        pkg.scripts['roadmap:scan'] = 'node ./roadmap-kit/scanner.js';
        pkg.scripts['roadmap:build'] = 'cd ./roadmap-kit/dashboard && npm run build';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        " 2>/dev/null && echo -e "${GREEN}✓${NC} npm scripts added" || echo -e "${YELLOW}⚠${NC} Could not add npm scripts (add manually)"
    fi
fi

# ============ CREATE .CLINERULES ============

echo ""
AI_RULES_FILE=".clinerules"
if [ -f ".cursorrules" ]; then
    AI_RULES_FILE=".cursorrules"
fi

if [ ! -f "$AI_RULES_FILE" ]; then
    if [ -f "roadmap-kit/templates/clinerules.template" ]; then
        echo -e "${BLUE}📜 Creating $AI_RULES_FILE...${NC}"
        cp roadmap-kit/templates/clinerules.template "$AI_RULES_FILE"
        echo -e "${GREEN}✓${NC} $AI_RULES_FILE created"
    fi
else
    echo -e "${YELLOW}⚠${NC} $AI_RULES_FILE already exists"
fi

# ============ CREATE ADMIN USER ============

echo ""
echo -e "${CYAN}🔐 Admin Account Setup${NC}"
echo ""

if [ -f "roadmap-kit/auth.json" ]; then
    echo -e "${YELLOW}⚠${NC} auth.json already exists"
    read -p "   Overwrite with new credentials? (y/N) " -n 1 -r
    echo ""
    CREATE_AUTH=$REPLY
else
    CREATE_AUTH="y"
fi

if [[ $CREATE_AUTH =~ ^[Yy]$ ]]; then
    # Ask for admin email
    read -p "   Admin email: " ADMIN_EMAIL
    if [ -z "$ADMIN_EMAIL" ]; then
        ADMIN_EMAIL="admin@localhost"
    fi

    # Ask for admin password (hidden input)
    echo -n "   Admin password: "
    read -s ADMIN_PASSWORD
    echo ""

    if [ -z "$ADMIN_PASSWORD" ]; then
        ADMIN_PASSWORD="Admin123!"
        echo -e "   ${YELLOW}⚠${NC} Using default password: Admin123!"
    fi

    # Ask for admin name
    read -p "   Admin name [Admin]: " ADMIN_NAME
    if [ -z "$ADMIN_NAME" ]; then
        ADMIN_NAME="Admin"
    fi

    # Generate auth.json with hashed password using Node.js
    echo -e "${BLUE}🔑 Creating auth.json...${NC}"

    node -e "
    const crypto = require('crypto');
    const fs = require('fs');

    function hashPassword(password) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString('hex');
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(salt + ':' + derivedKey.toString('hex'));
            });
        });
    }

    async function createAuth() {
        const hashedPassword = await hashPassword('${ADMIN_PASSWORD}');
        const config = {
            settings: {
                requireAuth: true,
                sessionDuration: 86400000,
                allowRegistration: false
            },
            users: [{
                id: 'user-' + Date.now(),
                name: '${ADMIN_NAME}',
                email: '${ADMIN_EMAIL}',
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date().toISOString(),
                lastLogin: null
            }]
        };
        fs.writeFileSync('roadmap-kit/auth.json', JSON.stringify(config, null, 2), 'utf-8');
    }

    createAuth().catch(console.error);
    " 2>/dev/null && echo -e "${GREEN}✓${NC} auth.json created with your credentials" || echo -e "${RED}✗${NC} Failed to create auth.json"
fi

# ============ NGINX CONFIGURATION (OPTIONAL) ============

echo ""
echo -e "${CYAN}🌐 Server Configuration${NC}"
echo ""
read -p "   Configure for production server with Nginx? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""

    # Ask for domain
    read -p "   Domain (e.g., midominio.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost"
    fi

    # Ask for port
    read -p "   Dashboard port [${DEFAULT_PORT}]: " CUSTOM_PORT
    if [ -z "$CUSTOM_PORT" ]; then
        CUSTOM_PORT=$DEFAULT_PORT
    fi

    # Ask for SSL
    read -p "   Enable SSL/HTTPS? (y/N) " -n 1 -r SSL_REPLY
    echo ""

    SSL_FLAG=""
    if [[ $SSL_REPLY =~ ^[Yy]$ ]]; then
        SSL_FLAG="--ssl"

        # Check for Let's Encrypt cert
        CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"
        if [ -f "${CERT_PATH}/fullchain.pem" ]; then
            echo -e "   ${GREEN}✓${NC} SSL certificate found at ${CERT_PATH}"
        else
            echo -e "   ${YELLOW}⚠${NC} SSL certificate not found"
            echo -e "   ${YELLOW}  Generate with: sudo certbot certonly --nginx -d ${DOMAIN}${NC}"
        fi
    fi

    # Ask for main app port (optional)
    read -p "   Main app port (leave empty to skip): " APP_PORT
    APP_PORT_FLAG=""
    if [ -n "$APP_PORT" ]; then
        APP_PORT_FLAG="--app-port ${APP_PORT}"
    fi

    # Generate nginx config
    echo ""
    echo -e "${BLUE}📄 Generating Nginx configuration...${NC}"

    cd "$PROJECT_ROOT"
    node roadmap-kit/cli.js nginx --domain "$DOMAIN" --port "$CUSTOM_PORT" $SSL_FLAG $APP_PORT_FLAG

    echo ""
fi

# ============ SUCCESS MESSAGE ============

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ ROADMAP-KIT installed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🚀 Quick Start (Local):${NC}"
echo ""
echo -e "   ${BLUE}1.${NC} Open dashboard:"
echo -e "      ${YELLOW}cd roadmap-kit/dashboard && npm run dev${NC}"
echo -e "      or: ${YELLOW}npm run roadmap${NC} (if package.json exists)"
echo ""
echo -e "   ${BLUE}2.${NC} Open in browser:"
echo -e "      ${YELLOW}http://localhost:${DEFAULT_PORT}${NC}"
echo ""
echo -e "   ${BLUE}3.${NC} Login with your configured credentials"
if [ -n "$ADMIN_EMAIL" ]; then
    echo -e "      Email: ${YELLOW}${ADMIN_EMAIL}${NC}"
fi
echo ""
echo -e "${CYAN}📋 Files created:${NC}"
echo -e "   • roadmap-kit/roadmap.json - Project state"
echo -e "   • $AI_RULES_FILE - AI coding rules"
if [ -f "nginx-roadmap.conf" ]; then
    echo -e "   • nginx-roadmap.conf - Nginx configuration"
fi
echo ""
echo -e "${CYAN}🔧 CLI Commands:${NC}"
echo -e "   • ${YELLOW}node roadmap-kit/cli.js dashboard${NC}  - Open dashboard"
echo -e "   • ${YELLOW}node roadmap-kit/cli.js scan${NC}       - Sync with Git"
echo -e "   • ${YELLOW}node roadmap-kit/cli.js nginx${NC}      - Generate Nginx config"
echo -e "   • ${YELLOW}node roadmap-kit/cli.js docker${NC}     - Generate Docker config"
echo ""
echo -e "${CYAN}🐳 Docker:${NC}"
echo -e "   ${YELLOW}cd roadmap-kit/docker && docker-compose up${NC}"
echo ""
