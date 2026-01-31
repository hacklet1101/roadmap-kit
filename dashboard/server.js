import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROADMAP_KIT_PATH = path.join(__dirname, '..');
const ROADMAP_PATH = path.join(ROADMAP_KIT_PATH, 'roadmap.json');
const AUTH_PATH = path.join(ROADMAP_KIT_PATH, 'auth.json');
const VERSIONS_PATH = path.join(ROADMAP_KIT_PATH, 'versions.json');
const PROJECT_ROOT = path.join(ROADMAP_KIT_PATH, '..'); // Parent of roadmap-kit
const MAX_VERSIONS = 10;

// ============ VERSION CONTROL ============
async function loadVersions() {
  try {
    const data = await fs.readFile(VERSIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { versions: [] };
  }
}

async function saveVersion(roadmap, userId, userName, description = 'Manual save') {
  try {
    const versionsData = await loadVersions();

    // Create new version entry
    const version = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      description,
      snapshot: roadmap
    };

    // Add to beginning of array
    versionsData.versions.unshift(version);

    // Keep only last MAX_VERSIONS
    if (versionsData.versions.length > MAX_VERSIONS) {
      versionsData.versions = versionsData.versions.slice(0, MAX_VERSIONS);
    }

    await fs.writeFile(VERSIONS_PATH, JSON.stringify(versionsData, null, 2), 'utf-8');
    return version;
  } catch (err) {
    console.error('Error saving version:', err);
    return null;
  }
}

// ============ PASSWORD HASHING (using crypto.scrypt - no external deps) ============
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// ============ AUTH.JSON MANAGEMENT ============
// Note: authConfig is re-read from file on each request to support hot-reload

async function loadAuthConfig() {
  try {
    const data = await fs.readFile(AUTH_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create default auth.json
      return await createDefaultAuthConfig();
    }
    throw err;
  }
}

async function saveAuthConfig(config) {
  await fs.writeFile(AUTH_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

async function createDefaultAuthConfig() {
  // Use environment variables or defaults
  const adminEmail = process.env.ROADMAP_ADMIN_EMAIL || 'admin@localhost';
  const adminPassword = process.env.ROADMAP_ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ROADMAP_ADMIN_NAME || 'Admin';

  const hashedPassword = await hashPassword(adminPassword);

  const config = {
    settings: {
      requireAuth: true,
      sessionDuration: 86400000, // 24h in ms
      allowRegistration: false
    },
    users: [
      {
        id: `user-${Date.now()}`,
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ]
  };

  await fs.writeFile(AUTH_PATH, JSON.stringify(config, null, 2), 'utf-8');

  if (process.env.ROADMAP_ADMIN_EMAIL) {
    console.log(`  ➜  Auth:    Created auth.json (user: ${adminEmail})`);
  } else {
    console.log(`  ➜  Auth:    Created default auth.json (user: ${adminEmail} / pass: Admin123!)`);
    console.log('  ➜  Tip:     Run setup.sh to configure your own credentials');
  }

  return config;
}

function findUserByEmail(authConfig, email) {
  if (!authConfig?.users) return null;
  return authConfig.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(authConfig, id) {
  if (!authConfig?.users) return null;
  return authConfig.users.find(u => u.id === id);
}

// ============ SESSION MANAGEMENT ============
const sessions = new Map();

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

function createSession(authConfig, user) {
  const sessionId = generateSessionId();
  const duration = authConfig?.settings?.sessionDuration || 86400000;
  sessions.set(sessionId, {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + duration
  });
  return { sessionId, duration };
}

// ============ AUTHENTICATION MIDDLEWARE ============
async function authMiddleware(req, res, next) {
  try {
    const authConfig = await loadAuthConfig();

    // Check if auth is enabled
    if (!authConfig?.settings?.requireAuth) {
      req.user = { role: 'admin', name: 'Anonymous' }; // Grant full access when auth disabled
      req.authConfig = authConfig;
      return next();
    }

    // Check session cookie
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/roadmap_session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    const session = sessionId ? getSession(sessionId) : null;
    if (session) {
      req.user = session;
      req.authConfig = authConfig;
      return next();
    }

    // Not authenticated
    res.status(401).json({ error: 'No autenticado', requiresAuth: true });
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}

// Admin-only middleware
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
}

async function createServer() {
  // Ensure auth.json exists (creates default if not exists)
  await loadAuthConfig();

  const app = express();

  // Trust proxy (for nginx/reverse proxy)
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '10mb' }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // API: Check auth status
  app.get('/api/auth/status', async (req, res) => {
    try {
      const authConfig = await loadAuthConfig();
      const authEnabled = authConfig?.settings?.requireAuth ?? true;

      if (!authEnabled) {
        return res.json({ authenticated: true, authEnabled: false, user: { role: 'admin', name: 'Anonymous' } });
      }

      const cookies = req.headers.cookie || '';
      const sessionMatch = cookies.match(/roadmap_session=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : null;
      const session = sessionId ? getSession(sessionId) : null;

      res.json({
        authenticated: !!session,
        authEnabled: true,
        user: session ? { name: session.name, email: session.email, role: session.role } : null
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const authConfig = await loadAuthConfig();
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }

      const user = findUserByEmail(authConfig, email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const validPassword = await verifyPassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      await saveAuthConfig(authConfig);

      const { sessionId, duration } = createSession(authConfig, user);
      res.setHeader('Set-Cookie', `roadmap_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${duration / 1000}`);
      res.json({
        success: true,
        message: 'Login exitoso',
        user: { name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // API: Logout
  app.post('/api/auth/logout', (req, res) => {
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/roadmap_session=([^;]+)/);
    if (sessionMatch) {
      sessions.delete(sessionMatch[1]);
    }
    res.setHeader('Set-Cookie', 'roadmap_session=; Path=/; HttpOnly; Max-Age=0');
    res.json({ success: true });
  });

  // API: Get current user
  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  // ============ USER MANAGEMENT (Admin only) ============

  // API: List all users
  app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
    const users = (req.authConfig?.users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));
    res.json({ users });
  });

  // API: Create user
  app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
      }

      // Check if email already exists
      if (findUserByEmail(req.authConfig, email)) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'member',
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      req.authConfig.users.push(newUser);
      await saveAuthConfig(req.authConfig);

      res.json({
        success: true,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  });

  // API: Update user
  app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, role } = req.body;

      const user = findUserById(req.authConfig, id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Check email uniqueness if changing
      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        if (findUserByEmail(req.authConfig, email)) {
          return res.status(409).json({ error: 'El email ya está registrado' });
        }
        user.email = email.toLowerCase();
      }

      if (name) user.name = name;
      if (role) user.role = role;
      if (password) {
        user.password = await hashPassword(password);
      }

      await saveAuthConfig(req.authConfig);

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  });

  // API: Delete user
  app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      const userIndex = req.authConfig.users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Prevent deleting the last admin
      const user = req.authConfig.users[userIndex];
      if (user.role === 'admin') {
        const adminCount = req.authConfig.users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'No se puede eliminar el último administrador' });
        }
      }

      req.authConfig.users.splice(userIndex, 1);
      await saveAuthConfig(req.authConfig);

      res.json({ success: true });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  });

  // API: Update own profile (any authenticated user)
  app.put('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      const user = findUserById(req.authConfig, userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Se requiere la contraseña actual para cambiar la contraseña' });
        }
        const validPassword = await verifyPassword(currentPassword, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
        user.password = await hashPassword(newPassword);
      }

      // If changing email, check uniqueness
      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        if (findUserByEmail(req.authConfig, email)) {
          return res.status(409).json({ error: 'El email ya está en uso' });
        }
        user.email = email.toLowerCase();
      }

      if (name) user.name = name;

      await saveAuthConfig(req.authConfig);

      // Update session with new info
      const session = getSession(req.headers.cookie?.match(/roadmap_session=([^;]+)/)?.[1]);
      if (session) {
        session.name = user.name;
        session.email = user.email;
      }

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  });

  // API: Get auth settings (Admin only)
  app.get('/api/auth/settings', authMiddleware, adminMiddleware, (req, res) => {
    res.json({
      settings: req.authConfig?.settings || {},
      userCount: req.authConfig?.users?.length || 0
    });
  });

  // API: Update auth settings (Admin only)
  app.put('/api/auth/settings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { requireAuth, sessionDuration, allowRegistration } = req.body;

      if (typeof requireAuth === 'boolean') req.authConfig.settings.requireAuth = requireAuth;
      if (typeof sessionDuration === 'number') req.authConfig.settings.sessionDuration = sessionDuration;
      if (typeof allowRegistration === 'boolean') req.authConfig.settings.allowRegistration = allowRegistration;

      await saveAuthConfig(req.authConfig);

      res.json({ success: true, settings: req.authConfig.settings });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Error al actualizar configuración' });
    }
  });

  // API: Get roadmap (no auth required for reading)
  app.get('/roadmap.json', async (req, res) => {
    try {
      const data = await fs.readFile(ROADMAP_PATH, 'utf-8');
      res.json(JSON.parse(data));
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ error: 'roadmap.json not found' });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // API: Save roadmap (requires auth)
  app.post('/api/save-roadmap', authMiddleware, async (req, res) => {
    try {
      const { roadmap, description } = req.body.roadmap ? req.body : { roadmap: req.body, description: 'Manual save' };

      // Basic validation
      if (!roadmap || typeof roadmap !== 'object') {
        return res.status(400).json({ error: 'Datos invalidos' });
      }

      // Save current version BEFORE overwriting
      try {
        const currentRoadmap = JSON.parse(await fs.readFile(ROADMAP_PATH, 'utf-8'));
        await saveVersion(currentRoadmap, req.user?.id, req.user?.name || 'Unknown', description || 'Manual save');
      } catch (versionErr) {
        // First save, no previous version
        console.log('No previous version to save (first save)');
      }

      // Sanitize: Remove any script tags or dangerous content from strings
      const sanitizedRoadmap = JSON.parse(
        JSON.stringify(roadmap).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      );

      // Update last_sync timestamp and last editor
      if (sanitizedRoadmap.project_info) {
        sanitizedRoadmap.project_info.last_sync = new Date().toISOString();
        sanitizedRoadmap.project_info.last_edited_by = req.user?.name || 'Unknown';
      }

      await fs.writeFile(ROADMAP_PATH, JSON.stringify(sanitizedRoadmap, null, 2), 'utf-8');
      res.json({ success: true, message: 'Roadmap guardado correctamente' });
    } catch (err) {
      console.error('Error saving roadmap:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get version history
  app.get('/api/versions', authMiddleware, async (req, res) => {
    try {
      const versionsData = await loadVersions();
      // Return versions without full snapshots (just metadata)
      const versions = versionsData.versions.map(v => ({
        id: v.id,
        timestamp: v.timestamp,
        userId: v.userId,
        userName: v.userName,
        description: v.description,
        featuresCount: v.snapshot?.features?.length || 0,
        tasksCount: v.snapshot?.features?.reduce((sum, f) => sum + (f.tasks?.length || 0), 0) || 0
      }));
      res.json({ versions });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get specific version
  app.get('/api/versions/:id', authMiddleware, async (req, res) => {
    try {
      const versionsData = await loadVersions();
      const version = versionsData.versions.find(v => v.id === req.params.id);
      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }
      res.json({ version });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Restore a version
  app.post('/api/versions/:id/restore', authMiddleware, async (req, res) => {
    try {
      const versionsData = await loadVersions();
      const version = versionsData.versions.find(v => v.id === req.params.id);
      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      // Save current as a new version before restoring
      try {
        const currentRoadmap = JSON.parse(await fs.readFile(ROADMAP_PATH, 'utf-8'));
        await saveVersion(currentRoadmap, req.user?.id, req.user?.name || 'Unknown', `Before restore to ${version.id}`);
      } catch (err) {
        // Ignore if no current roadmap
      }

      // Restore the version
      const restoredRoadmap = { ...version.snapshot };
      restoredRoadmap.project_info.last_sync = new Date().toISOString();
      restoredRoadmap.project_info.last_edited_by = req.user?.name || 'Unknown';
      restoredRoadmap.project_info.restored_from = version.id;

      await fs.writeFile(ROADMAP_PATH, JSON.stringify(restoredRoadmap, null, 2), 'utf-8');
      res.json({ success: true, roadmap: restoredRoadmap });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get users for task assignment (without passwords)
  app.get('/api/team-members', authMiddleware, async (req, res) => {
    try {
      const users = (req.authConfig?.users || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role
      }));
      res.json({ members: users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Deploy files to project root (requires auth)
  app.post('/api/deploy', authMiddleware, async (req, res) => {
    try {
      const { clinerules, cursorrules, roadmap } = req.body;

      const deployedFiles = [];

      // Write .clinerules to project root
      if (clinerules) {
        const sanitizedClinerules = clinerules.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        await fs.writeFile(path.join(PROJECT_ROOT, '.clinerules'), sanitizedClinerules, 'utf-8');
        deployedFiles.push('.clinerules');
      }

      // Write .cursorrules to project root (optional)
      if (cursorrules) {
        const sanitizedCursorrules = cursorrules.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        await fs.writeFile(path.join(PROJECT_ROOT, '.cursorrules'), sanitizedCursorrules, 'utf-8');
        deployedFiles.push('.cursorrules');
      }

      // Write roadmap.json to roadmap-kit folder
      if (roadmap) {
        const sanitizedRoadmap = JSON.parse(
          JSON.stringify(roadmap).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        );
        await fs.writeFile(ROADMAP_PATH, JSON.stringify(sanitizedRoadmap, null, 2), 'utf-8');
        deployedFiles.push('roadmap-kit/roadmap.json');
      }

      res.json({
        success: true,
        message: `Archivos desplegados: ${deployedFiles.join(', ')}`,
        projectRoot: PROJECT_ROOT,
        files: deployedFiles
      });
    } catch (err) {
      console.error('Error deploying:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get project info (paths, etc.)
  app.get('/api/project-info', (req, res) => {
    res.json({
      projectRoot: PROJECT_ROOT,
      roadmapKitPath: ROADMAP_KIT_PATH,
      roadmapPath: ROADMAP_PATH
    });
  });

  // System prompt for roadmap generation
  const ROADMAP_SYSTEM_PROMPT = `Eres un experto en arquitectura de software y gestión de proyectos. Tu tarea es analizar la descripción de un proyecto y generar la configuración completa para ROADMAP-KIT.

ROADMAP-KIT es un sistema que ayuda a las IAs a mantener contexto sobre proyectos de desarrollo. Genera dos archivos:

1. **roadmap.json** - Contiene toda la información del proyecto:
   - project_info: nombre, versión, descripción, propósito, stack, arquitectura, convenciones
   - shared_resources: componentes UI, utilidades, tablas de BD que la IA debe reutilizar
   - features: funcionalidades divididas en tareas específicas

2. **.clinerules** - Reglas que la IA debe seguir al trabajar en el proyecto

INSTRUCCIONES IMPORTANTES:

1. **Analiza la descripción** y extrae:
   - Tecnologías mencionadas → stack
   - Funcionalidades requeridas → features
   - Cada funcionalidad → dividir en 3-7 tareas específicas
   - Patrones de arquitectura → architecture, conventions

2. **Para cada FEATURE**:
   - Crea un ID único en kebab-case (ej: "user-auth", "product-crud")
   - Nombre descriptivo
   - Descripción detallada
   - Prioridad: high (core), medium (importante), low (nice-to-have)
   - 3-7 tareas específicas y accionables

3. **Para cada TASK**:
   - ID único: {feature-id}-{task-name} en kebab-case
   - Nombre corto y claro
   - Descripción con instrucciones específicas de implementación
   - Prioridad
   - status: "pending" (todas empiezan así)

4. **Para shared_resources**:
   - Identifica componentes UI reutilizables que se necesitarán
   - Identifica utilidades/helpers comunes
   - Identifica tablas de base de datos necesarias

5. **Para conventions**:
   - naming: cómo nombrar variables, componentes, archivos
   - file_structure: organización de carpetas
   - database: convenciones de BD
   - styling: sistema de estilos
   - error_handling: cómo manejar errores

RESPONDE ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "roadmap": {
    "project_info": {
      "name": "string",
      "version": "1.0.0",
      "description": "string",
      "purpose": "string",
      "stack": ["string"],
      "architecture": "string",
      "total_progress": 0,
      "last_sync": "ISO date string",
      "conventions": {
        "naming": {
          "variables": "string",
          "components": "string",
          "files": "string",
          "constants": "string"
        },
        "file_structure": "string",
        "database": "string",
        "styling": "string",
        "error_handling": "string"
      },
      "shared_resources": {
        "ui_components": [
          {
            "path": "string",
            "description": "string",
            "usage": "string"
          }
        ],
        "utilities": [
          {
            "path": "string",
            "description": "string",
            "exports": ["string"],
            "usage": "string",
            "warning": "string or null"
          }
        ],
        "database_tables": [
          {
            "name": "string",
            "fields": ["string"],
            "description": "string"
          }
        ]
      }
    },
    "features": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "status": "pending",
        "progress": 0,
        "priority": "high|medium|low",
        "tasks": [
          {
            "id": "string",
            "name": "string",
            "description": "string detallada con instrucciones",
            "status": "pending",
            "priority": "high|medium|low",
            "ai_notes": "",
            "affected_files": [],
            "reused_resources": [],
            "git": {
              "branch": null,
              "pr_number": null,
              "pr_url": null,
              "last_commit": null,
              "commits": []
            },
            "metrics": {
              "lines_added": 0,
              "lines_removed": 0,
              "files_created": 0,
              "files_modified": 0,
              "complexity_score": 0
            },
            "technical_debt": [],
            "started_at": null,
            "completed_at": null
          }
        ]
      }
    ]
  },
  "clinerules": "string con el contenido del archivo .clinerules"
}

NO incluyas explicaciones, solo el JSON. Asegúrate de que sea JSON válido.`;

  // Helper function to run Claude Code CLI
  function runClaudeCode(prompt) {
    return new Promise((resolve, reject) => {
      console.log('Running Claude Code CLI...');

      // Expand PATH to include common user binary locations
      const homedir = process.env.HOME || process.env.USERPROFILE || '';
      const expandedPath = [
        `${homedir}/.local/bin`,
        `${homedir}/.npm-global/bin`,
        `${homedir}/bin`,
        '/usr/local/bin',
        process.env.PATH
      ].filter(Boolean).join(':');

      const claude = spawn('claude', ['-p', prompt, '--output-format', 'text'], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, PATH: expandedPath },
        shell: true
      });

      let stdout = '';
      let stderr = '';

      claude.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claude.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claude.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Claude Code exited with code ${code}`));
        }
      });

      claude.on('error', (err) => {
        reject(new Error(`Failed to start Claude Code: ${err.message}. Make sure 'claude' CLI is installed and authenticated.`));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        claude.kill();
        reject(new Error('Claude Code timeout after 5 minutes'));
      }, 300000);
    });
  }

  // API: Generate roadmap with Claude AI (supports both API key and Claude Code CLI)
  app.post('/api/generate', async (req, res) => {
    try {
      const { apiKey, projectDescription, projectFiles, existingConfig, useClaudeCode } = req.body;

      if (!projectDescription) {
        return res.status(400).json({ error: 'Descripcion del proyecto requerida' });
      }

      let userMessage = `# Descripción del Proyecto\n\n${projectDescription}`;

      if (projectFiles) {
        userMessage += `\n\n# Archivos del Proyecto\n\n${projectFiles}`;
      }

      if (existingConfig) {
        userMessage += `\n\n# Configuración Existente (para referencia)\n\n${JSON.stringify(existingConfig, null, 2)}`;
      }

      let responseText;

      // Mode 1: Use Claude Code CLI (subscription-based)
      if (useClaudeCode) {
        console.log('Using Claude Code CLI (subscription mode)...');

        const fullPrompt = `${ROADMAP_SYSTEM_PROMPT}\n\n---\n\n${userMessage}`;
        responseText = await runClaudeCode(fullPrompt);
      }
      // Mode 2: Use Anthropic API (API key)
      else {
        if (!apiKey) {
          return res.status(400).json({ error: 'API Key requerida (o usa el modo Claude Code)' });
        }

        console.log('Using Anthropic API...');
        const anthropic = new Anthropic({ apiKey });

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          system: ROADMAP_SYSTEM_PROMPT
        });

        responseText = message.content[0].text;
      }

      // Parse the JSON response
      let parsed;
      try {
        // Try to extract JSON if there's extra text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        return res.status(500).json({
          error: 'Error parsing AI response',
          raw: responseText.substring(0, 1000)
        });
      }

      // Validate the response structure
      if (!parsed.roadmap || !parsed.clinerules) {
        return res.status(500).json({
          error: 'Invalid response structure from AI',
          raw: responseText.substring(0, 1000)
        });
      }

      // Add timestamp
      if (parsed.roadmap.project_info) {
        parsed.roadmap.project_info.last_sync = new Date().toISOString();
      }

      res.json({
        success: true,
        roadmap: parsed.roadmap,
        clinerules: parsed.clinerules,
        mode: useClaudeCode ? 'claude-code' : 'api'
      });

    } catch (err) {
      console.error('AI Generation error:', err);

      if (err.status === 401) {
        return res.status(401).json({ error: 'API Key inválida' });
      }
      if (err.status === 429) {
        return res.status(429).json({ error: 'Rate limit excedido. Intenta de nuevo en unos minutos.' });
      }

      res.status(500).json({ error: err.message || 'Error generating with AI' });
    }
  });

  // API: Check if Claude Code CLI is available
  app.get('/api/claude-code-status', async (req, res) => {
    try {
      // Expand PATH to include common user binary locations
      const homedir = process.env.HOME || process.env.USERPROFILE || '';
      const expandedPath = [
        `${homedir}/.local/bin`,
        `${homedir}/.npm-global/bin`,
        `${homedir}/bin`,
        '/usr/local/bin',
        process.env.PATH
      ].filter(Boolean).join(':');

      const claude = spawn('claude', ['--version'], {
        shell: true,
        env: { ...process.env, PATH: expandedPath }
      });

      let version = '';
      let responded = false;

      claude.stdout.on('data', (data) => {
        version += data.toString();
      });

      claude.on('close', (code) => {
        if (responded) return;
        responded = true;
        if (code === 0) {
          res.json({ available: true, version: version.trim() });
        } else {
          res.json({ available: false, error: 'Claude Code not found or not authenticated' });
        }
      });

      claude.on('error', () => {
        if (responded) return;
        responded = true;
        res.json({ available: false, error: 'Claude Code CLI not installed' });
      });

      // Timeout
      setTimeout(() => {
        if (responded) return;
        responded = true;
        claude.kill();
        res.json({ available: false, error: 'Timeout checking Claude Code' });
      }, 5000);

    } catch (err) {
      res.json({ available: false, error: err.message });
    }
  });

  // API: Save API key to .env
  app.post('/api/save-api-key', authMiddleware, async (req, res) => {
    try {
      const { apiKey } = req.body;
      const envPath = path.join(ROADMAP_KIT_PATH, '.env');

      let envContent = '';
      try {
        envContent = await fs.readFile(envPath, 'utf-8');
      } catch (e) {
        // File doesn't exist, create new
      }

      // Update or add ANTHROPIC_API_KEY
      if (envContent.includes('ANTHROPIC_API_KEY=')) {
        envContent = envContent.replace(/ANTHROPIC_API_KEY=.*/g, `ANTHROPIC_API_KEY=${apiKey}`);
      } else {
        envContent += `\nANTHROPIC_API_KEY=${apiKey}`;
      }

      await fs.writeFile(envPath, envContent.trim() + '\n', 'utf-8');

      // Update process.env
      process.env.ANTHROPIC_API_KEY = apiKey;

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get saved API key (masked)
  app.get('/api/api-key-status', (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    res.json({
      hasKey: !!apiKey,
      maskedKey: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : null
    });
  });

  // API: Scan project structure
  app.get('/api/scan-project', async (req, res) => {
    try {
      const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv', 'coverage', '.cache'];
      const ignoreFiles = ['.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

      const projectFiles = [];
      const fileTypes = {};
      let totalFiles = 0;
      let totalSize = 0;

      async function scanDir(dir, depth = 0) {
        if (depth > 5) return; // Max depth
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (ignoreDirs.includes(entry.name)) continue;
            if (ignoreFiles.includes(entry.name)) continue;
            if (entry.name.startsWith('.') && depth > 0) continue;

            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(PROJECT_ROOT, fullPath);

            if (entry.isDirectory()) {
              await scanDir(fullPath, depth + 1);
            } else {
              try {
                const stat = await fs.stat(fullPath);
                const ext = path.extname(entry.name).toLowerCase() || 'no-ext';
                fileTypes[ext] = (fileTypes[ext] || 0) + 1;
                totalFiles++;
                totalSize += stat.size;

                // Only include code files with preview
                const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.vue', '.svelte', '.css', '.scss', '.html', '.json', '.md', '.yaml', '.yml'];
                if (codeExts.includes(ext) && stat.size < 50000) { // Skip large files
                  projectFiles.push({
                    path: relativePath,
                    name: entry.name,
                    ext,
                    size: stat.size,
                    modified: stat.mtime
                  });
                }
              } catch (e) {
                // Skip files we can't stat
              }
            }
          }
        } catch (e) {
          // Skip dirs we can't read
        }
      }

      await scanDir(PROJECT_ROOT);

      // Detect tech stack
      const techStack = [];
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      try {
        const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps.react) techStack.push('React');
        if (allDeps.next) techStack.push('Next.js');
        if (allDeps.vue) techStack.push('Vue');
        if (allDeps.svelte) techStack.push('Svelte');
        if (allDeps.express) techStack.push('Express');
        if (allDeps.fastify) techStack.push('Fastify');
        if (allDeps.prisma || allDeps['@prisma/client']) techStack.push('Prisma');
        if (allDeps.mongoose) techStack.push('MongoDB');
        if (allDeps.pg || allDeps.postgres) techStack.push('PostgreSQL');
        if (allDeps.typescript) techStack.push('TypeScript');
        if (allDeps.tailwindcss) techStack.push('TailwindCSS');
      } catch (e) {}

      // Check for Python
      if (fileTypes['.py']) techStack.push('Python');
      // Check for Go
      if (fileTypes['.go']) techStack.push('Go');

      // Get key file previews (first 50 lines of important files)
      const keyFiles = [];
      const importantFiles = ['README.md', 'package.json', 'src/App.jsx', 'src/App.tsx', 'src/index.js', 'src/main.py', 'main.go'];
      for (const filename of importantFiles) {
        const filePath = path.join(PROJECT_ROOT, filename);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').slice(0, 50);
          keyFiles.push({ path: filename, preview: lines.join('\n') });
        } catch (e) {}
      }

      res.json({
        projectRoot: PROJECT_ROOT,
        totalFiles,
        totalSize,
        fileTypes,
        techStack,
        keyFiles,
        files: projectFiles.slice(0, 200) // Limit to 200 files
      });
    } catch (err) {
      console.error('Scan error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API: Analyze project with Claude (enhanced)
  app.post('/api/analyze-project', async (req, res) => {
    try {
      const { requirements, projectScan, existingRoadmap, useClaudeCode } = req.body;

      if (!requirements?.trim()) {
        return res.status(400).json({ error: 'Requirements are required' });
      }

      // Build comprehensive prompt
      const analysisPrompt = `Eres un experto arquitecto de software. Tu tarea es analizar un proyecto existente y generar un roadmap estructurado basado en los requerimientos proporcionados.

## PROYECTO ACTUAL

${projectScan ? `### Estructura de archivos
- Total archivos: ${projectScan.totalFiles}
- Stack detectado: ${projectScan.techStack?.join(', ') || 'No detectado'}
- Tipos de archivo: ${JSON.stringify(projectScan.fileTypes)}

### Archivos clave encontrados:
${projectScan.keyFiles?.map(f => `#### ${f.path}\n\`\`\`\n${f.preview}\n\`\`\``).join('\n\n') || 'No disponible'}

### Lista de archivos del proyecto:
${projectScan.files?.map(f => f.path).join('\n') || 'No disponible'}
` : 'No hay análisis del proyecto disponible.'}

${existingRoadmap ? `### Roadmap existente:
${JSON.stringify(existingRoadmap.project_info, null, 2)}

### Features actuales:
${existingRoadmap.features?.map(f => `- ${f.name} (${f.progress}% completado)`).join('\n') || 'Sin features'}
` : ''}

## REQUERIMIENTOS DEL USUARIO

${requirements}

## INSTRUCCIONES

Analiza el proyecto y los requerimientos para generar:

1. **project_info actualizado**:
   - Mantén la info existente si es válida
   - Actualiza stack, conventions basándote en el código real
   - Identifica shared_resources reales del proyecto

2. **features**:
   - Crea features basadas en los requerimientos
   - Para cada feature, crea 3-7 tasks específicas y accionables
   - Indica qué archivos serían afectados basándote en la estructura real
   - Si hay features existentes completadas, mantén su estado

3. **Sé específico**:
   - Usa paths reales del proyecto en affected_files
   - Referencia componentes/utilidades existentes en reused_resources
   - Las descripciones deben tener instrucciones detalladas

RESPONDE ÚNICAMENTE con JSON válido con esta estructura:
{
  "roadmap": {
    "project_info": { ... },
    "features": [
      {
        "id": "feature-id",
        "name": "Feature Name",
        "description": "Descripción detallada",
        "status": "pending|in_progress|completed",
        "progress": 0,
        "priority": "high|medium|low",
        "tasks": [
          {
            "id": "task-id",
            "name": "Task name",
            "description": "Instrucciones detalladas de implementación",
            "status": "pending",
            "priority": "high|medium|low",
            "affected_files": ["path/to/file.js"],
            "reused_resources": ["@/lib/utils"],
            "ai_notes": "",
            "technical_debt": []
          }
        ]
      }
    ]
  },
  "clinerules": "contenido del archivo .clinerules",
  "analysis": {
    "summary": "Resumen del análisis",
    "suggestions": ["sugerencia 1", "sugerencia 2"],
    "warnings": ["advertencia si hay alguna"]
  }
}`;

      let responseText;

      if (useClaudeCode) {
        responseText = await runClaudeCode(analysisPrompt);
      } else {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return res.status(400).json({ error: 'API Key required or use Claude Code mode' });
        }

        const anthropic = new Anthropic({ apiKey });
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          messages: [{ role: 'user', content: analysisPrompt }]
        });
        responseText = message.content[0].text;
      }

      // Parse response
      let parsed;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseErr) {
        return res.status(500).json({
          error: 'Error parsing AI response',
          raw: responseText.substring(0, 2000)
        });
      }

      // Add timestamp
      if (parsed.roadmap?.project_info) {
        parsed.roadmap.project_info.last_sync = new Date().toISOString();
      }

      res.json({
        success: true,
        ...parsed
      });
    } catch (err) {
      console.error('Analysis error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  const PORT = process.env.PORT || 6969;

  // Load config for startup log
  const startupConfig = await loadAuthConfig();
  const authEnabled = startupConfig?.settings?.requireAuth ?? true;
  const userCount = startupConfig?.users?.length || 0;

  app.listen(PORT, () => {
    console.log(`\n  🗺️  ROADMAP-KIT Dashboard`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Roadmap: ${ROADMAP_PATH}`);
    console.log(`  ➜  Auth:    ${authEnabled ? `Habilitada (${userCount} usuarios)` : 'Deshabilitada'}`);
    if (authEnabled && userCount > 0) {
      const admins = startupConfig.users.filter(u => u.role === 'admin');
      console.log(`  ➜  Admins:  ${admins.map(a => a.email).join(', ')}`);
    }
    console.log(`  ➜  Hot-reload: auth.json changes apply without restart`);
    console.log('');
  });
}

createServer().catch(console.error);
