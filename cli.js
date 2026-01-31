#!/usr/bin/env node

/**
 * ROADMAP-KIT CLI
 * Command-line interface for roadmap management
 * Supports: init, scan, dashboard, docker
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { scanGitHistory } from './scanner.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

/**
 * Detect project environment (JS, Python, Go, etc.)
 */
function detectEnvironment(projectRoot) {
  const files = {
    'package.json': 'javascript',
    'requirements.txt': 'python',
    'Pipfile': 'python',
    'go.mod': 'go',
    'Cargo.toml': 'rust',
    'pom.xml': 'java',
    'build.gradle': 'java',
    'Gemfile': 'ruby',
    'composer.json': 'php'
  };

  for (const [file, env] of Object.entries(files)) {
    if (existsSync(join(projectRoot, file))) {
      return env;
    }
  }

  return 'generic';
}

/**
 * Get AI rules filename based on detected AI tool
 */
function getAIRulesFilename(projectRoot) {
  // Check for existing AI tool config files
  if (existsSync(join(projectRoot, '.clinerules'))) {
    return '.clinerules';
  }
  if (existsSync(join(projectRoot, '.cursorrules'))) {
    return '.cursorrules';
  }
  if (existsSync(join(projectRoot, '.windsurfrules'))) {
    return '.windsurfrules';
  }

  // Default to .clinerules
  return '.clinerules';
}

/**
 * Initialize roadmap in project
 */
async function initRoadmap(options) {
  const projectRoot = options.path || process.cwd();
  const spinner = ora('Initializing roadmap...').start();

  try {
    // Detect environment
    const env = detectEnvironment(projectRoot);
    spinner.text = `Detected ${env} project...`;

    // Paths
    const roadmapPath = join(projectRoot, 'roadmap.json');
    const rulesPath = join(projectRoot, getAIRulesFilename(projectRoot));
    const templatePath = join(__dirname, 'templates', 'roadmap.template.json');
    const rulesTemplatePath = join(__dirname, 'templates', 'clinerules.template');

    // Check if roadmap already exists
    if (existsSync(roadmapPath) && !options.force) {
      spinner.fail('roadmap.json already exists');
      console.log(chalk.yellow('  Use --force to overwrite'));
      process.exit(1);
    }

    // Load template
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    // Customize based on environment
    if (env === 'javascript') {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
      template.project_info.name = packageJson.name || 'My Project';
      template.project_info.description = packageJson.description || '';
      template.project_info.version = packageJson.version || '1.0.0';

      // Detect common JS frameworks
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const stack = [];
      if (deps.react) stack.push('React');
      if (deps.next) stack.push('Next.js');
      if (deps.vue) stack.push('Vue');
      if (deps.express) stack.push('Express');
      if (deps['@nestjs/core']) stack.push('NestJS');
      if (deps.prisma) stack.push('Prisma');
      if (deps.typescript) stack.push('TypeScript');

      template.project_info.stack = stack.length > 0 ? stack : ['JavaScript'];
    } else if (env === 'python') {
      template.project_info.stack = ['Python'];
    } else if (env === 'go') {
      template.project_info.stack = ['Go'];
    }

    // Set initial timestamp
    template.project_info.last_sync = new Date().toISOString();

    // Save roadmap.json
    writeFileSync(roadmapPath, JSON.stringify(template, null, 2), 'utf-8');

    // Copy .clinerules template
    if (!existsSync(rulesPath) || options.force) {
      copyFileSync(rulesTemplatePath, rulesPath);
    }

    spinner.succeed('Roadmap initialized successfully');

    console.log(chalk.cyan('\n📋 Next steps:'));
    console.log(chalk.white('  1. Edit roadmap.json to add your features and tasks'));
    console.log(chalk.white(`  2. Edit ${getAIRulesFilename(projectRoot)} to customize AI rules`));
    console.log(chalk.white('  3. Run "roadmap-kit scan" to sync with Git'));
    console.log(chalk.white('  4. Run "roadmap-kit dashboard" to view progress'));

  } catch (error) {
    spinner.fail('Error initializing roadmap');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Open dashboard
 */
async function openDashboard(options) {
  const projectRoot = options.path || process.cwd();

  // Check for roadmap.json in different locations
  let roadmapPath = join(projectRoot, 'roadmap.json');
  const roadmapKitPath = join(projectRoot, 'roadmap-kit', 'roadmap.json');

  // If we're inside roadmap-kit folder, use local roadmap.json
  if (existsSync(join(projectRoot, 'dashboard'))) {
    roadmapPath = join(projectRoot, 'roadmap.json');
  } else if (existsSync(roadmapKitPath)) {
    roadmapPath = roadmapKitPath;
  }

  // Check if roadmap exists
  if (!existsSync(roadmapPath)) {
    console.error(chalk.red('✗ roadmap.json not found'));
    console.log(chalk.yellow('  Run "roadmap-kit init" first'));
    process.exit(1);
  }

  // Start dashboard
  const dashboardPath = join(__dirname, 'dashboard');
  const spinner = ora('Starting dashboard...').start();

  try {
    // Check if dashboard deps are installed
    if (!existsSync(join(dashboardPath, 'node_modules'))) {
      spinner.text = 'Installing dashboard dependencies (first time)...';
      execSync('npm install', { cwd: dashboardPath, stdio: 'pipe' });
    }

    spinner.succeed('Dashboard starting...');
    console.log(chalk.green('\n✓ Dashboard running at http://localhost:6969'));
    console.log(chalk.cyan(`  📋 Roadmap: ${roadmapPath}`));
    console.log(chalk.gray('  Press Ctrl+C to stop\n'));

    // Start server (which includes Vite in middleware mode)
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: dashboardPath,
      stdio: 'inherit',
      shell: true
    });

    serverProcess.on('error', (error) => {
      console.error(chalk.red('Error starting dashboard:'), error.message);
      process.exit(1);
    });

  } catch (error) {
    spinner.fail('Error starting dashboard');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Generate Nginx configuration
 */
function generateNginxConfig(options) {
  const projectRoot = options.path || process.cwd();
  const domain = options.domain || 'localhost';
  const port = options.port || 6969;
  const ssl = options.ssl || false;
  const appPort = options.appPort || null;
  const certPath = options.certPath || `/etc/letsencrypt/live/${domain}`;

  const outputPath = join(projectRoot, 'nginx-roadmap.conf');
  const spinner = ora('Generating Nginx configuration...').start();

  try {
    // Check if Let's Encrypt cert exists (only on Linux)
    let sslAvailable = false;
    if (ssl) {
      try {
        sslAvailable = existsSync(`${certPath}/fullchain.pem`);
      } catch (e) {
        sslAvailable = false;
      }
    }

    let nginxConfig = `# ============================================================
# ROADMAP-KIT Nginx Configuration
# Generated: ${new Date().toISOString()}
# ============================================================
#
# Installation:
#   sudo cp nginx-roadmap.conf /etc/nginx/sites-available/roadmap-${domain.replace(/\./g, '-')}
#   sudo ln -s /etc/nginx/sites-available/roadmap-${domain.replace(/\./g, '-')} /etc/nginx/sites-enabled/
#   sudo nginx -t && sudo systemctl reload nginx
#
# Firewall:
#   sudo ufw allow ${port}
#
# ============================================================

`;

    if (ssl) {
      // HTTPS configuration
      nginxConfig += `# ROADMAP-KIT Dashboard (HTTPS on port ${port})
server {
    listen ${port} ssl http2;
    listen [::]:${port} ssl http2;
    server_name ${domain};

    # SSL Configuration
    ssl_certificate ${certPath}/fullchain.pem;
    ssl_certificate_key ${certPath}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/roadmap-${domain.replace(/\./g, '-')}.access.log;
    error_log /var/log/nginx/roadmap-${domain.replace(/\./g, '-')}.error.log;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
`;
    } else {
      // HTTP configuration
      nginxConfig += `# ROADMAP-KIT Dashboard (HTTP on port ${port})
server {
    listen ${port};
    listen [::]:${port};
    server_name ${domain};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/roadmap-${domain.replace(/\./g, '-')}.access.log;
    error_log /var/log/nginx/roadmap-${domain.replace(/\./g, '-')}.error.log;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
`;
    }

    // If app port is specified, add the main app config too
    if (appPort) {
      nginxConfig += `
# ============================================================
# Main Application (port 80/443 -> ${appPort})
# ============================================================

`;
      if (ssl) {
        nginxConfig += `# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}

# Main app HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    ssl_certificate ${certPath}/fullchain.pem;
    ssl_certificate_key ${certPath}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:${appPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
      } else {
        nginxConfig += `# Main app HTTP
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:${appPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
      }
    }

    writeFileSync(outputPath, nginxConfig, 'utf-8');
    spinner.succeed('Nginx configuration generated');

    console.log(chalk.cyan('\n📋 Generated: ') + chalk.white('nginx-roadmap.conf'));
    console.log(chalk.cyan('\n🚀 To install:\n'));
    console.log(chalk.yellow(`  # Copy to nginx sites`));
    console.log(chalk.white(`  sudo cp nginx-roadmap.conf /etc/nginx/sites-available/roadmap-${domain.replace(/\./g, '-')}`));
    console.log(chalk.white(`  sudo ln -s /etc/nginx/sites-available/roadmap-${domain.replace(/\./g, '-')} /etc/nginx/sites-enabled/`));
    console.log('');
    console.log(chalk.yellow(`  # Open firewall port`));
    console.log(chalk.white(`  sudo ufw allow ${port}`));
    console.log('');
    console.log(chalk.yellow(`  # Test and reload nginx`));
    console.log(chalk.white(`  sudo nginx -t && sudo systemctl reload nginx`));
    console.log('');
    console.log(chalk.green(`✓ Access dashboard at: ${ssl ? 'https' : 'http'}://${domain}:${port}`));

    if (ssl && !sslAvailable) {
      console.log(chalk.yellow(`\n⚠ SSL certificate not found at ${certPath}`));
      console.log(chalk.white(`  Generate with: sudo certbot certonly --nginx -d ${domain}`));
    }

  } catch (error) {
    spinner.fail('Error generating Nginx config');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Generate Docker configuration
 */
function generateDockerConfig(options) {
  const projectRoot = options.path || process.cwd();
  const dockerComposePath = join(projectRoot, 'docker-roadmap.yml');
  const spinner = ora('Generating Docker configuration...').start();

  try {
    const dockerComposeContent = `# ROADMAP-KIT Docker Configuration
# Add this to your existing docker-compose.yml or use standalone
#
# Usage:
#   docker-compose -f docker-roadmap.yml up
#
# Custom port:
#   ROADMAP_PORT=8080 docker-compose -f docker-roadmap.yml up

version: '3.8'

services:
  roadmap-dashboard:
    image: node:20-alpine
    container_name: roadmap-dashboard
    working_dir: /app
    ports:
      - "\${ROADMAP_PORT:-6969}:6969"
    volumes:
      # Mount .git directory (read-only) for scanner
      - ./.git:/app/.git:ro
      # Mount roadmap.json for sync
      - ./roadmap-kit/roadmap.json:/app/roadmap-kit/roadmap.json
      # Mount roadmap-kit
      - ./roadmap-kit:/app/roadmap-kit
    command: sh -c "cd /app/roadmap-kit && npm install && node scanner.js && cd dashboard && npm install && npm run dev -- --host 0.0.0.0"
    restart: unless-stopped
    environment:
      - NODE_ENV=development
      - PORT=6969
    networks:
      - roadmap-network

networks:
  roadmap-network:
    driver: bridge
`;

    writeFileSync(dockerComposePath, dockerComposeContent, 'utf-8');
    spinner.succeed('Docker configuration generated');

    console.log(chalk.cyan('\n🐳 Docker setup:'));
    console.log(chalk.white('  1. Review docker-roadmap.yml'));
    console.log(chalk.white('  2. Run: docker-compose -f docker-roadmap.yml up'));
    console.log(chalk.white('  3. Access dashboard at http://localhost:6969'));

  } catch (error) {
    spinner.fail('Error generating Docker config');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * CLI Configuration
 */
program
  .name('roadmap-kit')
  .description('Sistema de gestión de proyectos optimizado para Vibe Coding (programación asistida por IA)')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize roadmap in current project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-f, --force', 'Overwrite existing roadmap')
  .action(initRoadmap);

// Scan command
program
  .command('scan')
  .description('Scan Git history and update roadmap')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    await scanGitHistory(options.path);
  });

// Dashboard command
program
  .command('dashboard')
  .description('Open roadmap dashboard')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(openDashboard);

// Docker command
program
  .command('docker')
  .description('Generate Docker configuration')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(generateDockerConfig);

// Nginx command
program
  .command('nginx')
  .description('Generate Nginx configuration for production')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-d, --domain <domain>', 'Domain name (e.g., midominio.com)', 'localhost')
  .option('--port <port>', 'Roadmap dashboard port', '6969')
  .option('--ssl', 'Enable SSL/HTTPS configuration')
  .option('--app-port <port>', 'Main application port (optional, to include app config)')
  .option('--cert-path <path>', 'Path to SSL certificates')
  .action(generateNginxConfig);

// Default action (when no command is provided)
program.action(() => {
  console.log(chalk.cyan('🗺️  ROADMAP-KIT'));
  console.log(chalk.white('\nAvailable commands:'));
  console.log(chalk.white('  roadmap-kit init       - Initialize roadmap'));
  console.log(chalk.white('  roadmap-kit scan       - Sync with Git'));
  console.log(chalk.white('  roadmap-kit dashboard  - Open dashboard'));
  console.log(chalk.white('  roadmap-kit docker     - Generate Docker config'));
  console.log(chalk.white('  roadmap-kit nginx      - Generate Nginx config'));
  console.log(chalk.gray('\nUse "roadmap-kit <command> --help" for more information'));
});

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (process.argv.length === 2) {
  program.help();
}
