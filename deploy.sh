#!/bin/bash

# ==============================================================================
#                      SENHOST AUTOMATIC DEPLOYMENT SCRIPT
# ==============================================================================
# This script automates the installation of dependencies, project building,
# PM2 process setup, Nginx reverse proxy configuration, and Certbot SSL.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions for clean output
print_header() {
    echo -e "\n${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}==============================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

print_error() {
    echo -e "${RED}[✘] $1${NC}"
}

print_step() {
    echo -e "${CYAN}--> $1...${NC}"
}

# 1. PARSE / PROMPT ARGUMENTS
print_header "Step 1: Configuration Input"

DOMAIN=$1
PORT=$2
EMAIL=$3

# Prompt for Domain if not provided
if [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}Please enter the domain name you want to use (e.g., example.com):${NC}"
    read -r DOMAIN
fi

# Validate domain input
if [ -z "$DOMAIN" ]; then
    print_error "Domain name is required. Exiting."
    exit 1
fi

# Prompt for Port if not provided
if [ -z "$PORT" ]; then
    echo -e "${YELLOW}Please enter the port to run Next.js on [default: 3000]:${NC}"
    read -r PORT
    if [ -z "$PORT" ]; then
        PORT=3000
    fi
fi

# Prompt for Email if not provided
if [ -z "$EMAIL" ]; then
    echo -e "${YELLOW}Please enter your email for Certbot SSL recovery (press Enter to register without email):${NC}"
    read -r EMAIL
fi

echo -e "\n${CYAN}Deployment Configuration summary:${NC}"
echo -e " - Domain: ${GREEN}$DOMAIN${NC}"
echo -e " - Port:   ${GREEN}$PORT${NC}"
echo -e " - Email:  ${GREEN}${EMAIL:-None (unsafe registration)}${NC}\n"

# 2. INSTALL SYSTEM DEPENDENCIES
print_header "Step 2: Checking and Installing System Dependencies"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check package manager (prefer Debian/Ubuntu apt)
if command_exists apt-get; then
    print_step "Updating package list"
    sudo apt-get update -y
    
    # Node.js
    if ! command_exists node; then
        print_step "Installing Node.js (via NodeSource LTS)"
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        print_success "Node.js installed successfully"
    else
        NODE_VER=$(node -v)
        print_success "Node.js is already installed ($NODE_VER)"
    fi

    # Nginx
    if ! command_exists nginx; then
        print_step "Installing Nginx"
        sudo apt-get install -y nginx
        print_success "Nginx installed successfully"
    else
        print_success "Nginx is already installed"
    fi

    # Certbot
    if ! command_exists certbot; then
        print_step "Installing Certbot and Nginx plugin"
        sudo apt-get install -y certbot python3-certbot-nginx
        print_success "Certbot installed successfully"
    else
        print_success "Certbot is already installed"
    fi
else
    print_warning "Apt package manager not found. Please ensure Node.js, Nginx, and Certbot are installed manually."
fi

# 3. INSTALL SITE & TEMPLATE DEPENDENCIES
print_header "Step 3: Installing Application & Template Dependencies"

# Root project dependencies
print_step "Installing dependencies for the main Next.js site"
npm install
print_success "Main project dependencies installed"

# Template dependencies
TEMPLATES_DIR="./templates"
if [ -d "$TEMPLATES_DIR" ]; then
    print_step "Scanning templates to install dependencies..."
    for d in "$TEMPLATES_DIR"/*/; do
        # Extract folder name
        dir_name=$(basename "$d")
        if [ -f "${d}package.json" ]; then
            print_step "Installing dependencies for template: $dir_name"
            (cd "$d" && npm install)
            print_success "Dependencies installed for template: $dir_name"
        else
            print_warning "No package.json found in template: $dir_name, skipping."
        fi
    done
else
    print_warning "Templates directory '$TEMPLATES_DIR' not found."
fi

# 4. BUILD THE NEXT.JS PROJECT
print_header "Step 4: Building Next.js Site"
print_step "Running Next.js build script"
npm run build
print_success "Application built successfully"

# 5. CONFIGURE PM2
print_header "Step 5: PM2 Process Setup"

# Check PM2 presence (local or global)
if ! npx pm2 -v >/dev/null 2>&1; then
    print_step "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
    print_success "PM2 installed globally"
fi

print_step "Starting/Restarting the application in PM2 on port $PORT"
# Delete existing PM2 instance if running
npx pm2 delete senhost 2>/dev/null || true

# Start Next.js with the configured port
PORT=$PORT npx pm2 start npm --name "senhost" --cwd "$(pwd)" -- start -- -p "$PORT"
print_success "PM2 application started"

# Save PM2 process list
print_step "Saving PM2 process configuration"
npx pm2 save
print_success "PM2 configuration saved"

# Highlight PM2 startup info
echo -e "${YELLOW}To make PM2 start on boot, please run the following command and copy the output instructions:${NC}"
echo -e "${BLUE}npx pm2 startup${NC}"

# 6. CONFIGURE NGINX
print_header "Step 6: Nginx Reverse Proxy Configuration"

NGINX_CONF_PATH="/etc/nginx/sites-available/$DOMAIN"
NGINX_LINK_PATH="/etc/nginx/sites-enabled/$DOMAIN"

print_step "Creating Nginx configuration block at $NGINX_CONF_PATH"

# Write the nginx server config block
sudo tee "$NGINX_CONF_PATH" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Custom configs or larger payloads if needed
    client_max_body_size 50M;
}
EOF

print_step "Enabling configuration by creating symlink to sites-enabled"
sudo ln -sf "$NGINX_CONF_PATH" "$NGINX_LINK_PATH"

# Deactivate default site if active and conflicting
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    print_step "Deactivating default Nginx server block to prevent conflicts"
    sudo rm -f "/etc/nginx/sites-enabled/default"
fi

print_step "Testing Nginx configuration"
if sudo nginx -t; then
    print_success "Nginx configuration syntax is valid"
    print_step "Reloading Nginx service"
    sudo systemctl reload nginx || sudo service nginx reload
    print_success "Nginx reloaded successfully"
else
    print_error "Nginx configuration test failed! Please check manually."
    exit 1
fi

# 7. CERTIFY DOMAIN WITH CERTBOT
print_header "Step 7: SSL Certification via Certbot"

print_step "Acquiring Let's Encrypt SSL certificate for $DOMAIN"

# Attempt running certbot
CERTBOT_ARGS="--nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect"
if [ -n "$EMAIL" ]; then
    CERTBOT_ARGS="$CERTBOT_ARGS --email $EMAIL"
else
    CERTBOT_ARGS="$CERTBOT_ARGS --register-unsafely-without-email"
fi

if sudo certbot $CERTBOT_ARGS; then
    print_success "SSL Certificate successfully configured for $DOMAIN!"
else
    print_warning "Certbot was unable to automatically configure SSL."
    print_warning "Please ensure your domain DNS A-records point to this server's IP address and port 80 is open."
    print_warning "You can retry SSL configuration manually by running:"
    echo -e "${BLUE}sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
fi

print_header "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo -e "Your site should be live at: ${GREEN}https://$DOMAIN${NC} (proxying to port $PORT)"
echo -e "Check the status of your app using: ${BLUE}npx pm2 status${NC}"
echo -e "View app logs using: ${BLUE}npx pm2 logs senhost${NC}"
echo -e "==============================================================================\n"
