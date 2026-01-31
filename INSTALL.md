# ROADMAP-KIT - Installation Guide

## Requirements

- **Node.js 18+** - [Download](https://nodejs.org)
- **Git** (optional, for commit tracking)

---

## Quick Install (Local)

```bash
# 1. Copy roadmap-kit to your project
cp -r /path/to/roadmap-kit /your-project/

# 2. Run setup
cd /your-project
./roadmap-kit/setup.sh

# 3. Open dashboard
cd roadmap-kit/dashboard && npm run dev

# 4. Open browser
open http://localhost:6969
```

---

## Detailed Installation

### Step 1: Copy to Your Project

```bash
# Option A: Copy folder
cp -r roadmap-kit /path/to/your-project/

# Option B: Clone from repo (if published)
cd /your-project
git clone https://github.com/hacklet1101/roadmap-kit.git
```

### Step 2: Run Setup Script

```bash
cd /your-project
./roadmap-kit/setup.sh
```

The setup will:
1. Install Node.js dependencies
2. Create `roadmap.json` (project state)
3. Create `.clinerules` (AI coding rules)
4. **Ask for admin credentials** (email, password, name)
5. Optionally generate Nginx configuration

### Step 3: Start Dashboard

```bash
# Option A: Direct
cd roadmap-kit/dashboard && npm run dev

# Option B: Via npm script (if package.json exists)
npm run roadmap

# Option C: Via CLI
node roadmap-kit/cli.js dashboard
```

### Step 4: Access Dashboard

Open **http://localhost:6969** and login with your configured credentials.

---

## Server Installation (Production)

### Option 1: Dedicated Port (Recommended)

Access via `https://yourdomain.com:6969`

#### 1. Setup on Server

```bash
cd /var/www/your-project
./roadmap-kit/setup.sh
```

When prompted:
- Enter your admin email and password
- Select **Yes** for Nginx configuration
- Enter your domain name
- Enable SSL if you have certificates

#### 2. Install Nginx Config

```bash
sudo cp nginx-roadmap.conf /etc/nginx/sites-available/roadmap-yourdomain
sudo ln -s /etc/nginx/sites-available/roadmap-yourdomain /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### 3. Open Firewall Port

```bash
sudo ufw allow 6969
```

#### 4. Run Dashboard (with PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start dashboard
cd /var/www/your-project/roadmap-kit/dashboard
pm2 start server.js --name roadmap-dashboard

# Auto-start on boot
pm2 save
pm2 startup
```

#### 5. Access

```
https://yourdomain.com:6969
```

---

### Option 2: Docker

#### 1. Generate Docker Config

```bash
node roadmap-kit/cli.js docker
```

#### 2. Run with Docker Compose

```bash
docker-compose -f docker-roadmap.yml up -d
```

#### 3. Custom Port

```bash
ROADMAP_PORT=8080 docker-compose -f docker-roadmap.yml up -d
```

---

### Option 3: Custom Port via Environment Variable

```bash
# Start on different port
PORT=8080 node roadmap-kit/dashboard/server.js

# Or with npm
PORT=8080 npm run roadmap
```

---

## SSL Configuration

### With Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com

# Re-run setup with SSL
./roadmap-kit/setup.sh
# Select: Enable SSL/HTTPS? (y)
```

### Manual SSL

If you have your own certificates:

```bash
node roadmap-kit/cli.js nginx \
  --domain yourdomain.com \
  --ssl \
  --cert-path /path/to/certs
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Dashboard port | `6969` |
| `ROADMAP_ADMIN_EMAIL` | Default admin email | `admin@localhost` |
| `ROADMAP_ADMIN_PASSWORD` | Default admin password | `Admin123!` |
| `ROADMAP_ADMIN_NAME` | Default admin name | `Admin` |
| `BASE_PATH` | URL base path (for subpath deployment) | `/` |

### Example: Start with Custom Config

```bash
PORT=8080 \
ROADMAP_ADMIN_EMAIL=admin@mycompany.com \
ROADMAP_ADMIN_PASSWORD=SecurePass123! \
node roadmap-kit/dashboard/server.js
```

---

## CLI Commands Reference

```bash
# Initialize roadmap in project
node roadmap-kit/cli.js init

# Scan Git history and update roadmap
node roadmap-kit/cli.js scan

# Open dashboard
node roadmap-kit/cli.js dashboard

# Generate Docker configuration
node roadmap-kit/cli.js docker

# Generate Nginx configuration
node roadmap-kit/cli.js nginx --domain example.com --ssl
```

### Nginx Command Options

```bash
node roadmap-kit/cli.js nginx \
  --domain yourdomain.com \    # Your domain
  --port 6969 \                # Dashboard port (default: 6969)
  --ssl \                      # Enable HTTPS
  --app-port 3000 \            # Main app port (optional)
  --cert-path /etc/letsencrypt/live/yourdomain.com
```

---

## File Structure After Installation

```
your-project/
├── .clinerules              # AI coding rules
├── package.json             # (updated with roadmap scripts)
├── nginx-roadmap.conf       # (if configured for server)
└── roadmap-kit/
    ├── auth.json            # User credentials (created by setup)
    ├── roadmap.json         # Project state
    ├── cli.js               # CLI tool
    ├── scanner.js           # Git commit scanner
    ├── setup.sh             # Installation script
    ├── dashboard/           # React dashboard
    │   ├── server.js        # Express + Vite server
    │   └── src/             # React components
    ├── docker/              # Docker configuration
    └── templates/           # Template files
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :6969

# Kill process
kill -9 <PID>

# Or use different port
PORT=7070 npm run roadmap
```

### Permission Denied on setup.sh

```bash
chmod +x roadmap-kit/setup.sh
./roadmap-kit/setup.sh
```

### Node.js Version Too Old

```bash
# Check version
node -v

# Install Node 18+ via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Dashboard Not Loading

```bash
# Reinstall dependencies
cd roadmap-kit/dashboard
rm -rf node_modules
npm install
npm run dev
```

### SSL Certificate Not Found

```bash
# Generate with certbot
sudo certbot certonly --nginx -d yourdomain.com

# Verify certificate exists
ls -la /etc/letsencrypt/live/yourdomain.com/
```

### Forgot Admin Password

```bash
# Delete auth.json and re-run setup
rm roadmap-kit/auth.json
./roadmap-kit/setup.sh
```

---

## Updating

```bash
# Backup your data
cp roadmap-kit/roadmap.json roadmap-kit/roadmap.json.bak
cp roadmap-kit/auth.json roadmap-kit/auth.json.bak

# Replace roadmap-kit folder (preserving config)
rm -rf roadmap-kit/dashboard roadmap-kit/cli.js roadmap-kit/scanner.js
cp -r /path/to/new/roadmap-kit/* roadmap-kit/

# Restore config
cp roadmap-kit/roadmap.json.bak roadmap-kit/roadmap.json
cp roadmap-kit/auth.json.bak roadmap-kit/auth.json

# Reinstall dependencies
cd roadmap-kit && npm install
cd dashboard && npm install
```

---

## Support

- **Issues**: https://github.com/hacklet1101/roadmap-kit/issues
- **Documentation**: https://roadmap.ink/docs
