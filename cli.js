#!/usr/bin/env node

/**
 * ROADMAP-KIT CLI
 * Command-line interface for roadmap management
 * Supports: init, scan, dashboard, docker
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import net from 'net';
import chalk from 'chalk';
import ora from 'ora';
import { scanGitHistory } from './scanner.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 6969;

/**
 * Technology detection patterns by category
 * Maps package names/files to readable technology names
 */
const TECH_DETECTION = {
  // Frontend Frameworks
  frameworks: {
    'react': 'React',
    'react-dom': 'React',
    'next': 'Next.js',
    'vue': 'Vue',
    'nuxt': 'Nuxt',
    'svelte': 'Svelte',
    '@sveltejs/kit': 'SvelteKit',
    'express': 'Express',
    '@nestjs/core': 'NestJS',
    'fastify': 'Fastify',
    '@angular/core': 'Angular',
    'astro': 'Astro',
    '@remix-run/react': 'Remix'
  },
  // Databases & ORMs
  databases: {
    'prisma': 'Prisma',
    '@prisma/client': 'Prisma',
    'typeorm': 'TypeORM',
    'sequelize': 'Sequelize',
    'mongoose': 'Mongoose',
    'drizzle-orm': 'Drizzle',
    'knex': 'Knex',
    'pg': 'PostgreSQL',
    'mysql2': 'MySQL',
    'better-sqlite3': 'SQLite',
    'mongodb': 'MongoDB',
    'redis': 'Redis',
    'ioredis': 'Redis',
    '@supabase/supabase-js': 'Supabase',
    'firebase': 'Firebase',
    'firebase-admin': 'Firebase'
  },
  // Styling
  styling: {
    'tailwindcss': 'TailwindCSS',
    'styled-components': 'Styled Components',
    '@emotion/react': 'Emotion',
    'sass': 'SCSS',
    '@mui/material': 'Material UI',
    'antd': 'Ant Design',
    '@chakra-ui/react': 'Chakra UI',
    'bootstrap': 'Bootstrap'
  },
  // Testing
  testing: {
    'jest': 'Jest',
    'vitest': 'Vitest',
    'mocha': 'Mocha',
    '@playwright/test': 'Playwright',
    'cypress': 'Cypress',
    '@testing-library/react': 'Testing Library'
  },
  // Build Tools
  build: {
    'vite': 'Vite',
    'webpack': 'Webpack',
    'esbuild': 'esbuild',
    'parcel': 'Parcel',
    'rollup': 'Rollup',
    'turbo': 'Turborepo'
  },
  // Developer Tools
  tools: {
    'typescript': 'TypeScript',
    'eslint': 'ESLint',
    'prettier': 'Prettier',
    'husky': 'Husky',
    'zod': 'Zod',
    'axios': 'Axios',
    'graphql': 'GraphQL',
    '@trpc/server': 'tRPC',
    'socket.io': 'Socket.io'
  },
  // Python (detected from requirements.txt)
  python: {
    'django': 'Django',
    'flask': 'Flask',
    'fastapi': 'FastAPI',
    'sqlalchemy': 'SQLAlchemy',
    'pytest': 'Pytest',
    'celery': 'Celery'
  }
};

/**
 * Configuration files to detect
 */
const CONFIG_PATTERNS = [
  'tsconfig.json',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  'eslint.config.js',
  'prettier.config.js',
  '.prettierrc',
  '.prettierrc.js',
  'tailwind.config.js',
  'tailwind.config.ts',
  'vite.config.js',
  'vite.config.ts',
  'webpack.config.js',
  'next.config.js',
  'next.config.mjs',
  'prisma/schema.prisma',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.env',
  '.env.local',
  '.env.example'
];

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port starting from startPort
 * @param {number} startPort - Port to start searching from
 * @param {number} maxAttempts - Maximum number of ports to try
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort = DEFAULT_PORT, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

/**
 * Detect folder structure pattern
 * @param {string} projectRoot - Project root directory
 * @returns {string} - Detected pattern (feature-based, layer-based, app-router, mixed, flat)
 */
function detectFolderPattern(projectRoot) {
  const srcPath = join(projectRoot, 'src');
  const appPath = join(projectRoot, 'app');

  // Check for Next.js app router
  if (existsSync(appPath)) {
    try {
      const appContents = readdirSync(appPath);
      if (appContents.some(f => f.startsWith('(') || f === 'layout.tsx' || f === 'layout.js')) {
        return 'app-router';
      }
    } catch (e) { /* ignore */ }
  }

  if (!existsSync(srcPath)) {
    return 'flat';
  }

  try {
    const srcContents = readdirSync(srcPath);
    const dirs = srcContents.filter(f => {
      try {
        return statSync(join(srcPath, f)).isDirectory();
      } catch (e) {
        return false;
      }
    });

    // Layer-based patterns
    const layerPatterns = ['controllers', 'services', 'models', 'repositories', 'routes', 'middleware'];
    const hasLayerPattern = dirs.some(d => layerPatterns.includes(d.toLowerCase()));

    // Feature-based patterns
    const featurePatterns = ['features', 'modules', 'domains'];
    const hasFeaturePattern = dirs.some(d => featurePatterns.includes(d.toLowerCase()));

    // Common mixed patterns
    const commonDirs = ['components', 'lib', 'utils', 'hooks', 'styles', 'pages', 'api'];
    const hasCommonDirs = dirs.some(d => commonDirs.includes(d.toLowerCase()));

    if (hasFeaturePattern) return 'feature-based';
    if (hasLayerPattern) return 'layer-based';
    if (hasCommonDirs && dirs.length > 3) return 'mixed';
    return 'flat';
  } catch (e) {
    return 'flat';
  }
}

/**
 * Scan for shared resources (UI components, utilities, DB tables)
 * @param {string} projectRoot - Project root directory
 * @returns {Object} - { ui_components, utilities, database_tables }
 */
function scanSharedResources(projectRoot) {
  const resources = {
    ui_components: [],
    utilities: [],
    database_tables: []
  };

  // Common paths for components
  const componentPaths = [
    join(projectRoot, 'src', 'components'),
    join(projectRoot, 'src', 'components', 'ui'),
    join(projectRoot, 'components'),
    join(projectRoot, 'app', 'components')
  ];

  // Common paths for utilities
  const utilityPaths = [
    join(projectRoot, 'src', 'lib'),
    join(projectRoot, 'src', 'utils'),
    join(projectRoot, 'lib'),
    join(projectRoot, 'utils')
  ];

  // Scan for UI components
  for (const compPath of componentPaths) {
    if (existsSync(compPath)) {
      try {
        const files = readdirSync(compPath);
        for (const file of files) {
          if (file.match(/\.(jsx|tsx)$/) && !file.includes('.test.') && !file.includes('.spec.')) {
            const fullPath = join(compPath, file);
            try {
              if (statSync(fullPath).isFile()) {
                const relativePath = fullPath.replace(projectRoot + '/', '');
                const name = basename(file, file.includes('.tsx') ? '.tsx' : '.jsx');
                resources.ui_components.push({
                  path: relativePath,
                  description: `${name} component`,
                  usage: `import { ${name} } from '@/${relativePath.replace(/\.(jsx|tsx)$/, '')}'`
                });
              }
            } catch (e) { /* ignore */ }
          }
        }
      } catch (e) { /* ignore */ }
    }
  }

  // Scan for utilities
  for (const utilPath of utilityPaths) {
    if (existsSync(utilPath)) {
      try {
        const files = readdirSync(utilPath);
        for (const file of files) {
          if (file.match(/\.(js|ts)$/) && !file.match(/\.(d\.ts|test\.|spec\.)/) && !file.includes('index')) {
            const fullPath = join(utilPath, file);
            try {
              if (statSync(fullPath).isFile()) {
                const relativePath = fullPath.replace(projectRoot + '/', '');
                const name = basename(file, file.includes('.ts') ? '.ts' : '.js');
                resources.utilities.push({
                  path: relativePath,
                  description: `${name} utility`,
                  exports: [],
                  usage: `import { ... } from '@/${relativePath.replace(/\.(js|ts)$/, '')}'`
                });
              }
            } catch (e) { /* ignore */ }
          }
        }
      } catch (e) { /* ignore */ }
    }
  }

  // Scan for Prisma schema (database tables)
  const prismaSchemaPath = join(projectRoot, 'prisma', 'schema.prisma');
  if (existsSync(prismaSchemaPath)) {
    try {
      const schemaContent = readFileSync(prismaSchemaPath, 'utf-8');
      const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
      let match;

      while ((match = modelRegex.exec(schemaContent)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];

        // Extract field names (first word of each line)
        const fields = modelBody
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
          .map(line => line.split(/\s+/)[0])
          .filter(f => f);

        resources.database_tables.push({
          name: modelName.toLowerCase(),
          description: `${modelName} model`,
          fields: fields.slice(0, 10) // Limit to first 10 fields
        });
      }
    } catch (e) { /* ignore */ }
  }

  return resources;
}

/**
 * Analyze git history for project maturity
 * @param {string} projectRoot - Project root directory
 * @returns {Object|null} - Git info or null if not a git repo
 */
function analyzeGitHistory(projectRoot) {
  try {
    // Check if it's a git repo
    if (!existsSync(join(projectRoot, '.git'))) {
      return null;
    }

    // Count commits
    const commitCount = parseInt(
      execSync('git rev-list --count HEAD 2>/dev/null', { cwd: projectRoot, encoding: 'utf-8' }).trim(),
      10
    );

    // Get first commit date
    let firstCommit = null;
    let lastCommit = null;
    try {
      firstCommit = execSync('git log --reverse --format=%aI | head -1', { cwd: projectRoot, encoding: 'utf-8', shell: true }).trim();
      lastCommit = execSync('git log -1 --format=%aI', { cwd: projectRoot, encoding: 'utf-8' }).trim();
    } catch (e) { /* ignore */ }

    // Determine maturity
    let maturity;
    if (commitCount < 20) {
      maturity = 'new';
    } else if (commitCount <= 100) {
      maturity = 'early';
    } else {
      maturity = 'established';
    }

    return {
      commit_count: commitCount,
      maturity,
      first_commit: firstCommit,
      last_commit: lastCommit
    };
  } catch (e) {
    return null;
  }
}

/**
 * Extract conventions from config files
 * @param {string} projectRoot - Project root directory
 * @param {string[]} configFiles - List of detected config files
 * @returns {Object} - Conventions object
 */
function extractConventions(projectRoot, configFiles) {
  const conventions = {
    naming: {
      variables: 'camelCase',
      components: 'PascalCase',
      files: 'kebab-case for utilities, PascalCase for components',
      constants: 'UPPER_SNAKE_CASE'
    },
    file_structure: '',
    database: '',
    styling: '',
    error_handling: ''
  };

  // Detect TypeScript config
  const hasTypeScript = configFiles.includes('tsconfig.json');
  if (hasTypeScript) {
    conventions.naming.types = 'PascalCase for types and interfaces';
  }

  // Detect ESLint & Prettier
  const hasEslint = configFiles.some(f => f.includes('eslint'));
  const hasPrettier = configFiles.some(f => f.includes('prettier'));
  const tools = [];
  if (hasEslint) tools.push('ESLint');
  if (hasPrettier) tools.push('Prettier');
  if (tools.length > 0) {
    conventions.naming.enforced_by = tools.join(', ');
  }

  // Detect architecture from folder structure
  const folderPattern = detectFolderPattern(projectRoot);
  switch (folderPattern) {
    case 'app-router':
      conventions.file_structure = 'Next.js App Router - app-based routing with layouts and server components';
      break;
    case 'feature-based':
      conventions.file_structure = 'Feature-based architecture - features/modules as self-contained units';
      break;
    case 'layer-based':
      conventions.file_structure = 'Layered architecture (MVC/Clean) - separated controllers, services, models';
      break;
    case 'mixed':
      conventions.file_structure = 'Component-based - separated components, lib, utils, pages';
      break;
    default:
      conventions.file_structure = 'Flat structure';
  }

  // Detect styling conventions
  const hasTailwind = configFiles.some(f => f.includes('tailwind'));
  if (hasTailwind) {
    conventions.styling = 'TailwindCSS utility classes';
  }

  // Detect database conventions
  if (existsSync(join(projectRoot, 'prisma', 'schema.prisma'))) {
    conventions.database = 'Prisma ORM - snake_case for tables/columns, PascalCase for models';
  } else if (configFiles.some(f => f.includes('drizzle'))) {
    conventions.database = 'Drizzle ORM';
  } else if (existsSync(join(projectRoot, 'migrations'))) {
    conventions.database = 'SQL migrations';
  }

  return conventions;
}

/**
 * Analyze project structure comprehensively
 * @param {string} projectRoot - Project root directory
 * @returns {Object} - Analysis result
 */
function analyzeProjectStructure(projectRoot) {
  const analysis = {
    stack: [],
    conventions: {},
    shared_resources: { ui_components: [], utilities: [], database_tables: [] },
    projectMaturity: null,
    folderPattern: 'flat',
    gitInfo: null,
    configFiles: []
  };

  // Detect config files
  for (const pattern of CONFIG_PATTERNS) {
    const filePath = join(projectRoot, pattern);
    if (existsSync(filePath)) {
      analysis.configFiles.push(pattern);
    }
  }

  // Detect technologies from package.json
  const packageJsonPath = join(projectRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check all tech categories
      for (const [category, techs] of Object.entries(TECH_DETECTION)) {
        if (category === 'python') continue; // Skip Python for JS projects

        for (const [pkg, name] of Object.entries(techs)) {
          if (allDeps[pkg] && !analysis.stack.includes(name)) {
            analysis.stack.push(name);
          }
        }
      }
    } catch (e) { /* ignore */ }
  }

  // Detect technologies from requirements.txt (Python)
  const requirementsPath = join(projectRoot, 'requirements.txt');
  if (existsSync(requirementsPath)) {
    try {
      const requirements = readFileSync(requirementsPath, 'utf-8').toLowerCase();
      for (const [pkg, name] of Object.entries(TECH_DETECTION.python)) {
        if (requirements.includes(pkg) && !analysis.stack.includes(name)) {
          analysis.stack.push(name);
        }
      }
    } catch (e) { /* ignore */ }
  }

  // Detect folder pattern
  analysis.folderPattern = detectFolderPattern(projectRoot);

  // Scan shared resources
  analysis.shared_resources = scanSharedResources(projectRoot);

  // Analyze git history
  analysis.gitInfo = analyzeGitHistory(projectRoot);
  if (analysis.gitInfo) {
    analysis.projectMaturity = analysis.gitInfo.maturity;
  }

  // Extract conventions
  analysis.conventions = extractConventions(projectRoot, analysis.configFiles);

  return analysis;
}

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
    spinner.text = `Detected ${env} project, analyzing structure...`;

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

    // Perform comprehensive project analysis
    spinner.text = 'Analyzing project structure...';
    const analysis = analyzeProjectStructure(projectRoot);

    // Load template
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    // Populate from package.json basics
    if (env === 'javascript' && existsSync(join(projectRoot, 'package.json'))) {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
      template.project_info.name = packageJson.name || 'My Project';
      template.project_info.description = packageJson.description || '';
      template.project_info.version = packageJson.version || '1.0.0';
    } else if (env === 'python') {
      template.project_info.name = basename(projectRoot);
      if (!analysis.stack.includes('Python')) {
        analysis.stack.unshift('Python');
      }
    } else if (env === 'go') {
      template.project_info.name = basename(projectRoot);
      analysis.stack.unshift('Go');
    }

    // Apply comprehensive analysis results
    template.project_info.stack = analysis.stack.length > 0 ? analysis.stack : [env === 'javascript' ? 'JavaScript' : env];
    template.project_info.conventions = analysis.conventions;
    template.project_info.shared_resources = analysis.shared_resources;
    template.project_info.last_sync = new Date().toISOString();

    // Add git info if available
    if (analysis.gitInfo) {
      template.project_info.git_info = {
        commit_count: analysis.gitInfo.commit_count,
        maturity: analysis.gitInfo.maturity,
        first_commit: analysis.gitInfo.first_commit,
        last_commit: analysis.gitInfo.last_commit
      };
    }

    // Save roadmap.json
    writeFileSync(roadmapPath, JSON.stringify(template, null, 2), 'utf-8');

    // Copy .clinerules template
    if (!existsSync(rulesPath) || options.force) {
      copyFileSync(rulesTemplatePath, rulesPath);
    }

    spinner.succeed('Roadmap initialized successfully');

    // Display analysis summary
    console.log(chalk.cyan('\n📊 Project Analysis:'));
    console.log(chalk.white(`  • Stack: ${analysis.stack.length > 0 ? analysis.stack.join(', ') : 'Not detected'}`));
    console.log(chalk.white(`  • Structure: ${analysis.folderPattern}`));

    const uiCount = analysis.shared_resources.ui_components.length;
    const utilCount = analysis.shared_resources.utilities.length;
    const dbCount = analysis.shared_resources.database_tables.length;

    if (uiCount > 0) console.log(chalk.white(`  • UI Components: ${uiCount} detected`));
    if (utilCount > 0) console.log(chalk.white(`  • Utilities: ${utilCount} detected`));
    if (dbCount > 0) console.log(chalk.white(`  • Database tables: ${dbCount} detected`));

    if (analysis.gitInfo) {
      console.log(chalk.white(`  • Git history: ${analysis.gitInfo.commit_count} commits (${analysis.gitInfo.maturity})`));
    }

    console.log(chalk.cyan('\n📋 Next steps:'));
    console.log(chalk.white('  1. Review roadmap.json and add your features'));
    console.log(chalk.white(`  2. Edit ${getAIRulesFilename(projectRoot)} to customize AI rules`));
    console.log(chalk.white('  3. Run "roadmap-kit dashboard" to view and manage'));

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
  const requestedPort = options.port ? parseInt(options.port, 10) : null;

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
    // Determine port to use
    let port;
    let portNote = '';

    if (requestedPort) {
      // User specified a port
      if (await isPortAvailable(requestedPort)) {
        port = requestedPort;
      } else {
        spinner.fail(`Port ${requestedPort} is already in use`);
        console.log(chalk.yellow('  Try a different port with --port <port>'));
        process.exit(1);
      }
    } else {
      // Auto-detect available port
      if (await isPortAvailable(DEFAULT_PORT)) {
        port = DEFAULT_PORT;
      } else {
        spinner.text = 'Default port in use, finding available port...';
        try {
          port = await findAvailablePort(DEFAULT_PORT);
          portNote = `  ${chalk.yellow('Note:')} Port ${DEFAULT_PORT} in use, using port ${port} instead\n`;
        } catch (err) {
          spinner.fail('No available port found');
          console.log(chalk.yellow(`  Ports ${DEFAULT_PORT}-${DEFAULT_PORT + 9} are all in use`));
          process.exit(1);
        }
      }
    }

    // Check if dashboard deps are installed
    if (!existsSync(join(dashboardPath, 'node_modules'))) {
      spinner.text = 'Installing dashboard dependencies (first time)...';
      execSync('npm install', { cwd: dashboardPath, stdio: 'pipe' });
    }

    spinner.succeed('Dashboard starting...');
    if (portNote) {
      console.log(portNote);
    }
    console.log(chalk.green(`\n✓ Dashboard running at http://localhost:${port}`));
    console.log(chalk.cyan(`  📋 Roadmap: ${roadmapPath}`));
    console.log(chalk.gray('  Press Ctrl+C to stop\n'));

    // Start server (which includes Vite in middleware mode)
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: dashboardPath,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PROJECT_ROOT: projectRoot, PORT: port.toString() }
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
  .option('--port <port>', 'Dashboard port (default: 6969, auto-detects if in use)')
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
