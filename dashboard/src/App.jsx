import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import {
  Terminal, Search, RefreshCw, AlertTriangle, Package,
  Code, Settings, Plus, Save, X, Zap, Clock, CheckCircle2,
  Circle, Loader2, Database, ChevronRight, Menu, Sparkles,
  Info, Server, FileCode, Layers, Tag, Download, Copy, Check,
  Rocket, FolderOpen, Edit3, Eye, ChevronDown, Lock, LogOut, User,
  HelpCircle, GitCommit, Bot, Wrench, Activity, Grid, Play,
  ArrowRight, Minus as MinusIcon, PlusCircle, MinusCircle, GitBranch,
  Globe, Command, Columns, List, Link2, MessageSquare, Timer,
  BarChart3, FileDown, History, Bell, Keyboard, Filter
} from 'lucide-react';

// ============ TOAST NOTIFICATION SYSTEM ============
const ToastContext = createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[200] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 border backdrop-blur-sm animate-slide-up ${
              t.type === 'success' ? 'border-matrix/50 bg-matrix/10 text-matrix' :
              t.type === 'error' ? 'border-alert/50 bg-alert/10 text-alert' :
              t.type === 'warning' ? 'border-signal/50 bg-signal/10 text-signal' :
              'border-cyber/50 bg-cyber/10 text-cyber'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {t.type === 'error' && <X className="w-4 h-4" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            {t.type === 'info' && <Info className="w-4 h-4" />}
            <span className="font-mono text-sm">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
};

// ============ GLOBAL SEARCH MODAL ============
function GlobalSearchModal({ isOpen, onClose, roadmap, onNavigate, t }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim() || !roadmap) return [];
    const q = query.toLowerCase();
    const items = [];

    // Search features
    roadmap.features?.forEach(feature => {
      if (feature.name?.toLowerCase().includes(q) || feature.description?.toLowerCase().includes(q)) {
        items.push({ type: 'feature', id: feature.id, name: feature.name, description: feature.description });
      }
      // Search tasks
      feature.tasks?.forEach(task => {
        if (task.name?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q)) {
          items.push({ type: 'task', id: task.id, name: task.name, featureName: feature.name, status: task.status });
        }
      });
    });

    // Search resources
    const resources = roadmap.project_info?.shared_resources || {};
    resources.ui_components?.forEach(comp => {
      if (comp.path?.toLowerCase().includes(q) || comp.description?.toLowerCase().includes(q)) {
        items.push({ type: 'component', name: comp.path, description: comp.description });
      }
    });
    resources.utilities?.forEach(util => {
      if (util.path?.toLowerCase().includes(q) || util.description?.toLowerCase().includes(q)) {
        items.push({ type: 'utility', name: util.path, description: util.description });
      }
    });

    return items.slice(0, 10);
  }, [query, roadmap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[150]" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="bg-void-200 border border-white/10">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t ? t('common.search') : "Search features, tasks, resources..."}
              className="flex-1 bg-transparent font-mono text-sm text-white placeholder-gray-600 outline-none"
            />
            <kbd className="px-2 py-1 bg-void-100 border border-white/10 text-gray-600 font-mono text-[10px]">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.trim() === '' ? (
              <div className="p-8 text-center">
                <Command className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="font-mono text-xs text-gray-600">{t ? (t('common.search') + '...') : 'Type to search...'}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="font-mono text-xs text-gray-600">No results found</p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id || item.name}-${idx}`}
                    onClick={() => {
                      if (item.type === 'feature' || item.type === 'task') onNavigate('features');
                      else if (item.type === 'component' || item.type === 'utility') onNavigate('resources');
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-all text-left"
                  >
                    <div className={`w-8 h-8 border flex items-center justify-center ${
                      item.type === 'feature' ? 'border-matrix/50 bg-matrix/10' :
                      item.type === 'task' ? 'border-signal/50 bg-signal/10' :
                      'border-cyber/50 bg-cyber/10'
                    }`}>
                      {item.type === 'feature' && <Zap className="w-4 h-4 text-matrix" />}
                      {item.type === 'task' && <CheckCircle2 className="w-4 h-4 text-signal" />}
                      {item.type === 'component' && <Package className="w-4 h-4 text-cyber" />}
                      {item.type === 'utility' && <Code className="w-4 h-4 text-cyber" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-white truncate">{item.name}</div>
                      <div className="font-mono text-[10px] text-gray-500 truncate">
                        {item.type === 'task' && item.featureName ? `${item.featureName} • ` : ''}
                        {item.description?.slice(0, 60) || item.type}
                      </div>
                    </div>
                    {item.status && (
                      <span className={`px-2 py-0.5 text-[9px] font-mono ${
                        item.status === 'completed' ? 'bg-matrix/20 text-matrix' :
                        item.status === 'in_progress' ? 'bg-signal/20 text-signal' :
                        'bg-gray-700 text-gray-400'
                      }`}>{item.status}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4 text-gray-600 font-mono text-[10px]">
              <span><kbd className="px-1 bg-void-100 border border-white/10">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 bg-void-100 border border-white/10">↵</kbd> Select</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ KEYBOARD SHORTCUTS ============
function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape' && handlers.onEscape) {
          handlers.onEscape();
        }
        return;
      }

      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      // Number keys 1-7 for tab navigation
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key >= '1' && e.key <= '7') {
          e.preventDefault();
          handlers.onTabChange?.(parseInt(e.key) - 1);
          return;
        }
      }

      // Escape
      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      // ? for help
      if (e.key === '?' && !e.shiftKey) {
        handlers.onHelp?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// ============ ACTIVITY LOG ============
const ActivityContext = createContext();

function ActivityProvider({ children }) {
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('roadmap-kit-activities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const logActivity = useCallback((action, details = {}) => {
    const activity = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: details.user || 'System'
    };
    setActivities(prev => {
      const updated = [activity, ...prev].slice(0, 100); // Keep last 100
      localStorage.setItem('roadmap-kit-activities', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
    localStorage.removeItem('roadmap-kit-activities');
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, logActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within ActivityProvider');
  return context;
};

// ============ INTERNATIONALIZATION ============
const translations = {
  en: {
    // Navigation
    nav: {
      setup: 'SETUP',
      features: 'FEATURES',
      resources: 'RESOURCES',
      debt: 'DEBT',
      info: 'INFO',
      settings: 'SETTINGS',
      help: 'HELP'
    },
    // Common
    common: {
      save: 'SAVE',
      cancel: 'CANCEL',
      confirm: 'CONFIRM',
      delete: 'DELETE',
      edit: 'EDIT',
      add: 'ADD',
      close: 'CLOSE',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      search: 'Search...',
      all: 'All',
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      copy: 'Copy',
      copied: 'Copied',
      download: 'Download',
      deploy: 'Deploy',
      refresh: 'Refresh',
      retry: 'Retry',
      ok: 'OK',
      yes: 'Yes',
      no: 'No'
    },
    // Auth
    auth: {
      login: 'LOGIN',
      logout: 'LOGOUT',
      email: 'Email',
      password: 'Password',
      loginTitle: 'ACCESS REQUIRED',
      loginSubtitle: 'Enter your credentials',
      loginButton: 'AUTHENTICATE',
      loginError: 'Invalid credentials',
      verifyingAccess: '> VERIFYING ACCESS...',
      loadingRoadmap: '> LOADING ROADMAP...'
    },
    // Sidebar
    sidebar: {
      projectRoadmap: 'PROJECT ROADMAP',
      saveChanges: 'SAVE CHANGES',
      saving: 'SAVING...',
      saved: 'SAVED',
      unsavedChanges: 'Unsaved changes',
      addFeature: 'ADD FEATURE',
      aiGenerate: 'AI GENERATE',
      collapse: 'Collapse'
    },
    // Stats
    stats: {
      total: 'TOTAL',
      completed: 'DONE',
      inProgress: 'ACTIVE',
      pending: 'TODO',
      debts: 'DEBTS'
    },
    // Features
    features: {
      title: 'FEATURES',
      noFeatures: 'NO FEATURES',
      addFirst: 'Add your first feature to start tracking progress',
      addFeature: 'ADD FEATURE',
      tasks: 'tasks',
      addTask: 'ADD TASK',
      taskName: 'Task name',
      taskDescription: 'Task description',
      priority: 'Priority',
      assignTo: 'Assign to',
      unassigned: 'Unassigned',
      markComplete: 'Mark complete',
      markPending: 'Mark pending',
      deleteTask: 'Delete task',
      aiNotes: 'AI Notes',
      technicalDebt: 'Technical Debt',
      affectedFiles: 'Affected Files',
      featureName: 'Feature name',
      featureDescription: 'Feature description'
    },
    // Resources
    resources: {
      title: 'SHARED RESOURCES',
      subtitle: 'Components and utilities that AI should reuse',
      uiComponents: 'UI COMPONENTS',
      utilities: 'UTILITIES',
      dbTables: 'DATABASE TABLES',
      noComponents: 'No components registered',
      noUtilities: 'No utilities registered',
      noTables: 'No tables registered',
      usage: 'Usage',
      exports: 'Exports',
      fields: 'Fields',
      warning: 'Warning'
    },
    // Debt
    debt: {
      title: 'TECHNICAL DEBT',
      subtitle: 'Issues to address in future iterations',
      noDebt: 'NO TECHNICAL DEBT',
      noDebtDesc: 'Great! No pending technical debt registered',
      severity: 'Severity',
      effort: 'Effort',
      source: 'Source',
      bySeverity: 'BY SEVERITY',
      items: 'items'
    },
    // Info
    info: {
      title: 'PROJECT INFO',
      version: 'Version',
      lastSync: 'Last Sync',
      stack: 'Tech Stack',
      architecture: 'Architecture',
      purpose: 'Purpose',
      conventions: 'Conventions',
      naming: 'Naming',
      fileStructure: 'File Structure',
      database: 'Database',
      styling: 'Styling',
      errorHandling: 'Error Handling'
    },
    // Settings
    settings: {
      title: 'SETTINGS',
      profile: 'PROFILE',
      users: 'USERS',
      history: 'HISTORY',
      files: 'FILES',
      language: 'LANGUAGE',
      // Profile
      yourProfile: 'YOUR PROFILE',
      name: 'Name',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      updateProfile: 'UPDATE PROFILE',
      // Users
      authRequired: 'Authentication Required',
      authRequiredDesc: 'Disable to allow anonymous access',
      addUser: 'ADD USER',
      role: 'Role',
      admin: 'Admin',
      member: 'Member',
      createdAt: 'Created',
      lastLogin: 'Last Login',
      never: 'Never',
      deleteUser: 'Delete user',
      editUser: 'Edit user',
      createUser: 'CREATE USER',
      updateUser: 'UPDATE USER',
      // History
      versionHistory: 'VERSION HISTORY',
      lastChanges: 'Last {count} changes',
      clickToPreview: 'Click to preview & restore',
      noVersions: 'NO VERSIONS YET',
      versionsAutoSaved: 'Versions are saved automatically when you save changes',
      loadHistory: 'LOAD HISTORY',
      versionDiff: 'VERSION DIFF',
      restoreVersion: 'RESTORE THIS VERSION',
      restoreTitle: 'RESTORE VERSION',
      restoreMessage: 'This will restore the selected version. A backup of the current state will be saved first.',
      restore: 'RESTORE',
      restored: 'VERSION RESTORED',
      restoredMessage: 'The roadmap has been restored successfully. A backup was saved.',
      restoreFailed: 'RESTORE FAILED',
      added: 'ADDED',
      removed: 'REMOVED',
      modified: 'MODIFIED',
      noChanges: 'NO CHANGES',
      matchesVersion: 'Current roadmap matches this version',
      viewRawJson: 'View raw JSON',
      closePreview: 'CLOSE PREVIEW',
      feature: 'FEATURE',
      // Files
      projectFiles: 'PROJECT FILES',
      clinerules: '.clinerules',
      clinerulesDesc: 'AI rules file',
      roadmapJson: 'roadmap.json',
      roadmapJsonDesc: 'Project roadmap data',
      editJson: 'EDIT JSON',
      viewJson: 'VIEW JSON',
      applyChanges: 'APPLY',
      invalidJson: 'Invalid JSON',
      deployFiles: 'DEPLOY FILES',
      deployBoth: 'Deploy both .clinerules and .cursorrules',
      deploying: 'DEPLOYING...',
      downloadFiles: 'DOWNLOAD FILES'
    },
    // Help
    help: {
      title: 'HELP',
      templates: 'TEMPLATES',
      commits: 'COMMITS',
      aiWorkflow: 'AI WORKFLOW',
      debug: 'DEBUG',
      // Templates
      referenceFiles: '# REFERENCE FILES FOR AI',
      sharePaths: 'Share these paths with your AI assistant:',
      clinerulesTpl: 'CLINERULES TEMPLATE',
      roadmapTpl: 'ROADMAP TEMPLATE',
      exampleEcommerce: 'EXAMPLE: E-COMMERCE',
      exampleApi: 'EXAMPLE: API REST',
      debtGuide: 'DEBT GUIDE',
      aiInstructions: '# AI INSTRUCTIONS',
      quickPrompt: 'QUICK PROMPT',
      copyPrompt: 'COPY PROMPT',
      // Commits
      commitFormat: '# COMMIT FORMAT',
      commitFormatDesc: 'Use this format for auto-updating roadmap:',
      availableTags: 'AVAILABLE TAGS:',
      tag: 'TAG',
      values: 'VALUES',
      example: 'EXAMPLE',
      examples: 'EXAMPLES:',
      completeTask: '# Complete a task',
      taskInProgress: '# Task in progress',
      withDebt: '# With technical debt',
      syncWithGit: 'SYNC WITH GIT',
      afterCommits: 'After commits, run:',
      updatesInfo: 'This updates: task status, metrics, debt, and progress.',
      // AI Workflow
      recommendedWorkflow: '# RECOMMENDED WORKFLOW',
      step01: 'AI reads .clinerules and roadmap.json',
      step02: 'AI checks shared_resources before creating code',
      step03: 'AI updates roadmap and commits with tags',
      aiMustDo: 'AI MUST DO',
      aiMustNot: 'AI MUST NOT',
      mustDoList: [
        'Read task description before starting',
        'Check shared resources before creating code',
        'Reuse existing components and utilities',
        'Follow project conventions',
        'Register technical debt if incomplete',
        'Use correct commit format'
      ],
      mustNotList: [
        'Create duplicate components',
        'Ignore project conventions',
        'Forget to register technical debt',
        'Commit without required tags',
        'Modify shared resources without reason'
      ],
      // Troubleshooting
      troubleshooting: '# TROUBLESHOOTING',
      fileSummary: 'FILE SUMMARY:',
      file: 'FILE',
      location: 'LOCATION',
      purposeCol: 'PURPOSE',
      projectState: 'Project state',
      aiRules: 'AI rules',
      cursorRules: 'Cursor rules',
      config: 'Configuration'
    },
    // Setup
    setup: {
      title: 'AI SETUP WIZARD',
      subtitle: 'Describe your project and Claude will generate the configuration',
      requirements: 'REQUIREMENTS',
      requirementsPlaceholder: 'Describe the features, functionality or improvements you want to add to your project...',
      projectScan: 'PROJECT SCAN',
      scanning: 'Scanning project...',
      scanComplete: 'Scan complete',
      files: 'files',
      techStack: 'Tech Stack',
      analyze: 'ANALYZE WITH AI',
      analyzing: 'Analyzing...',
      claudeCode: 'Claude Code CLI',
      available: 'Available',
      notAvailable: 'Not available',
      usingSubscription: 'Using your Claude subscription',
      // Setup complete
      setupComplete: 'SETUP COMPLETE',
      setupCompleteDesc: 'Your roadmap is configured and ready to use',
      roadmapStatus: 'ROADMAP STATUS',
      goToDashboard: 'GO TO DASHBOARD',
      reconfigure: 'RECONFIGURE',
      // Steps
      stepConnect: 'CONNECT',
      stepDescribe: 'DESCRIBE',
      stepReview: 'REVIEW',
      stepDone: 'DONE',
      // Connection
      chooseConnection: 'CHOOSE CONNECTION MODE',
      chooseConnectionDesc: 'Choose how to connect with Claude to generate your project configuration.',
      recommended: 'RECOMMENDED',
      apiKeyMode: 'API KEY',
      apiKeyDesc: 'Use an Anthropic API key. Pay per use (~$0.05-0.15 per generation).',
      apiKeyConfigured: 'API Key configured',
      noApiKey: 'No API Key configured',
      installClaudeCode: 'INSTALL CLAUDE CODE',
      installClaudeCodeDesc: 'To use your subscription, you need Claude Code installed and authenticated.',
      verifyAgain: 'VERIFY AGAIN',
      continueWith: 'CONTINUE WITH CLAUDE CODE',
      // Validation
      roadmapComplete: 'ROADMAP COMPLETE',
      roadmapIncomplete: 'ROADMAP INCOMPLETE',
      roadmapNeedsReview: 'ROADMAP NEEDS REVIEW',
      issuesToFix: 'ISSUES TO FIX',
      warnings: 'WARNINGS',
      continueToDashboard: 'CONTINUE TO DASHBOARD',
      regenerateAnyway: 'REGENERATE ANYWAY',
      aiFixIssues: 'AI FIX ISSUES',
      skipAnyway: 'SKIP ANYWAY',
      // Analysis
      projectAnalysis: 'PROJECT ANALYSIS',
      keyFiles: 'KEY FILES',
      allFiles: 'ALL FILES',
      requirementsDesc: 'Describe the features, functionality or improvements you want to implement. Claude will analyze your project and generate a structured roadmap.',
      analyzeGenerate: 'ANALYZE & GENERATE ROADMAP',
      analyzingProject: 'ANALYZING PROJECT...',
      // Review
      analysisSummary: 'ANALYSIS SUMMARY',
      suggestions: 'SUGGESTIONS',
      generatedRoadmap: 'GENERATED ROADMAP',
      featuresPreview: 'FEATURES PREVIEW',
      applyConfig: 'APPLY CONFIGURATION',
      // Done
      setupDone: 'SETUP COMPLETE',
      setupDoneDesc: 'Your roadmap.json and .clinerules have been generated and saved.',
      startOver: 'START OVER',
      viewDashboard: 'VIEW DASHBOARD'
    },
    // Modals
    modals: {
      addFeature: 'ADD FEATURE',
      editFeature: 'EDIT FEATURE',
      addTask: 'ADD TASK',
      deleteConfirm: 'Are you sure you want to delete this?',
      unsavedWarning: 'You have unsaved changes. Are you sure you want to leave?'
    }
  },
  es: {
    // Navigation
    nav: {
      setup: 'ASISTENTE',
      features: 'ESTADO',
      resources: 'RECURSOS',
      debt: 'DEUDA',
      info: 'INFO',
      settings: 'CONFIG',
      help: 'AYUDA'
    },
    // Common
    common: {
      save: 'GUARDAR',
      cancel: 'CANCELAR',
      confirm: 'CONFIRMAR',
      delete: 'ELIMINAR',
      edit: 'EDITAR',
      add: 'AÑADIR',
      close: 'CERRAR',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      search: 'Buscar...',
      all: 'Todos',
      pending: 'Pendiente',
      inProgress: 'En Progreso',
      completed: 'Completado',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
      copy: 'Copiar',
      copied: 'Copiado',
      download: 'Descargar',
      deploy: 'Desplegar',
      refresh: 'Actualizar',
      retry: 'Reintentar',
      ok: 'OK',
      yes: 'Sí',
      no: 'No'
    },
    // Auth
    auth: {
      login: 'INICIAR SESIÓN',
      logout: 'CERRAR SESIÓN',
      email: 'Email',
      password: 'Contraseña',
      loginTitle: 'ACCESO REQUERIDO',
      loginSubtitle: 'Introduce tus credenciales',
      loginButton: 'AUTENTICAR',
      loginError: 'Credenciales inválidas',
      verifyingAccess: '> VERIFICANDO ACCESO...',
      loadingRoadmap: '> CARGANDO ROADMAP...'
    },
    // Sidebar
    sidebar: {
      projectRoadmap: 'ROADMAP DEL PROYECTO',
      saveChanges: 'GUARDAR CAMBIOS',
      saving: 'GUARDANDO...',
      saved: 'GUARDADO',
      unsavedChanges: 'Cambios sin guardar',
      addFeature: 'AÑADIR FEATURE',
      aiGenerate: 'GENERAR CON IA',
      collapse: 'Colapsar'
    },
    // Stats
    stats: {
      total: 'TOTAL',
      completed: 'LISTO',
      inProgress: 'ACTIVO',
      pending: 'PEND.',
      debts: 'DEUDAS'
    },
    // Features
    features: {
      title: 'FEATURES',
      noFeatures: 'SIN FEATURES',
      addFirst: 'Añade tu primera feature para empezar a trackear el progreso',
      addFeature: 'AÑADIR FEATURE',
      tasks: 'tareas',
      addTask: 'AÑADIR TAREA',
      taskName: 'Nombre de la tarea',
      taskDescription: 'Descripción de la tarea',
      priority: 'Prioridad',
      assignTo: 'Asignar a',
      unassigned: 'Sin asignar',
      markComplete: 'Marcar completada',
      markPending: 'Marcar pendiente',
      deleteTask: 'Eliminar tarea',
      aiNotes: 'Notas de IA',
      technicalDebt: 'Deuda Técnica',
      affectedFiles: 'Archivos Afectados',
      featureName: 'Nombre de la feature',
      featureDescription: 'Descripción de la feature'
    },
    // Resources
    resources: {
      title: 'RECURSOS COMPARTIDOS',
      subtitle: 'Componentes y utilidades que la IA debe reutilizar',
      uiComponents: 'COMPONENTES UI',
      utilities: 'UTILIDADES',
      dbTables: 'TABLAS DE BD',
      noComponents: 'Sin componentes registrados',
      noUtilities: 'Sin utilidades registradas',
      noTables: 'Sin tablas registradas',
      usage: 'Uso',
      exports: 'Exporta',
      fields: 'Campos',
      warning: 'Advertencia'
    },
    // Debt
    debt: {
      title: 'DEUDA TÉCNICA',
      subtitle: 'Problemas a resolver en futuras iteraciones',
      noDebt: 'SIN DEUDA TÉCNICA',
      noDebtDesc: '¡Genial! No hay deuda técnica pendiente registrada',
      severity: 'Severidad',
      effort: 'Esfuerzo',
      source: 'Origen',
      bySeverity: 'POR SEVERIDAD',
      items: 'elementos'
    },
    // Info
    info: {
      title: 'INFO DEL PROYECTO',
      version: 'Versión',
      lastSync: 'Última Sync',
      stack: 'Stack Técnico',
      architecture: 'Arquitectura',
      purpose: 'Propósito',
      conventions: 'Convenciones',
      naming: 'Nomenclatura',
      fileStructure: 'Estructura de Archivos',
      database: 'Base de Datos',
      styling: 'Estilos',
      errorHandling: 'Manejo de Errores'
    },
    // Settings
    settings: {
      title: 'CONFIGURACIÓN',
      profile: 'PERFIL',
      users: 'USUARIOS',
      history: 'HISTORIAL',
      files: 'ARCHIVOS',
      language: 'IDIOMA',
      // Profile
      yourProfile: 'TU PERFIL',
      name: 'Nombre',
      currentPassword: 'Contraseña Actual',
      newPassword: 'Nueva Contraseña',
      updateProfile: 'ACTUALIZAR PERFIL',
      // Users
      authRequired: 'Autenticación Requerida',
      authRequiredDesc: 'Desactiva para permitir acceso anónimo',
      addUser: 'AÑADIR USUARIO',
      role: 'Rol',
      admin: 'Admin',
      member: 'Miembro',
      createdAt: 'Creado',
      lastLogin: 'Último Login',
      never: 'Nunca',
      deleteUser: 'Eliminar usuario',
      editUser: 'Editar usuario',
      createUser: 'CREAR USUARIO',
      updateUser: 'ACTUALIZAR USUARIO',
      // History
      versionHistory: 'HISTORIAL DE VERSIONES',
      lastChanges: 'Últimos {count} cambios',
      clickToPreview: 'Click para previsualizar y restaurar',
      noVersions: 'SIN VERSIONES AÚN',
      versionsAutoSaved: 'Las versiones se guardan automáticamente al guardar cambios',
      loadHistory: 'CARGAR HISTORIAL',
      versionDiff: 'DIFF DE VERSIÓN',
      restoreVersion: 'RESTAURAR ESTA VERSIÓN',
      restoreTitle: 'RESTAURAR VERSIÓN',
      restoreMessage: 'Esto restaurará la versión seleccionada. Se guardará una copia del estado actual primero.',
      restore: 'RESTAURAR',
      restored: 'VERSIÓN RESTAURADA',
      restoredMessage: 'El roadmap ha sido restaurado correctamente. Se guardó una copia de respaldo.',
      restoreFailed: 'ERROR AL RESTAURAR',
      added: 'AÑADIDO',
      removed: 'ELIMINADO',
      modified: 'MODIFICADO',
      noChanges: 'SIN CAMBIOS',
      matchesVersion: 'El roadmap actual coincide con esta versión',
      viewRawJson: 'Ver JSON raw',
      closePreview: 'CERRAR PREVIEW',
      feature: 'FEATURE',
      // Files
      projectFiles: 'ARCHIVOS DEL PROYECTO',
      clinerules: '.clinerules',
      clinerulesDesc: 'Archivo de reglas para IA',
      roadmapJson: 'roadmap.json',
      roadmapJsonDesc: 'Datos del roadmap',
      editJson: 'EDITAR JSON',
      viewJson: 'VER JSON',
      applyChanges: 'APLICAR',
      invalidJson: 'JSON inválido',
      deployFiles: 'DESPLEGAR ARCHIVOS',
      deployBoth: 'Desplegar ambos .clinerules y .cursorrules',
      deploying: 'DESPLEGANDO...',
      downloadFiles: 'DESCARGAR ARCHIVOS'
    },
    // Help
    help: {
      title: 'AYUDA',
      templates: 'PLANTILLAS',
      commits: 'COMMITS',
      aiWorkflow: 'FLUJO IA',
      debug: 'DEBUG',
      // Templates
      referenceFiles: '# ARCHIVOS DE REFERENCIA PARA IA',
      sharePaths: 'Comparte estas rutas con tu asistente IA:',
      clinerulesTpl: 'PLANTILLA CLINERULES',
      roadmapTpl: 'PLANTILLA ROADMAP',
      exampleEcommerce: 'EJEMPLO: E-COMMERCE',
      exampleApi: 'EJEMPLO: API REST',
      debtGuide: 'GUÍA DE DEUDA',
      aiInstructions: '# INSTRUCCIONES PARA IA',
      quickPrompt: 'PROMPT RÁPIDO',
      copyPrompt: 'COPIAR PROMPT',
      // Commits
      commitFormat: '# FORMATO DE COMMITS',
      commitFormatDesc: 'Usa este formato para actualizar el roadmap automáticamente:',
      availableTags: 'TAGS DISPONIBLES:',
      tag: 'TAG',
      values: 'VALORES',
      example: 'EJEMPLO',
      examples: 'EJEMPLOS:',
      completeTask: '# Completar una tarea',
      taskInProgress: '# Tarea en progreso',
      withDebt: '# Con deuda técnica',
      syncWithGit: 'SINCRONIZAR CON GIT',
      afterCommits: 'Después de los commits, ejecuta:',
      updatesInfo: 'Esto actualiza: estado de tareas, métricas, deuda y progreso.',
      // AI Workflow
      recommendedWorkflow: '# FLUJO DE TRABAJO RECOMENDADO',
      step01: 'La IA lee .clinerules y roadmap.json',
      step02: 'La IA verifica shared_resources antes de crear código',
      step03: 'La IA actualiza el roadmap y hace commits con tags',
      aiMustDo: 'LA IA DEBE',
      aiMustNot: 'LA IA NO DEBE',
      mustDoList: [
        'Leer la descripción de la tarea antes de empezar',
        'Verificar recursos compartidos antes de crear código',
        'Reutilizar componentes y utilidades existentes',
        'Seguir las convenciones del proyecto',
        'Registrar deuda técnica si queda incompleto',
        'Usar el formato de commit correcto'
      ],
      mustNotList: [
        'Crear componentes duplicados',
        'Ignorar las convenciones del proyecto',
        'Olvidar registrar deuda técnica',
        'Hacer commits sin los tags requeridos',
        'Modificar recursos compartidos sin razón'
      ],
      // Troubleshooting
      troubleshooting: '# SOLUCIÓN DE PROBLEMAS',
      fileSummary: 'RESUMEN DE ARCHIVOS:',
      file: 'ARCHIVO',
      location: 'UBICACIÓN',
      purposeCol: 'PROPÓSITO',
      projectState: 'Estado del proyecto',
      aiRules: 'Reglas de IA',
      cursorRules: 'Reglas de Cursor',
      config: 'Configuración'
    },
    // Setup
    setup: {
      title: 'ASISTENTE DE CONFIGURACIÓN IA',
      subtitle: 'Describe tu proyecto y Claude generará la configuración',
      requirements: 'REQUISITOS',
      requirementsPlaceholder: 'Describe las features, funcionalidades o mejoras que quieres añadir a tu proyecto...',
      projectScan: 'ESCANEO DEL PROYECTO',
      scanning: 'Escaneando proyecto...',
      scanComplete: 'Escaneo completo',
      files: 'archivos',
      techStack: 'Stack Tecnológico',
      analyze: 'ANALIZAR CON IA',
      analyzing: 'Analizando...',
      claudeCode: 'Claude Code CLI',
      available: 'Disponible',
      notAvailable: 'No disponible',
      usingSubscription: 'Usando tu suscripción de Claude',
      // Setup complete
      setupComplete: 'CONFIGURACIÓN COMPLETA',
      setupCompleteDesc: 'Tu roadmap está configurado y listo para usar',
      roadmapStatus: 'ESTADO DEL ROADMAP',
      goToDashboard: 'IR AL DASHBOARD',
      reconfigure: 'RECONFIGURAR',
      // Steps
      stepConnect: 'CONECTAR',
      stepDescribe: 'DESCRIBIR',
      stepReview: 'REVISAR',
      stepDone: 'LISTO',
      // Connection
      chooseConnection: 'ELEGIR MODO DE CONEXIÓN',
      chooseConnectionDesc: 'Elige cómo conectar con Claude para generar la configuración de tu proyecto.',
      recommended: 'RECOMENDADO',
      apiKeyMode: 'API KEY',
      apiKeyDesc: 'Usa una API key de Anthropic. Pago por uso (~$0.05-0.15 por generación).',
      apiKeyConfigured: 'API Key configurada',
      noApiKey: 'Sin API Key configurada',
      installClaudeCode: 'INSTALAR CLAUDE CODE',
      installClaudeCodeDesc: 'Para usar tu suscripción, necesitas tener Claude Code instalado y autenticado.',
      verifyAgain: 'VERIFICAR DE NUEVO',
      continueWith: 'CONTINUAR CON CLAUDE CODE',
      // Validation
      roadmapComplete: 'ROADMAP COMPLETO',
      roadmapIncomplete: 'ROADMAP INCOMPLETO',
      roadmapNeedsReview: 'ROADMAP NECESITA REVISIÓN',
      issuesToFix: 'PROBLEMAS A CORREGIR',
      warnings: 'ADVERTENCIAS',
      continueToDashboard: 'CONTINUAR AL DASHBOARD',
      regenerateAnyway: 'REGENERAR DE TODOS MODOS',
      aiFixIssues: 'IA CORREGIR PROBLEMAS',
      skipAnyway: 'SALTAR DE TODOS MODOS',
      // Analysis
      projectAnalysis: 'ANÁLISIS DEL PROYECTO',
      keyFiles: 'ARCHIVOS CLAVE',
      allFiles: 'TODOS LOS ARCHIVOS',
      requirementsDesc: 'Describe las características, funcionalidades o mejoras que quieres implementar. Claude analizará tu proyecto y generará un roadmap estructurado.',
      analyzeGenerate: 'ANALIZAR Y GENERAR ROADMAP',
      analyzingProject: 'ANALIZANDO PROYECTO...',
      // Review
      analysisSummary: 'RESUMEN DEL ANÁLISIS',
      suggestions: 'SUGERENCIAS',
      generatedRoadmap: 'ROADMAP GENERADO',
      featuresPreview: 'PREVIEW DE FEATURES',
      applyConfig: 'APLICAR CONFIGURACIÓN',
      // Done
      setupDone: 'CONFIGURACIÓN COMPLETA',
      setupDoneDesc: 'Tu roadmap.json y .clinerules han sido generados y guardados.',
      startOver: 'EMPEZAR DE NUEVO',
      viewDashboard: 'VER DASHBOARD'
    },
    // Modals
    modals: {
      addFeature: 'AÑADIR FEATURE',
      editFeature: 'EDITAR FEATURE',
      addTask: 'AÑADIR TAREA',
      deleteConfirm: '¿Estás seguro de que quieres eliminar esto?',
      unsavedWarning: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?'
    }
  }
};

// Language Context
const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Get nested translation value
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Translation hook
const useTranslation = () => {
  const { language } = useLanguage();

  const t = useCallback((key, params = {}) => {
    let value = getNestedValue(translations[language], key);
    if (value === undefined) {
      value = getNestedValue(translations.en, key); // Fallback to English
    }
    if (value === undefined) return key; // Return key if not found

    // Replace parameters like {count}
    if (typeof value === 'string') {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, val);
      });
    }
    return value;
  }, [language]);

  return { t, language };
};

// ============ DIFF UTILITY ============
function computeRoadmapDiff(currentRoadmap, versionSnapshot) {
  const diff = {
    features: { added: [], removed: [], modified: [] },
    tasks: { added: [], removed: [], statusChanged: [] },
    projectInfo: { changed: [] },
    summary: { added: 0, removed: 0, modified: 0 }
  };

  if (!currentRoadmap || !versionSnapshot) return diff;

  const currentFeatures = currentRoadmap.features || [];
  const versionFeatures = versionSnapshot.features || [];

  const currentFeaturesMap = new Map(currentFeatures.map(f => [f.id, f]));
  const versionFeaturesMap = new Map(versionFeatures.map(f => [f.id, f]));

  // Find added features (in current but not in version = added since version)
  currentFeatures.forEach(feature => {
    if (!versionFeaturesMap.has(feature.id)) {
      diff.features.added.push(feature);
      diff.summary.added++;
      // All tasks in this feature are also "added"
      (feature.tasks || []).forEach(task => {
        diff.tasks.added.push({ ...task, featureName: feature.name });
        diff.summary.added++;
      });
    }
  });

  // Find removed features (in version but not in current = removed since version)
  versionFeatures.forEach(feature => {
    if (!currentFeaturesMap.has(feature.id)) {
      diff.features.removed.push(feature);
      diff.summary.removed++;
      // All tasks in this feature are also "removed"
      (feature.tasks || []).forEach(task => {
        diff.tasks.removed.push({ ...task, featureName: feature.name });
        diff.summary.removed++;
      });
    }
  });

  // Find modified features (exist in both)
  currentFeatures.forEach(currentFeature => {
    const versionFeature = versionFeaturesMap.get(currentFeature.id);
    if (versionFeature) {
      const currentTasks = currentFeature.tasks || [];
      const versionTasks = versionFeature.tasks || [];
      const currentTasksMap = new Map(currentTasks.map(t => [t.id, t]));
      const versionTasksMap = new Map(versionTasks.map(t => [t.id, t]));

      let hasChanges = false;

      // Find added tasks
      currentTasks.forEach(task => {
        if (!versionTasksMap.has(task.id)) {
          diff.tasks.added.push({ ...task, featureName: currentFeature.name });
          diff.summary.added++;
          hasChanges = true;
        } else {
          // Check for status changes
          const versionTask = versionTasksMap.get(task.id);
          if (versionTask.status !== task.status) {
            diff.tasks.statusChanged.push({
              task,
              featureName: currentFeature.name,
              oldStatus: versionTask.status,
              newStatus: task.status
            });
            diff.summary.modified++;
            hasChanges = true;
          }
        }
      });

      // Find removed tasks
      versionTasks.forEach(task => {
        if (!currentTasksMap.has(task.id)) {
          diff.tasks.removed.push({ ...task, featureName: versionFeature.name });
          diff.summary.removed++;
          hasChanges = true;
        }
      });

      if (hasChanges || currentFeature.progress !== versionFeature.progress) {
        diff.features.modified.push({
          current: currentFeature,
          version: versionFeature
        });
      }
    }
  });

  // Check project info changes
  const currentInfo = currentRoadmap.project_info || {};
  const versionInfo = versionSnapshot.project_info || {};
  if (currentInfo.name !== versionInfo.name) {
    diff.projectInfo.changed.push({ field: 'name', old: versionInfo.name, new: currentInfo.name });
  }
  if (currentInfo.description !== versionInfo.description) {
    diff.projectInfo.changed.push({ field: 'description', old: versionInfo.description, new: currentInfo.description });
  }

  return diff;
}

function App() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('features');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddTask, setShowAddTask] = useState(null);
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // New features state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Language state - persist in localStorage
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('roadmap-kit-language') || 'es';
    }
    return 'es';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('roadmap-kit-language', lang);
  };

  // Translation helper
  const t = useCallback((key, params = {}) => {
    const getNestedValue = (obj, path) => path.split('.').reduce((c, k) => c?.[k], obj);
    let value = getNestedValue(translations[language], key);
    if (value === undefined) value = getNestedValue(translations.en, key);
    if (value === undefined) return key;
    if (typeof value === 'string') {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, val);
      });
    }
    return value;
  }, [language]);

  // Auth state
  const [authState, setAuthState] = useState({ checking: true, authenticated: false, authEnabled: false });
  const [loginError, setLoginError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]); // Users for task assignment

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'CONFIRM',
    cancelText: 'CANCEL',
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        title: options.title || 'Confirm',
        message: options.message || 'Are you sure?',
        type: options.type || 'warning',
        confirmText: options.confirmText || 'CONFIRM',
        cancelText: options.cancelText || 'CANCEL',
        onConfirm: () => {
          setConfirmModal(m => ({ ...m, show: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(m => ({ ...m, show: false }));
          resolve(false);
        }
      });
    });
  };

  const showAlert = (options) => {
    setConfirmModal({
      show: true,
      title: options.title || (options.type === 'success' ? 'Success' : options.type === 'error' ? 'Error' : 'Info'),
      message: options.message,
      type: options.type || 'info',
      confirmText: 'OK',
      cancelText: null,
      onConfirm: () => setConfirmModal(m => ({ ...m, show: false })),
      onCancel: null
    });
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load team members (auth users) when authenticated
  const loadTeamMembers = async () => {
    try {
      const res = await fetch('/api/team-members');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || []);
      }
    } catch (err) {
      console.error('Error loading team members:', err);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setAuthState({
        checking: false,
        authenticated: data.authenticated,
        authEnabled: data.authEnabled,
        user: data.user || null
      });
      if (data.authenticated || !data.authEnabled) {
        loadRoadmap();
        loadTeamMembers();
      }
    } catch (err) {
      setAuthState({ checking: false, authenticated: true, authEnabled: false, user: null });
      loadRoadmap();
      loadTeamMembers();
    }
  };

  const handleLogin = async (email, password) => {
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        setAuthState({
          checking: false,
          authenticated: true,
          authEnabled: true,
          user: data.user
        });
        loadRoadmap();
      } else {
        setLoginError(data.error || 'Error de autenticacion');
      }
    } catch (err) {
      setLoginError('Error de conexion');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthState({ checking: false, authenticated: false, authEnabled: true, user: null });
      setRoadmap(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/roadmap.json');
      if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        if (data.requiresAuth) {
          setAuthState({ checking: false, authenticated: false, authEnabled: true });
          setLoading(false);
          return;
        }
      }
      if (!response.ok) throw new Error('No se pudo cargar roadmap.json');
      const data = await response.json();
      setRoadmap(data);
      setHasChanges(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [saveMessage, setSaveMessage] = useState(null);

  // Dynamic favicon and title based on theme
  useEffect(() => {
    if (!roadmap?.project_info) return;

    const themeColor = roadmap.project_info.theme?.color || '#00ff88';
    const projectName = roadmap.project_info.name || 'Roadmap';

    // Update document title
    document.title = `${projectName} | Roadmap`;

    // Generate dynamic favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Draw rounded square with theme color
    ctx.fillStyle = themeColor;
    ctx.beginPath();
    ctx.roundRect(2, 2, 28, 28, 6);
    ctx.fill();

    // Add a subtle inner glow/border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, 24, 24, 4);
    ctx.stroke();

    // Convert to favicon
    const faviconUrl = canvas.toDataURL('image/png');
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = faviconUrl;

  }, [roadmap?.project_info?.theme?.color, roadmap?.project_info?.name]);

  const saveRoadmap = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const response = await fetch('/api/save-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roadmap)
      });
      if (response.status === 401) {
        const data = await response.json();
        if (data.requiresAuth) {
          setAuthState({ checking: false, authenticated: false, authEnabled: true });
          return;
        }
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al guardar');
      }
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'SYNC OK' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: `ERR: ${err.message}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = useCallback((featureId, taskId, newStatus) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const feature = updated.features.find(f => f.id === featureId);
      if (feature) {
        const task = feature.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = newStatus;
          if (newStatus === 'completed' && !task.completed_at) {
            task.completed_at = new Date().toISOString();
            // Record who completed it (assigned person or 'Unknown')
            if (task.assigned_name) {
              task.completed_by = task.assigned_name;
            } else if (task.assigned_to) {
              const member = (updated.project_info.team || []).find(m => m.id === task.assigned_to);
              task.completed_by = member?.name || 'Unknown';
            }
          }
          if (newStatus === 'in_progress' && !task.started_at) {
            task.started_at = new Date().toISOString();
          }
          // Clear completed_by if task is moved back
          if (newStatus !== 'completed') {
            task.completed_by = null;
            task.completed_at = null;
          }
          const completed = feature.tasks.filter(t => t.status === 'completed').length;
          feature.progress = Math.round((completed / feature.tasks.length) * 100);
        }
      }
      const allTasks = updated.features.flatMap(f => f.tasks);
      const totalCompleted = allTasks.filter(t => t.status === 'completed').length;
      updated.project_info.total_progress = Math.round((totalCompleted / allTasks.length) * 100);
      return updated;
    });
    setHasChanges(true);
  }, []);

  const addTask = useCallback((featureId, newTask) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const feature = updated.features.find(f => f.id === featureId);
      if (feature) {
        feature.tasks.push({
          id: `${featureId}-${Date.now()}`,
          name: newTask.name,
          description: newTask.description || '',
          status: 'pending',
          priority: newTask.priority || 'medium',
          ai_notes: '',
          affected_files: [],
          reused_resources: [],
          git: { branch: null, pr_number: null, pr_url: null, last_commit: null, commits: [] },
          metrics: { lines_added: 0, lines_removed: 0, files_created: 0, files_modified: 0, complexity_score: 0 },
          technical_debt: [],
          started_at: null,
          completed_at: null
        });
        const completed = feature.tasks.filter(t => t.status === 'completed').length;
        feature.progress = Math.round((completed / feature.tasks.length) * 100);
      }
      return updated;
    });
    setHasChanges(true);
    setShowAddTask(null);
  }, []);

  const addFeature = useCallback((newFeature) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.features.push({
        id: newFeature.id || `feature-${Date.now()}`,
        name: newFeature.name,
        description: newFeature.description || '',
        status: 'pending',
        progress: 0,
        priority: newFeature.priority || 'medium',
        tasks: []
      });
      return updated;
    });
    setHasChanges(true);
    setShowAddFeature(false);
  }, []);

  const getFilteredFeatures = () => {
    if (!roadmap?.features) return [];
    return roadmap.features.map(feature => {
      const filteredTasks = feature.tasks.filter(task => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return task.name.toLowerCase().includes(search) ||
                 task.description?.toLowerCase().includes(search) ||
                 task.id.toLowerCase().includes(search);
        }
        return true;
      });
      return { ...feature, tasks: filteredTasks };
    }).filter(feature => feature.tasks.length > 0 || !searchTerm);
  };

  const getStats = () => {
    if (!roadmap?.features) return { total: 0, completed: 0, inProgress: 0, pending: 0, debts: 0 };
    let total = 0, completed = 0, inProgress = 0, pending = 0, debts = 0;
    roadmap.features.forEach(feature => {
      feature.tasks.forEach(task => {
        total++;
        if (task.status === 'completed') completed++;
        else if (task.status === 'in_progress') inProgress++;
        else pending++;
        if (task.technical_debt) debts += task.technical_debt.length;
      });
    });
    return { total, completed, inProgress, pending, debts };
  };

  const navItems = [
    { id: 'setup', label: t('nav.setup'), icon: Sparkles, key: '1' },
    { id: 'features', label: t('nav.features'), icon: Zap, key: '2' },
    { id: 'metrics', label: language === 'es' ? 'MÉTRICAS' : 'METRICS', icon: BarChart3, key: '3' },
    { id: 'resources', label: t('nav.resources'), icon: Package, key: '4' },
    { id: 'debt', label: t('nav.debt'), icon: AlertTriangle, key: '5' },
    { id: 'info', label: t('nav.info'), icon: Info, key: '6' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, key: '7' },
    { id: 'help', label: t('nav.help'), icon: HelpCircle, key: '8' },
  ];

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setShowGlobalSearch(true),
    onSave: () => hasChanges && saveRoadmap(),
    onTabChange: (index) => {
      if (navItems[index]) setActiveTab(navItems[index].id);
    },
    onEscape: () => {
      setShowGlobalSearch(false);
      setShowKeyboardHelp(false);
      setShowActivityLog(false);
      setConfirmModal(m => ({ ...m, show: false }));
    },
    onHelp: () => setShowKeyboardHelp(true)
  });

  if (authState.authEnabled && !authState.authenticated && !authState.checking) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (authState.checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-2 border-matrix/30 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-matrix animate-pulse" />
            </div>
            <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-matrix" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-matrix" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-matrix" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-matrix" />
          </div>
          <p className="font-mono text-matrix text-sm tracking-widest">
            {authState.checking ? '> VERIFYING ACCESS...' : '> LOADING ROADMAP...'}
            <span className="animate-blink">_</span>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="terminal-card p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="led led-red" />
            <span className="font-mono text-alert text-sm tracking-wider">ERROR</span>
          </div>
          <p className="font-mono text-gray-400 text-sm mb-6">{error}</p>
          <button onClick={loadRoadmap} className="btn-terminal w-full">
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const filteredFeatures = getFilteredFeatures();
  const projectInfo = roadmap?.project_info || {};

  return (
    <div className="min-h-screen bg-black text-gray-100 flex">
      {/* Scanlines overlay - disabled for debugging */}
      {/* <div className="scanlines" /> */}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full sidebar-terminal z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-matrix/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-matrix/50 flex items-center justify-center glow-matrix">
                <Terminal className="w-5 h-5 text-matrix" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-display text-matrix text-lg tracking-wider crt-glow">ROADMAP</h1>
                  <p className="font-mono text-[10px] text-gray-600 tracking-widest">{projectInfo.name || 'PROJECT'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-matrix/10">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-gray-500 tracking-widest">{language === 'es' ? 'PROGRESO' : 'PROGRESS'}</span>
                  <span className="font-display text-2xl text-matrix">{projectInfo.total_progress || 0}%</span>
                </div>
                <div className="progress-brutal">
                  <div className="progress-brutal-fill" style={{ width: `${projectInfo.total_progress || 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-display text-lg text-matrix">{stats.completed}</div>
                  <div className="font-mono text-[9px] text-gray-600 tracking-wider">{t('stats.completed')}</div>
                </div>
                <div>
                  <div className="font-display text-lg text-signal">{stats.inProgress}</div>
                  <div className="font-mono text-[9px] text-gray-600 tracking-wider">{t('stats.inProgress')}</div>
                </div>
                <div>
                  <div className="font-display text-lg text-gray-500">{stats.pending}</div>
                  <div className="font-mono text-[9px] text-gray-600 tracking-wider">{t('stats.pending')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-terminal w-full flex items-center gap-3 px-4 py-3 transition-all ${
                    isActive ? 'active' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                  } ${sidebarCollapsed ? 'justify-center px-2' : 'pl-8'}`}
                >
                  <Icon className="w-4 h-4" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left text-xs">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-matrix/10 space-y-2">
            {saveMessage && !sidebarCollapsed && (
              <div className={`px-3 py-2 text-xs font-mono text-center border ${
                saveMessage.type === 'success' ? 'border-matrix/30 text-matrix bg-matrix/5' : 'border-alert/30 text-alert bg-alert/5'
              }`}>
                {saveMessage.text}
              </div>
            )}
            {hasChanges && !sidebarCollapsed && (
              <button onClick={saveRoadmap} disabled={saving} className="btn-terminal w-full flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('common.save')}
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-400 transition-all font-mono text-xs"
            >
              <Menu className="w-4 h-4" />
              {!sidebarCollapsed && t('sidebar.collapse')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-white/5">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-xl text-white tracking-wide">{projectInfo.name || 'UNNAMED'}</h1>
                  <span className="font-mono text-[10px] px-2 py-1 border border-matrix/30 text-matrix">
                    v{projectInfo.version || '0.0.0'}
                  </span>
                </div>
                <p className="font-mono text-xs text-gray-600 mt-1 max-w-xl truncate">
                  {projectInfo.description || 'No description'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Theme Color Indicator */}
                <div
                  className="w-8 h-8 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-110 ring-2 ring-white/10 hover:ring-white/30"
                  style={{
                    backgroundColor: projectInfo.theme?.color || '#00ff88',
                    boxShadow: `0 0 20px ${projectInfo.theme?.color || '#00ff88'}40`
                  }}
                  title={`Theme: ${projectInfo.theme?.name || 'Matrix Green'}\nClick to change`}
                  onClick={() => setShowThemeModal(true)}
                />
                <button onClick={loadRoadmap} className="p-2 border border-white/10 text-gray-500 hover:text-matrix hover:border-matrix/30 transition-all">
                  <RefreshCw className="w-4 h-4" />
                </button>
                {authState.authEnabled && (
                  <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 border border-white/10 text-gray-500 hover:text-alert hover:border-alert/30 transition-all font-mono text-xs">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('auth.logout')}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-matrix">{'>'}</span>
              <h2 className="font-mono text-sm text-gray-400">
                {navItems.find(n => n.id === activeTab)?.label}
              </h2>
              <span className="font-mono text-xs text-gray-700">
                {activeTab === 'features' && `// ${stats.total} tasks in ${roadmap?.features?.length || 0} features`}
                {activeTab === 'resources' && '// shared components & utilities'}
                {activeTab === 'debt' && `// ${stats.debts} items registered`}
                {activeTab === 'info' && '// stack & conventions'}
                {activeTab === 'settings' && '// deploy configuration'}
                {activeTab === 'help' && '// documentation'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 pb-24 grid-bg min-h-[calc(100vh-120px)]">
          {activeTab === 'features' && (
            <FeaturesTab
              features={filteredFeatures}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onUpdateTaskStatus={updateTaskStatus}
              onAddTask={addTask}
              showAddTask={showAddTask}
              setShowAddTask={setShowAddTask}
              setShowAddFeature={setShowAddFeature}
              setShowAIGenerator={setShowAIGenerator}
              team={teamMembers}
              t={t}
              language={language}
              onAssignTask={(featureId, taskId, memberId, memberName) => {
                setRoadmap(prev => {
                  const updated = JSON.parse(JSON.stringify(prev));
                  const feature = updated.features.find(f => f.id === featureId);
                  if (feature) {
                    const task = feature.tasks.find(t => t.id === taskId);
                    if (task) {
                      task.assigned_to = memberId;
                      task.assigned_name = memberName;
                    }
                  }
                  return updated;
                });
                setHasChanges(true);
              }}
            />
          )}
          {activeTab === 'metrics' && <MetricsTab roadmap={roadmap} language={language} />}
          {activeTab === 'resources' && <ResourcesTab resources={projectInfo.shared_resources || {}} />}
          {activeTab === 'debt' && <DebtTab roadmap={roadmap} setRoadmap={setRoadmap} setHasChanges={setHasChanges} />}
          {activeTab === 'info' && <InfoTab projectInfo={projectInfo} />}
          {activeTab === 'settings' && <SettingsTab roadmap={roadmap} setRoadmap={setRoadmap} setHasChanges={setHasChanges} authState={authState} showConfirm={showConfirm} showAlert={showAlert} t={t} language={language} changeLanguage={changeLanguage} />}
          {activeTab === 'help' && <HelpTab t={t} language={language} />}
          {activeTab === 'setup' && <SetupTab roadmap={roadmap} setRoadmap={setRoadmap} setHasChanges={setHasChanges} loadRoadmap={loadRoadmap} t={t} language={language} />}
        </div>
      </main>

      {/* Theme Modal */}
      {showThemeModal && (
        <ThemeModal
          roadmap={roadmap}
          setRoadmap={setRoadmap}
          setHasChanges={setHasChanges}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Add Feature Modal */}
      {showAddFeature && (
        <Modal onClose={() => setShowAddFeature(false)}>
          <AddFeatureForm onAdd={addFeature} onClose={() => setShowAddFeature(false)} team={teamMembers} t={t} language={language} />
        </Modal>
      )}

      {showAIGenerator && (
        <Modal onClose={() => setShowAIGenerator(false)}>
          <AIGeneratorModal
            roadmap={roadmap}
            setRoadmap={setRoadmap}
            setHasChanges={setHasChanges}
            onClose={() => setShowAIGenerator(false)}
          />
        </Modal>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-void-200 border border-white/10 w-full max-w-md mx-4 animate-slide-up">
            {/* Header */}
            <div className={`p-4 border-b flex items-center gap-3 ${
              confirmModal.type === 'success' ? 'border-matrix/30 bg-matrix/5' :
              confirmModal.type === 'error' ? 'border-alert/30 bg-alert/5' :
              confirmModal.type === 'warning' ? 'border-signal/30 bg-signal/5' :
              'border-cyber/30 bg-cyber/5'
            }`}>
              <div className={`w-10 h-10 border flex items-center justify-center ${
                confirmModal.type === 'success' ? 'border-matrix/50 bg-matrix/10' :
                confirmModal.type === 'error' ? 'border-alert/50 bg-alert/10' :
                confirmModal.type === 'warning' ? 'border-signal/50 bg-signal/10' :
                'border-cyber/50 bg-cyber/10'
              }`}>
                {confirmModal.type === 'success' && <CheckCircle2 className="w-5 h-5 text-matrix" />}
                {confirmModal.type === 'error' && <X className="w-5 h-5 text-alert" />}
                {confirmModal.type === 'warning' && <AlertTriangle className="w-5 h-5 text-signal" />}
                {confirmModal.type === 'info' && <Info className="w-5 h-5 text-cyber" />}
              </div>
              <h3 className={`font-mono text-sm tracking-wider ${
                confirmModal.type === 'success' ? 'text-matrix' :
                confirmModal.type === 'error' ? 'text-alert' :
                confirmModal.type === 'warning' ? 'text-signal' :
                'text-cyber'
              }`}>
                {confirmModal.title}
              </h3>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="font-mono text-sm text-gray-300 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/5 flex gap-3 justify-end">
              {confirmModal.cancelText && confirmModal.onCancel && (
                <button
                  onClick={confirmModal.onCancel}
                  className="px-5 py-2.5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all font-mono text-xs tracking-wider"
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 border font-mono text-xs tracking-wider transition-all ${
                  confirmModal.type === 'success' ? 'border-matrix/50 bg-matrix/10 text-matrix hover:bg-matrix/20' :
                  confirmModal.type === 'error' ? 'border-alert/50 bg-alert/10 text-alert hover:bg-alert/20' :
                  confirmModal.type === 'warning' ? 'border-signal/50 bg-signal/10 text-signal hover:bg-signal/20' :
                  'border-cyber/50 bg-cyber/10 text-cyber hover:bg-cyber/20'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        roadmap={roadmap}
        onNavigate={setActiveTab}
        t={t}
      />

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150]" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-void-200 border border-white/10 w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-cyber" />
                <h3 className="font-mono text-sm text-white">{language === 'es' ? 'ATAJOS DE TECLADO' : 'KEYBOARD SHORTCUTS'}</h3>
              </div>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { keys: ['Ctrl', 'K'], desc: language === 'es' ? 'Búsqueda global' : 'Global search' },
                { keys: ['Ctrl', 'S'], desc: language === 'es' ? 'Guardar cambios' : 'Save changes' },
                { keys: ['1-7'], desc: language === 'es' ? 'Cambiar pestaña' : 'Switch tab' },
                { keys: ['?'], desc: language === 'es' ? 'Mostrar atajos' : 'Show shortcuts' },
                { keys: ['Esc'], desc: language === 'es' ? 'Cerrar modal' : 'Close modal' },
              ].map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="font-mono text-sm text-gray-400">{shortcut.desc}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className="px-2 py-1 bg-void-100 border border-white/10 text-gray-300 font-mono text-xs">{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="text-gray-600">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Sidebar */}
      {showActivityLog && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShowActivityLog(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-void-200 border-l border-white/10 animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-signal" />
                <h3 className="font-mono text-sm text-white">{language === 'es' ? 'ACTIVIDAD RECIENTE' : 'RECENT ACTIVITY'}</h3>
              </div>
              <button onClick={() => setShowActivityLog(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              <p className="font-mono text-xs text-gray-600 text-center py-8">
                {language === 'es' ? 'El registro de actividad se mostrará aquí' : 'Activity log will appear here'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Bar - Bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-2 px-4 py-2 bg-void-200/90 backdrop-blur-sm border border-white/10">
        <button
          onClick={() => setShowGlobalSearch(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-white transition-all font-mono text-xs"
        >
          <Search className="w-3 h-3" />
          <span>{language === 'es' ? 'Buscar' : 'Search'}</span>
          <kbd className="px-1.5 py-0.5 bg-void-100 border border-white/10 text-[9px] text-gray-600">⌘K</kbd>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={() => {
            setActiveTab('features');
            setViewMode('kanban');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 transition-all font-mono text-xs ${
            viewMode === 'kanban' && activeTab === 'features' ? 'text-matrix' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Columns className="w-3 h-3" />
          <span>Kanban</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('features');
            setViewMode('list');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 transition-all font-mono text-xs ${
            viewMode === 'list' && activeTab === 'features' ? 'text-matrix' : 'text-gray-500 hover:text-white'
          }`}
        >
          <List className="w-3 h-3" />
          <span>{language === 'es' ? 'Lista' : 'List'}</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={() => setShowKeyboardHelp(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-white transition-all font-mono text-xs"
        >
          <Keyboard className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ============ AI GENERATOR MODAL ============
function AIGeneratorModal({ roadmap, setRoadmap, setHasChanges, onClose }) {
  const [requirements, setRequirements] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [claudeStatus, setClaudeStatus] = useState({ checking: true, available: false });
  const [step, setStep] = useState('input'); // input, analyzing, result

  // Check Claude Code availability on mount
  useEffect(() => {
    fetch('/api/claude-code-status')
      .then(res => res.json())
      .then(data => setClaudeStatus({ checking: false, available: data.available, version: data.version }))
      .catch(() => setClaudeStatus({ checking: false, available: false }));
  }, []);

  const analyzeWithAI = async () => {
    if (!requirements.trim()) {
      setError('Escribe los requisitos o funcionalidades que deseas implementar');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setStep('analyzing');

    try {
      // First scan the project
      const scanRes = await fetch('/api/scan-project');
      const projectScan = await scanRes.json();

      // Then analyze with AI
      const res = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements,
          projectScan,
          existingRoadmap: roadmap,
          useClaudeCode: claudeStatus.available
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error analyzing project');
      }

      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err.message);
      setStep('input');
    } finally {
      setAnalyzing(false);
    }
  };

  const mergeResults = () => {
    if (!result?.analysis?.features) {
      setError('No hay features para añadir');
      return;
    }

    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const newFeatures = result.analysis.features;

      newFeatures.forEach(newFeature => {
        // Check if feature already exists
        const existingIndex = updated.features.findIndex(f =>
          f.id === newFeature.id || f.name.toLowerCase() === newFeature.name.toLowerCase()
        );

        if (existingIndex >= 0) {
          // Merge tasks into existing feature
          const existing = updated.features[existingIndex];
          const newTasks = newFeature.tasks || [];
          newTasks.forEach(newTask => {
            const taskExists = existing.tasks?.some(t =>
              t.id === newTask.id || t.name.toLowerCase() === newTask.name.toLowerCase()
            );
            if (!taskExists) {
              if (!existing.tasks) existing.tasks = [];
              existing.tasks.push({
                ...newTask,
                id: newTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: newTask.status || 'pending',
                ai_generated: true,
                created_at: new Date().toISOString()
              });
            }
          });
          // Recalculate progress
          const completedTasks = existing.tasks.filter(t => t.status === 'completed').length;
          existing.progress = existing.tasks.length > 0
            ? Math.round((completedTasks / existing.tasks.length) * 100)
            : 0;
        } else {
          // Add new feature
          updated.features.push({
            ...newFeature,
            id: newFeature.id || `feature-${Date.now()}`,
            status: newFeature.status || 'pending',
            progress: 0,
            ai_generated: true,
            created_at: new Date().toISOString(),
            tasks: (newFeature.tasks || []).map(t => ({
              ...t,
              id: t.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              status: t.status || 'pending'
            }))
          });
        }
      });

      // Update shared resources if provided
      if (result.analysis.shared_resources) {
        if (!updated.project_info.shared_resources) {
          updated.project_info.shared_resources = { ui_components: [], utilities: [], database_tables: [] };
        }
        const sr = result.analysis.shared_resources;
        if (sr.ui_components) {
          sr.ui_components.forEach(comp => {
            if (!updated.project_info.shared_resources.ui_components.some(c => c.path === comp.path)) {
              updated.project_info.shared_resources.ui_components.push(comp);
            }
          });
        }
        if (sr.utilities) {
          sr.utilities.forEach(util => {
            if (!updated.project_info.shared_resources.utilities.some(u => u.path === util.path)) {
              updated.project_info.shared_resources.utilities.push(util);
            }
          });
        }
        if (sr.database_tables) {
          sr.database_tables.forEach(table => {
            if (!updated.project_info.shared_resources.database_tables.some(t => t.name === table.name)) {
              updated.project_info.shared_resources.database_tables.push(table);
            }
          });
        }
      }

      // Recalculate total progress
      const totalTasks = updated.features.reduce((sum, f) => sum + (f.tasks?.length || 0), 0);
      const completedTasks = updated.features.reduce((sum, f) =>
        sum + (f.tasks?.filter(t => t.status === 'completed').length || 0), 0
      );
      updated.project_info.total_progress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      return updated;
    });

    setHasChanges(true);
    onClose();
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border border-cyber/30 bg-cyber/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-cyber" />
        </div>
        <div>
          <h2 className="font-display text-xl text-white tracking-wide">AI FEATURE GENERATOR</h2>
          <p className="font-mono text-[11px] text-gray-500">
            Describe lo que necesitas y Claude generará features estructuradas
          </p>
        </div>
      </div>

      {/* Claude Status */}
      <div className={`mb-4 p-3 border font-mono text-[11px] flex items-center gap-2 ${
        claudeStatus.checking ? 'border-gray-700 text-gray-500' :
        claudeStatus.available ? 'border-matrix/30 text-matrix bg-matrix/5' :
        'border-alert/30 text-alert bg-alert/5'
      }`}>
        {claudeStatus.checking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verificando Claude Code CLI...
          </>
        ) : claudeStatus.available ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Claude Code CLI disponible {claudeStatus.version && `(${claudeStatus.version})`}
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            Claude Code CLI no disponible - Se requiere API key
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 border border-alert/30 bg-alert/5 font-mono text-xs text-alert flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Step: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-2">
              DESCRIBE TUS REQUISITOS Y FUNCIONALIDADES
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder={`Ejemplo:
- Sistema de autenticación con login/registro
- Dashboard con estadísticas de usuarios
- CRUD de productos con imágenes
- Notificaciones por email
- Integración con Stripe para pagos
- API REST documentada con Swagger`}
              className="w-full h-64 input-terminal p-4 text-sm resize-none"
              spellCheck={false}
            />
            <p className="mt-2 font-mono text-[10px] text-gray-600">
              Escribe todo lo que necesitas. Claude analizará el proyecto actual y generará features estructuradas.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={analyzeWithAI}
              disabled={analyzing || !requirements.trim() || (!claudeStatus.available && !claudeStatus.checking)}
              className="btn-terminal flex-1 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              GENERAR CON IA
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all font-mono text-xs"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-cyber" />
          <h3 className="font-mono text-sm text-white mb-2">ANALIZANDO CON CLAUDE...</h3>
          <p className="font-mono text-[11px] text-gray-500">
            Escaneando proyecto y generando features estructuradas
          </p>
          <div className="mt-6 space-y-2 max-w-md mx-auto">
            <div className="flex items-center gap-2 font-mono text-[10px] text-gray-600">
              <CheckCircle2 className="w-3 h-3 text-matrix" /> Escaneando archivos del proyecto...
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-gray-600">
              <Loader2 className="w-3 h-3 animate-spin text-cyber" /> Analizando requisitos con Claude...
            </div>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="p-4 border border-matrix/30 bg-matrix/5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-matrix" />
              <span className="font-mono text-sm text-matrix">ANÁLISIS COMPLETADO</span>
            </div>

            {result.analysis?.features && (
              <div className="space-y-3">
                <p className="font-mono text-[11px] text-gray-400">
                  Se generaron {result.analysis.features.length} features:
                </p>
                {result.analysis.features.map((feature, idx) => (
                  <div key={idx} className="p-3 bg-void-100 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${
                        feature.priority === 'high' ? 'bg-alert' :
                        feature.priority === 'medium' ? 'bg-signal' : 'bg-cyber'
                      }`} />
                      <span className="font-sans text-sm text-white">{feature.name}</span>
                      <span className="font-mono text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5">
                        {feature.tasks?.length || 0} tasks
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-gray-500 line-clamp-2">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw JSON Preview */}
          <details className="group">
            <summary className="font-mono text-[10px] text-gray-600 cursor-pointer hover:text-gray-400">
              Ver JSON completo
            </summary>
            <div className="mt-2 p-3 bg-void-100 border border-white/5 max-h-48 overflow-auto">
              <pre className="font-mono text-[10px] text-gray-500 whitespace-pre-wrap">
                {JSON.stringify(result.analysis, null, 2)}
              </pre>
            </div>
          </details>

          <div className="flex gap-3">
            <button
              onClick={mergeResults}
              className="btn-terminal flex-1 py-3 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              AÑADIR AL ROADMAP
            </button>
            <button
              onClick={() => { setStep('input'); setResult(null); }}
              className="px-6 py-3 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all font-mono text-xs"
            >
              REGENERAR
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all font-mono text-xs"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ KANBAN BOARD WITH DRAG & DROP ============
function KanbanBoard({ kanbanColumns, filteredTasks, onUpdateTaskStatus, language }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    // Add visual feedback to dragged element
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== columnId) {
      onUpdateTaskStatus(draggedTask.featureId, draggedTask.id, columnId);
    }
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-3 gap-4 min-h-[500px]">
      {kanbanColumns.map(column => {
        const columnTasks = filteredTasks.filter(t => t.status === column.id);
        const isOver = dragOverColumn === column.id && draggedTask?.status !== column.id;

        return (
          <div
            key={column.id}
            className={`bg-void-100 border transition-all duration-200 ${
              isOver
                ? `border-${column.color} shadow-${column.color}`
                : 'border-white/5'
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`p-3 border-b border-${column.color}/20 bg-${column.color}/5`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs text-${column.color} tracking-wider`}>{column.label}</span>
                <span className="font-display text-lg text-gray-500">{columnTasks.length}</span>
              </div>
            </div>
            <div className={`p-2 space-y-2 max-h-[500px] overflow-y-auto min-h-[100px] transition-all ${
              isOver ? `bg-${column.color}/5` : ''
            }`}>
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 bg-void-200 border border-white/5 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing select-none ${
                    draggedTask?.id === task.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="font-mono text-xs text-white mb-1">{task.name}</div>
                  <div className="font-mono text-[10px] text-gray-600 mb-2">{task.featureName}</div>
                  <div className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono ${
                      task.priority === 'high' ? 'bg-alert/20 text-alert' :
                      task.priority === 'medium' ? 'bg-signal/20 text-signal' :
                      'bg-cyber/20 text-cyber'
                    }`}>{task.priority?.toUpperCase()}</span>
                    {task.assigned_name && (
                      <span className="font-mono text-[9px] text-gray-500">{task.assigned_name}</span>
                    )}
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className={`py-8 text-center border-2 border-dashed transition-all ${
                  isOver ? `border-${column.color}/50` : 'border-transparent'
                }`}>
                  <p className="font-mono text-[10px] text-gray-700">
                    {isOver
                      ? (language === 'es' ? 'Soltar aquí' : 'Drop here')
                      : (language === 'es' ? 'Sin tareas' : 'No tasks')
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ FEATURES TAB ============
function FeaturesTab({
  features, searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  priorityFilter, setPriorityFilter, assigneeFilter, setAssigneeFilter,
  viewMode, setViewMode, onUpdateTaskStatus, onAddTask, showAddTask,
  setShowAddTask, setShowAddFeature, setShowAIGenerator, team, onAssignTask, t, language
}) {
  const [showFilters, setShowFilters] = useState(false);

  // Get all tasks for Kanban view
  const allTasks = useMemo(() => {
    const tasks = [];
    features.forEach(feature => {
      (feature.tasks || []).forEach(task => {
        tasks.push({ ...task, featureId: feature.id, featureName: feature.name });
      });
    });
    return tasks;
  }, [features]);

  // Filter tasks for Kanban
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all' && task.assigned_to !== assigneeFilter) return false;
      return true;
    });
  }, [allTasks, priorityFilter, assigneeFilter]);

  const kanbanColumns = [
    { id: 'pending', label: language === 'es' ? 'PENDIENTE' : 'PENDING', color: 'gray' },
    { id: 'in_progress', label: language === 'es' ? 'EN PROGRESO' : 'IN PROGRESS', color: 'signal' },
    { id: 'completed', label: language === 'es' ? 'COMPLETADO' : 'COMPLETED', color: 'matrix' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t ? t('common.search') : "search tasks..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-terminal w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-terminal px-4 py-2.5 text-sm cursor-pointer"
        >
          <option value="all">{language === 'es' ? 'TODOS' : 'ALL STATUS'}</option>
          <option value="pending">{language === 'es' ? 'PENDIENTE' : 'PENDING'}</option>
          <option value="in_progress">{language === 'es' ? 'EN PROGRESO' : 'IN PROGRESS'}</option>
          <option value="completed">{language === 'es' ? 'COMPLETADO' : 'COMPLETED'}</option>
        </select>

        {/* View Mode Toggle */}
        <div className="flex border border-white/10">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-2 transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            title="Kanban view"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-terminal flex items-center gap-2 ${showFilters ? 'border-cyber/50 text-cyber' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {language === 'es' ? 'FILTROS' : 'FILTERS'}
        </button>

        <button onClick={() => setShowAddFeature(true)} className="btn-terminal flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {language === 'es' ? 'NUEVA FEATURE' : 'NEW FEATURE'}
        </button>
        <button onClick={() => setShowAIGenerator(true)} className="btn-terminal flex items-center gap-2 bg-gradient-to-r from-cyber/20 to-matrix/20 border-cyber/50 hover:border-cyber">
          <Sparkles className="w-4 h-4 text-cyber" />
          AI
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="flex gap-3 p-4 bg-void-100 border border-white/5 animate-fade-in">
          <div>
            <label className="font-mono text-[10px] text-gray-500 block mb-1">{language === 'es' ? 'PRIORIDAD' : 'PRIORITY'}</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-terminal px-3 py-1.5 text-xs cursor-pointer"
            >
              <option value="all">{language === 'es' ? 'TODAS' : 'ALL'}</option>
              <option value="high">{language === 'es' ? 'ALTA' : 'HIGH'}</option>
              <option value="medium">{language === 'es' ? 'MEDIA' : 'MEDIUM'}</option>
              <option value="low">{language === 'es' ? 'BAJA' : 'LOW'}</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] text-gray-500 block mb-1">{language === 'es' ? 'ASIGNADO A' : 'ASSIGNEE'}</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="input-terminal px-3 py-1.5 text-xs cursor-pointer"
            >
              <option value="all">{language === 'es' ? 'TODOS' : 'ALL'}</option>
              <option value="">{language === 'es' ? 'SIN ASIGNAR' : 'UNASSIGNED'}</option>
              {team.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setPriorityFilter('all'); setAssigneeFilter('all'); }}
            className="self-end px-3 py-1.5 text-xs text-gray-500 hover:text-white transition-all"
          >
            {language === 'es' ? 'LIMPIAR' : 'CLEAR'}
          </button>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4 stagger">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onUpdateTaskStatus={onUpdateTaskStatus}
              onAddTask={onAddTask}
              showAddTask={showAddTask}
              setShowAddTask={setShowAddTask}
              team={team}
              onAssignTask={onAssignTask}
              language={language}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Kanban View with Drag & Drop */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          kanbanColumns={kanbanColumns}
          filteredTasks={filteredTasks}
          onUpdateTaskStatus={onUpdateTaskStatus}
          language={language}
        />
      )}

      {features.length === 0 && viewMode === 'list' && (
        <div className="terminal-card p-12 text-center">
          <Search className="w-10 h-10 mx-auto mb-4 text-gray-700" />
          <p className="font-mono text-gray-600 text-sm">{language === 'es' ? 'NO HAY TAREAS' : 'NO TASKS FOUND'}</p>
        </div>
      )}
    </div>
  );
}

// ============ FEATURE CARD ============
function FeatureCard({ feature, onUpdateTaskStatus, onAddTask, showAddTask, setShowAddTask, team, onAssignTask, language, t }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const priorityConfig = {
    high: { color: 'text-alert', border: 'border-alert/30', bg: 'bg-alert/5' },
    medium: { color: 'text-signal', border: 'border-signal/30', bg: 'bg-signal/5' },
    low: { color: 'text-cyber', border: 'border-cyber/30', bg: 'bg-cyber/5' },
  };
  const priority = priorityConfig[feature.priority] || priorityConfig.medium;

  return (
    <div className="feature-card">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.01] transition-colors"
      >
        {/* Progress Ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${feature.progress || 0}, 100`}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-sm text-matrix">{feature.progress || 0}%</span>
          </div>
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-sans font-semibold text-white">{feature.name}</h3>
            <span className={`status-badge ${priority.color} ${priority.border} ${priority.bg}`}>
              {feature.priority || 'medium'}
            </span>
          </div>
          <p className="font-mono text-xs text-gray-600 line-clamp-1">{feature.description}</p>
        </div>

        <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="py-4">
            <div className="flex justify-between font-mono text-[10px] text-gray-600 mb-2">
              <span>{feature.tasks.filter(t => t.status === 'completed').length} / {feature.tasks.length} TASKS</span>
              <span>{feature.progress}%</span>
            </div>
            <div className="progress-brutal">
              <div className="progress-brutal-fill" style={{ width: `${feature.progress}%` }} />
            </div>
          </div>

          {/* Tasks */}
          <TaskList tasks={feature.tasks} featureId={feature.id} onUpdateStatus={onUpdateTaskStatus} team={team} onAssignTask={onAssignTask} />

          {/* Add Task */}
          {showAddTask === feature.id ? (
            <AddTaskForm onAdd={(task) => onAddTask(feature.id, task)} onCancel={() => setShowAddTask(null)} team={team} t={t} language={language} />
          ) : (
            <button
              onClick={() => setShowAddTask(feature.id)}
              className="mt-4 w-full py-3 border border-dashed border-matrix/30 text-matrix font-mono text-xs tracking-wider hover:bg-matrix/5 hover:border-matrix/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t ? t('features.addTask') : 'ADD TASK'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============ TASK LIST ============
function TaskList({ tasks = [], featureId = '', onUpdateStatus, team = [], onAssignTask }) {
  const [expandedTask, setExpandedTask] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const statusConfig = {
    completed: { led: 'led-green', label: 'DONE', color: 'text-matrix' },
    in_progress: { led: 'led-amber', label: 'ACTIVE', color: 'text-signal' },
    pending: { led: 'led-gray', label: 'QUEUE', color: 'text-gray-500' }
  };

  const priorityConfig = {
    high: { label: 'HIGH', color: 'text-alert' },
    medium: { label: 'MED', color: 'text-signal' },
    low: { label: 'LOW', color: 'text-cyber' }
  };

  const cycleStatus = (current) => {
    const order = ['pending', 'in_progress', 'completed'];
    return order[(order.indexOf(current) + 1) % order.length];
  };

  if (!tasks?.length) {
    return (
      <div className="py-8 text-center">
        <Circle className="w-8 h-8 mx-auto mb-3 text-gray-800" />
        <p className="font-mono text-xs text-gray-700">NO TASKS DEFINED</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const status = statusConfig[task.status] || statusConfig.pending;
        const priority = priorityConfig[task.priority] || priorityConfig.medium;
        const isExpanded = expandedTask === task.id;
        const assignedMember = team.find(m => m.id === task.assigned_to);

        return (
          <div key={task.id} className="task-row">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus?.(featureId, task.id, cycleStatus(task.status));
                }}
                className="flex-shrink-0 p-2 hover:bg-white/5 transition-all"
                title={`Click to change status (Current: ${status.label})`}
              >
                <div className={`led ${status.led}`} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-sans text-sm ${task.status === 'completed' ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                    {task.name}
                  </h4>
                  <span className={`font-mono text-[9px] ${priority.color}`}>[{priority.label}]</span>
                  {(assignedMember || task.assigned_name) && (
                    <span className="font-mono text-[9px] px-2 py-0.5 bg-signal/10 border border-signal/30 text-signal">
                      @{assignedMember?.name || task.assigned_name}
                    </span>
                  )}
                  {task.completed_by && (
                    <span className="font-mono text-[9px] px-2 py-0.5 bg-matrix/10 border border-matrix/30 text-matrix">
                      ✓ {task.completed_by}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-gray-600 line-clamp-1 mt-0.5">{task.description}</p>
              </div>

              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-gray-600">
                {task.metrics?.lines_added > 0 && (
                  <span>
                    <span className="text-matrix">+{task.metrics.lines_added}</span>
                    <span className="text-gray-700">/</span>
                    <span className="text-alert">-{task.metrics.lines_removed}</span>
                  </span>
                )}
                {task.technical_debt?.length > 0 && (
                  <span className="flex items-center gap-1 text-signal">
                    <AlertTriangle className="w-3 h-3" />
                    {task.technical_debt.length}
                  </span>
                )}
              </div>

              <button
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className="p-2 hover:bg-white/5 transition-all"
              >
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 animate-fade-in">
                <p className="font-mono text-xs text-gray-400">{task.description}</p>

                {/* Metrics */}
                {task.metrics?.lines_added > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MetricCard label="LINES" value={<><span className="text-matrix">+{task.metrics.lines_added}</span>/<span className="text-alert">-{task.metrics.lines_removed}</span></>} />
                    <MetricCard label="FILES" value={task.metrics.files_created + task.metrics.files_modified} color="text-cyber" />
                    <MetricCard label="COMPLEXITY" value={`${task.metrics.complexity_score}/10`} color="text-signal" />
                    <MetricCard label="COMMITS" value={task.git?.commits?.length || 0} color="text-matrix" />
                  </div>
                )}

                {/* Files */}
                {task.affected_files?.length > 0 && (
                  <div>
                    <h5 className="font-mono text-[10px] text-gray-600 tracking-wider mb-2"># AFFECTED FILES</h5>
                    <div className="flex flex-wrap gap-2">
                      {task.affected_files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => copyToClipboard(file, `file-${task.id}-${idx}`)}
                          className="group flex items-center gap-2 font-mono text-[11px] bg-void-100 px-3 py-1.5 border border-white/10 hover:border-matrix/30 transition-all"
                        >
                          <code className="text-cyber">{file}</code>
                          {copiedItem === `file-${task.id}-${idx}` ? (
                            <Check className="w-3 h-3 text-matrix" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-600 group-hover:text-matrix" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {task.reused_resources?.length > 0 && (
                  <div>
                    <h5 className="font-mono text-[10px] text-gray-600 tracking-wider mb-2"># REUSED RESOURCES</h5>
                    <div className="flex flex-wrap gap-2">
                      {task.reused_resources.map((r, idx) => (
                        <span key={idx} className="font-mono text-[11px] px-3 py-1.5 border border-cyber/30 text-cyber bg-cyber/5">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Notes */}
                {task.ai_notes?.trim() && (
                  <div className="border border-matrix/20 bg-matrix/5 p-4">
                    <h5 className="font-mono text-[10px] text-matrix tracking-wider mb-2 flex items-center gap-2">
                      <Bot className="w-3 h-3" /> AI NOTES
                    </h5>
                    <p className="font-mono text-xs text-gray-400">{task.ai_notes}</p>
                  </div>
                )}

                {/* Debt */}
                {task.technical_debt?.length > 0 && (
                  <div className="border border-signal/20 bg-signal/5 p-4">
                    <h5 className="font-mono text-[10px] text-signal tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> TECHNICAL DEBT ({task.technical_debt.length})
                    </h5>
                    <div className="space-y-2">
                      {task.technical_debt.map((debt, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className={`font-mono text-[9px] px-2 py-0.5 tracking-wider ${
                            debt.severity === 'high' ? 'bg-alert text-black' :
                            debt.severity === 'medium' ? 'bg-signal text-black' :
                            'bg-cyber text-black'
                          }`}>
                            {debt.severity?.toUpperCase()}
                          </span>
                          <div>
                            <p className="font-mono text-xs text-gray-400">{debt.description}</p>
                            <p className="font-mono text-[10px] text-gray-600 mt-1">{debt.estimated_effort}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Git */}
                {task.git?.last_commit && (
                  <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-gray-600">
                      <GitCommit className="w-3 h-3" />
                      <code className="text-matrix">{task.git.last_commit.substring(0, 7)}</code>
                    </div>
                    {task.git.pr_url && (
                      <a href={task.git.pr_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-cyber hover:text-cyber-bright">
                        PR #{task.git.pr_number} →
                      </a>
                    )}
                  </div>
                )}

                {/* Team Assignment */}
                {team.length > 0 && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <span className="font-mono text-[10px] text-gray-600">ASSIGN:</span>
                    <select
                      value={task.assigned_to || ''}
                      onChange={(e) => {
                        const member = team.find(m => m.id === e.target.value);
                        onAssignTask?.(featureId, task.id, e.target.value, member?.name || '');
                      }}
                      className="input-terminal px-3 py-1.5 text-[11px]"
                    >
                      <option value="">Sin asignar</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                    {task.assigned_name && (
                      <span className="font-mono text-[10px] text-signal">
                        → {task.assigned_name}
                      </span>
                    )}
                  </div>
                )}

                {/* Status Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="font-mono text-[10px] text-gray-600">STATUS:</span>
                  <div className="flex gap-1">
                    {['pending', 'in_progress', 'completed'].map((s) => {
                      const cfg = statusConfig[s];
                      const active = task.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => onUpdateStatus?.(featureId, task.id, s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] border transition-all ${
                            active ? `${cfg.color} border-current bg-current/10` : 'border-white/10 text-gray-600 hover:border-white/20'
                          }`}
                        >
                          <div className={`led ${cfg.led}`} style={{ width: '6px', height: '6px' }} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-void-100 border border-white/5 p-3">
      <div className="font-mono text-[9px] text-gray-600 tracking-wider mb-1">{label}</div>
      <div className={`metric-display text-lg ${color}`}>{value}</div>
    </div>
  );
}

// ============ METRICS TAB ============
function MetricsTab({ roadmap, language }) {
  const stats = useMemo(() => {
    if (!roadmap?.features) return { total: 0, completed: 0, inProgress: 0, pending: 0, byPriority: {}, byFeature: [] };

    let total = 0, completed = 0, inProgress = 0, pending = 0;
    const byPriority = { high: 0, medium: 0, low: 0 };
    const byFeature = [];

    roadmap.features.forEach(feature => {
      let featureCompleted = 0, featureTotal = 0;
      (feature.tasks || []).forEach(task => {
        total++;
        featureTotal++;
        if (task.status === 'completed') { completed++; featureCompleted++; }
        else if (task.status === 'in_progress') inProgress++;
        else pending++;
        if (task.priority) byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      });
      byFeature.push({
        name: feature.name,
        completed: featureCompleted,
        total: featureTotal,
        progress: featureTotal > 0 ? Math.round((featureCompleted / featureTotal) * 100) : 0
      });
    });

    return { total, completed, inProgress, pending, byPriority, byFeature };
  }, [roadmap]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="terminal-card p-5">
          <div className="font-mono text-[10px] text-gray-500 mb-2">{language === 'es' ? 'TOTAL TAREAS' : 'TOTAL TASKS'}</div>
          <div className="font-display text-3xl text-white">{stats.total}</div>
        </div>
        <div className="terminal-card p-5 border-matrix/20">
          <div className="font-mono text-[10px] text-gray-500 mb-2">{language === 'es' ? 'COMPLETADAS' : 'COMPLETED'}</div>
          <div className="font-display text-3xl text-matrix">{stats.completed}</div>
          <div className="font-mono text-[10px] text-matrix/60 mt-1">{completionRate}%</div>
        </div>
        <div className="terminal-card p-5 border-signal/20">
          <div className="font-mono text-[10px] text-gray-500 mb-2">{language === 'es' ? 'EN PROGRESO' : 'IN PROGRESS'}</div>
          <div className="font-display text-3xl text-signal">{stats.inProgress}</div>
        </div>
        <div className="terminal-card p-5">
          <div className="font-mono text-[10px] text-gray-500 mb-2">{language === 'es' ? 'PENDIENTES' : 'PENDING'}</div>
          <div className="font-display text-3xl text-gray-500">{stats.pending}</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="terminal-card p-5">
        <h3 className="font-mono text-sm text-white mb-4">{language === 'es' ? 'PROGRESO GENERAL' : 'OVERALL PROGRESS'}</h3>
        <div className="relative h-8 bg-void-100 border border-white/5 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-matrix/30 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
          <div
            className="absolute left-0 top-0 h-full bg-matrix transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${completionRate}%` }}
          >
            <span className="font-mono text-xs text-black font-bold">{completionRate}%</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 font-mono text-[10px] text-gray-600">
          <span>{stats.completed} / {stats.total} {language === 'es' ? 'tareas' : 'tasks'}</span>
          <span>{language === 'es' ? 'Meta: 100%' : 'Goal: 100%'}</span>
        </div>
      </div>

      {/* By Priority */}
      <div className="terminal-card p-5">
        <h3 className="font-mono text-sm text-white mb-4">{language === 'es' ? 'POR PRIORIDAD' : 'BY PRIORITY'}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-alert/5 border border-alert/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-alert" />
              <span className="font-mono text-xs text-alert">{language === 'es' ? 'ALTA' : 'HIGH'}</span>
            </div>
            <div className="font-display text-2xl text-alert">{stats.byPriority.high || 0}</div>
          </div>
          <div className="p-4 bg-signal/5 border border-signal/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-signal" />
              <span className="font-mono text-xs text-signal">{language === 'es' ? 'MEDIA' : 'MEDIUM'}</span>
            </div>
            <div className="font-display text-2xl text-signal">{stats.byPriority.medium || 0}</div>
          </div>
          <div className="p-4 bg-cyber/5 border border-cyber/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-cyber" />
              <span className="font-mono text-xs text-cyber">{language === 'es' ? 'BAJA' : 'LOW'}</span>
            </div>
            <div className="font-display text-2xl text-cyber">{stats.byPriority.low || 0}</div>
          </div>
        </div>
      </div>

      {/* By Feature */}
      <div className="terminal-card p-5">
        <h3 className="font-mono text-sm text-white mb-4">{language === 'es' ? 'POR FEATURE' : 'BY FEATURE'}</h3>
        <div className="space-y-3">
          {stats.byFeature.map((feature, idx) => (
            <div key={idx} className="p-3 bg-void-100 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-white">{feature.name}</span>
                <span className="font-mono text-xs text-gray-500">{feature.completed}/{feature.total}</span>
              </div>
              <div className="h-2 bg-void-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    feature.progress === 100 ? 'bg-matrix' : feature.progress > 50 ? 'bg-signal' : 'bg-gray-600'
                  }`}
                  style={{ width: `${feature.progress}%` }}
                />
              </div>
              <div className="mt-1 font-mono text-[10px] text-gray-600 text-right">{feature.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="terminal-card p-5">
        <h3 className="font-mono text-sm text-white mb-4">{language === 'es' ? 'EXPORTAR DATOS' : 'EXPORT DATA'}</h3>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const csv = [
                ['Feature', 'Task', 'Status', 'Priority', 'Assignee'].join(','),
                ...roadmap.features.flatMap(f =>
                  (f.tasks || []).map(t =>
                    [f.name, t.name, t.status, t.priority || 'medium', t.assigned_name || ''].join(',')
                  )
                )
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'roadmap-export.csv';
              a.click();
            }}
            className="btn-terminal flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(roadmap, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'roadmap-backup.json';
              a.click();
            }}
            className="btn-terminal flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ RESOURCES TAB ============
function ResourcesTab({ resources }) {
  const { ui_components = [], utilities = [], database_tables = [] } = resources;
  const [copiedItem, setCopiedItem] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="terminal-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="led led-green" />
            <span className="font-mono text-[10px] text-gray-500 tracking-wider">UI COMPONENTS</span>
          </div>
          <div className="metric-display text-3xl text-matrix">{ui_components.length}</div>
        </div>
        <div className="terminal-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="led led-amber" />
            <span className="font-mono text-[10px] text-gray-500 tracking-wider">UTILITIES</span>
          </div>
          <div className="metric-display text-3xl text-signal">{utilities.length}</div>
        </div>
        <div className="terminal-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="led led-green" />
            <span className="font-mono text-[10px] text-gray-500 tracking-wider">DB TABLES</span>
          </div>
          <div className="metric-display text-3xl text-cyber">{database_tables.length}</div>
        </div>
      </div>

      {/* UI Components */}
      {ui_components.length > 0 && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-matrix tracking-wider mb-4"># UI_COMPONENTS</h3>
          <div className="space-y-3">
            {ui_components.map((comp, idx) => (
              <div key={idx} className="bg-void-100 border border-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="font-mono text-sm text-cyber">{comp.path}</code>
                  <button
                    onClick={() => copyToClipboard(comp.usage, `comp-${idx}`)}
                    className="p-1.5 hover:bg-white/5 transition-all"
                  >
                    {copiedItem === `comp-${idx}` ? <Check className="w-3 h-3 text-matrix" /> : <Copy className="w-3 h-3 text-gray-600" />}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-500 mb-2">{comp.description}</p>
                <code className="font-mono text-[11px] text-signal block bg-black/50 p-2 border border-white/5">{comp.usage}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilities */}
      {utilities.length > 0 && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-signal tracking-wider mb-4"># UTILITIES</h3>
          <div className="space-y-3">
            {utilities.map((util, idx) => (
              <div key={idx} className="bg-void-100 border border-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="font-mono text-sm text-cyber">{util.path}</code>
                  <button
                    onClick={() => copyToClipboard(util.usage, `util-${idx}`)}
                    className="p-1.5 hover:bg-white/5 transition-all"
                  >
                    {copiedItem === `util-${idx}` ? <Check className="w-3 h-3 text-matrix" /> : <Copy className="w-3 h-3 text-gray-600" />}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-500 mb-2">{util.description}</p>
                {util.exports && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {util.exports.map((exp, i) => (
                      <span key={i} className="font-mono text-[10px] px-2 py-0.5 bg-matrix/10 text-matrix border border-matrix/20">{exp}</span>
                    ))}
                  </div>
                )}
                <code className="font-mono text-[11px] text-signal block bg-black/50 p-2 border border-white/5">{util.usage}</code>
                {util.warning && (
                  <div className="flex items-center gap-2 mt-2 text-alert font-mono text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    {util.warning}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Tables */}
      {database_tables.length > 0 && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-cyber tracking-wider mb-4"># DATABASE_TABLES</h3>
          <div className="space-y-3">
            {database_tables.map((table, idx) => (
              <div key={idx} className="bg-void-100 border border-white/5 p-4">
                <code className="font-mono text-sm text-matrix">{table.name}</code>
                <p className="font-mono text-xs text-gray-500 mt-2 mb-3">{table.description}</p>
                <div className="flex flex-wrap gap-1">
                  {table.fields?.map((field, i) => (
                    <span key={i} className="font-mono text-[10px] px-2 py-0.5 bg-cyber/10 text-cyber border border-cyber/20">{field}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ DEBT TAB ============
function DebtTab({ roadmap, setRoadmap, setHasChanges }) {
  const [expandedDebt, setExpandedDebt] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);

  // Get all features and tasks for the add form
  const featuresWithTasks = (roadmap?.features || []).map(f => ({
    id: f.id,
    name: f.name,
    tasks: f.tasks || []
  }));

  const allDebts = [];
  roadmap?.features?.forEach(feature => {
    feature.tasks?.forEach(task => {
      task.technical_debt?.forEach((debt, debtIdx) => {
        allDebts.push({
          ...debt,
          id: `${feature.id}-${task.id}-${debtIdx}`,
          debtIndex: debtIdx,
          featureId: feature.id,
          featureName: feature.name,
          taskId: task.id,
          taskName: task.name
        });
      });
    });
  });

  const bySeverity = {
    high: allDebts.filter(d => d.severity === 'high'),
    medium: allDebts.filter(d => d.severity === 'medium'),
    low: allDebts.filter(d => d.severity === 'low')
  };

  const filteredDebts = allDebts.filter(debt => {
    if (filterSeverity !== 'all' && debt.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && (debt.status || 'pending') !== filterStatus) return false;
    return true;
  });

  const statusConfig = {
    pending: { led: 'led-gray', label: 'PENDING', color: 'text-gray-500' },
    in_progress: { led: 'led-amber', label: 'IN PROGRESS', color: 'text-signal' },
    resolved: { led: 'led-green', label: 'RESOLVED', color: 'text-matrix' }
  };

  // Update debt status
  const updateDebtStatus = (featureId, taskId, debtIndex, newStatus) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const feature = updated.features.find(f => f.id === featureId);
      if (feature) {
        const task = feature.tasks.find(t => t.id === taskId);
        if (task && task.technical_debt?.[debtIndex]) {
          task.technical_debt[debtIndex].status = newStatus;
          if (newStatus === 'resolved') {
            task.technical_debt[debtIndex].resolved_at = new Date().toISOString();
          }
        }
      }
      return updated;
    });
    setHasChanges(true);
  };

  // Add new debt
  const addDebt = (featureId, taskId, debtData) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const feature = updated.features.find(f => f.id === featureId);
      if (feature) {
        const task = feature.tasks.find(t => t.id === taskId);
        if (task) {
          if (!task.technical_debt) task.technical_debt = [];
          task.technical_debt.push({
            ...debtData,
            created_at: new Date().toISOString(),
            status: 'pending'
          });
        }
      }
      return updated;
    });
    setHasChanges(true);
    setShowAddDebt(false);
  };

  // Update debt
  const updateDebt = (featureId, taskId, debtIndex, debtData) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const feature = updated.features.find(f => f.id === featureId);
      if (feature) {
        const task = feature.tasks.find(t => t.id === taskId);
        if (task && task.technical_debt?.[debtIndex]) {
          task.technical_debt[debtIndex] = {
            ...task.technical_debt[debtIndex],
            ...debtData
          };
        }
      }
      return updated;
    });
    setHasChanges(true);
    setEditingDebt(null);
  };

  // Delete debt
  const deleteDebt = (featureId, taskId, debtIndex) => {
    if (!confirm('¿Eliminar esta deuda técnica?')) return;
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const feature = updated.features.find(f => f.id === featureId);
      if (feature) {
        const task = feature.tasks.find(t => t.id === taskId);
        if (task && task.technical_debt) {
          task.technical_debt.splice(debtIndex, 1);
        }
      }
      return updated;
    });
    setHasChanges(true);
    setExpandedDebt(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
          className={`terminal-card p-5 transition-all ${filterSeverity === 'high' ? 'border-alert glow-alert' : 'border-alert/30 hover:border-alert/50'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="led led-red" />
            <span className="font-mono text-[10px] text-gray-500 tracking-wider">HIGH</span>
          </div>
          <div className="metric-display text-3xl text-alert">{bySeverity.high.length}</div>
        </button>
        <button
          onClick={() => setFilterSeverity(filterSeverity === 'medium' ? 'all' : 'medium')}
          className={`terminal-card p-5 transition-all ${filterSeverity === 'medium' ? 'border-signal glow-signal' : 'border-signal/30 hover:border-signal/50'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="led led-amber" />
            <span className="font-mono text-[10px] text-gray-500 tracking-wider">MEDIUM</span>
          </div>
          <div className="metric-display text-3xl text-signal">{bySeverity.medium.length}</div>
        </button>
        <button
          onClick={() => setFilterSeverity(filterSeverity === 'low' ? 'all' : 'low')}
          className={`terminal-card p-5 transition-all ${filterSeverity === 'low' ? 'border-cyber glow-cyber' : 'border-cyber/30 hover:border-cyber/50'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="led led-green" />
            <span className="font-mono text-[10px] text-gray-500 tracking-wider">LOW</span>
          </div>
          <div className="metric-display text-3xl text-cyber">{bySeverity.low.length}</div>
        </button>
      </div>

      {/* Filters & Add Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[10px] text-gray-600">FILTER:</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-terminal px-3 py-2 text-xs"
        >
          <option value="all">ALL STATUS</option>
          <option value="pending">PENDING</option>
          <option value="in_progress">IN PROGRESS</option>
          <option value="resolved">RESOLVED</option>
        </select>
        {(filterSeverity !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setFilterSeverity('all'); setFilterStatus('all'); }}
            className="font-mono text-[10px] text-gray-500 hover:text-white transition-all"
          >
            CLEAR
          </button>
        )}
        <span className="font-mono text-[10px] text-gray-600">
          {filteredDebts.length} / {allDebts.length} items
        </span>
        <button
          onClick={() => setShowAddDebt(true)}
          className="ml-auto btn-terminal flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ADD DEBT
        </button>
      </div>

      {/* Add Debt Form */}
      {showAddDebt && (
        <DebtForm
          features={featuresWithTasks}
          team={teamMembers}
          onSave={addDebt}
          onCancel={() => setShowAddDebt(false)}
        />
      )}

      {/* Debt Items */}
      {filteredDebts.length > 0 ? (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-signal tracking-wider mb-4"># TECHNICAL_DEBT</h3>
          <div className="space-y-2">
            {filteredDebts.map((debt) => {
              const isExpanded = expandedDebt === debt.id;
              const isEditing = editingDebt === debt.id;
              const status = statusConfig[debt.status || 'pending'];

              return (
                <div key={debt.id} className={`bg-void-100 border transition-all ${
                  debt.status === 'resolved' ? 'border-matrix/20 opacity-60' :
                  debt.severity === 'high' ? 'border-alert/30' :
                  debt.severity === 'medium' ? 'border-signal/30' :
                  'border-cyber/30'
                }`}>
                  {/* Header - Clickable */}
                  <button
                    onClick={() => setExpandedDebt(isExpanded ? null : debt.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-all"
                  >
                    <span className={`font-mono text-[9px] px-2 py-0.5 tracking-wider flex-shrink-0 ${
                      debt.severity === 'high' ? 'bg-alert text-black' :
                      debt.severity === 'medium' ? 'bg-signal text-black' :
                      'bg-cyber text-black'
                    }`}>
                      {debt.severity?.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-mono text-xs line-clamp-1 ${debt.status === 'resolved' ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                        {debt.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-gray-600">
                        <span className="truncate max-w-[120px]">{debt.featureName}</span>
                        <span>•</span>
                        <span>{debt.estimated_effort || 'TBD'}</span>
                        {debt.assigned_to && (
                          <>
                            <span>•</span>
                            <span className="text-signal">@{debt.assigned_to}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`led ${status.led}`} title={status.label} />
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && !isEditing && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 animate-fade-in">
                      {/* Status Controls */}
                      <div className="flex items-center gap-2 p-3 bg-black/30 border border-white/5">
                        <span className="font-mono text-[10px] text-gray-600">STATUS:</span>
                        <div className="flex gap-1">
                          {['pending', 'in_progress', 'resolved'].map((s) => {
                            const cfg = statusConfig[s];
                            const active = (debt.status || 'pending') === s;
                            return (
                              <button
                                key={s}
                                onClick={() => updateDebtStatus(debt.featureId, debt.taskId, debt.debtIndex, s)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] border transition-all ${
                                  active ? `${cfg.color} border-current bg-current/10` : 'border-white/10 text-gray-600 hover:border-white/20'
                                }`}
                              >
                                <div className={`led ${cfg.led}`} style={{ width: '6px', height: '6px' }} />
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => setEditingDebt(debt.id)}
                            className="p-1.5 text-gray-600 hover:text-cyber transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDebt(debt.featureId, debt.taskId, debt.debtIndex)}
                            className="p-1.5 text-gray-600 hover:text-alert transition-all"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Full Description */}
                      <div>
                        <h5 className="font-mono text-[10px] text-gray-600 tracking-wider mb-2"># DESCRIPTION</h5>
                        <p className="font-mono text-xs text-gray-400">{debt.description}</p>
                      </div>

                      {/* Impact */}
                      {debt.impact && (
                        <div className="p-3 border border-alert/20 bg-alert/5">
                          <h5 className="font-mono text-[10px] text-alert tracking-wider mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> IMPACT
                          </h5>
                          <p className="font-mono text-xs text-gray-400">{debt.impact}</p>
                        </div>
                      )}

                      {/* Solution */}
                      {debt.solution && (
                        <div className="p-3 border border-matrix/20 bg-matrix/5">
                          <h5 className="font-mono text-[10px] text-matrix tracking-wider mb-2 flex items-center gap-2">
                            <Wrench className="w-3 h-3" /> PROPOSED SOLUTION
                          </h5>
                          <p className="font-mono text-xs text-gray-400">{debt.solution}</p>
                        </div>
                      )}

                      {/* Affected Files */}
                      {debt.affected_files && debt.affected_files.length > 0 && (
                        <div>
                          <h5 className="font-mono text-[10px] text-gray-600 tracking-wider mb-2"># AFFECTED FILES</h5>
                          <div className="flex flex-wrap gap-2">
                            {debt.affected_files.map((file, idx) => (
                              <code key={idx} className="font-mono text-[11px] px-2 py-1 bg-black/50 border border-white/10 text-cyber">
                                {file}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-black/30 p-3 border border-white/5">
                          <div className="font-mono text-[9px] text-gray-600 tracking-wider mb-1">FEATURE</div>
                          <div className="font-mono text-xs text-white truncate">{debt.featureName}</div>
                        </div>
                        <div className="bg-black/30 p-3 border border-white/5">
                          <div className="font-mono text-[9px] text-gray-600 tracking-wider mb-1">TASK</div>
                          <div className="font-mono text-xs text-white truncate">{debt.taskName}</div>
                        </div>
                        <div className="bg-black/30 p-3 border border-white/5">
                          <div className="font-mono text-[9px] text-gray-600 tracking-wider mb-1">EFFORT</div>
                          <div className="font-mono text-xs text-signal">{debt.estimated_effort || 'Not estimated'}</div>
                        </div>
                        <div className="bg-black/30 p-3 border border-white/5">
                          <div className="font-mono text-[9px] text-gray-600 tracking-wider mb-1">PRIORITY</div>
                          <div className={`font-mono text-xs ${
                            debt.priority === 'critical' ? 'text-alert' :
                            debt.priority === 'high' ? 'text-signal' :
                            'text-cyber'
                          }`}>{debt.priority || debt.severity || 'Medium'}</div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-4 pt-3 border-t border-white/5 font-mono text-[10px] text-gray-600 flex-wrap">
                        {debt.created_at && (
                          <span>Created: {new Date(debt.created_at).toLocaleDateString()}</span>
                        )}
                        {debt.resolved_at && (
                          <span className="text-matrix">Resolved: {new Date(debt.resolved_at).toLocaleDateString()}</span>
                        )}
                        {debt.assigned_to && (
                          <span className="text-signal">Assigned: @{debt.assigned_to}</span>
                        )}
                        {debt.due_date && (
                          <span className="text-alert">Due: {new Date(debt.due_date).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Tags */}
                      {debt.tags && debt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {debt.tags.map((tag, idx) => (
                            <span key={idx} className="font-mono text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 text-gray-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit Form */}
                  {isExpanded && isEditing && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/5">
                      <DebtForm
                        features={featuresWithTasks}
                        team={teamMembers}
                        initialData={debt}
                        onSave={(featureId, taskId, data) => updateDebt(debt.featureId, debt.taskId, debt.debtIndex, data)}
                        onCancel={() => setEditingDebt(null)}
                        isEdit
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="terminal-card p-12 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-matrix" />
          <p className="font-mono text-sm text-gray-600">
            {allDebts.length === 0 ? 'NO TECHNICAL DEBT REGISTERED' : 'NO ITEMS MATCH FILTERS'}
          </p>
          {allDebts.length === 0 && (
            <button
              onClick={() => setShowAddDebt(true)}
              className="btn-terminal mt-4 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ADD FIRST DEBT
            </button>
          )}
        </div>
      )}

      {/* Debt Schema Info */}
      <div className="terminal-card p-4">
        <details>
          <summary className="font-mono text-[10px] text-gray-600 cursor-pointer hover:text-white">
            JSON SCHEMA FOR TECHNICAL DEBT
          </summary>
          <pre className="mt-4 p-4 bg-void-100 border border-white/5 font-mono text-[10px] text-gray-500 overflow-x-auto">
{`{
  "technical_debt": [
    {
      "description": "Main description of the debt",
      "severity": "high | medium | low",
      "estimated_effort": "2h | 1d | 1w",
      "impact": "What happens if not fixed",
      "solution": "Proposed solution approach",
      "affected_files": ["src/file1.js", "src/file2.js"],
      "status": "pending | in_progress | resolved",
      "priority": "critical | high | medium | low",
      "assigned_to": "developer_name",
      "created_at": "2024-01-15T10:00:00Z",
      "due_date": "2024-02-01T00:00:00Z",
      "tags": ["security", "performance", "refactor"]
    }
  ]
}`}
          </pre>
        </details>
      </div>
    </div>
  );
}

// Debt Form Component
function DebtForm({ features, team, initialData, onSave, onCancel, isEdit }) {
  const [featureId, setFeatureId] = useState(initialData?.featureId || features[0]?.id || '');
  const [taskId, setTaskId] = useState(initialData?.taskId || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [severity, setSeverity] = useState(initialData?.severity || 'medium');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [estimatedEffort, setEstimatedEffort] = useState(initialData?.estimated_effort || '');
  const [impact, setImpact] = useState(initialData?.impact || '');
  const [solution, setSolution] = useState(initialData?.solution || '');
  const [assignedTo, setAssignedTo] = useState(initialData?.assigned_to || '');
  const [affectedFiles, setAffectedFiles] = useState(initialData?.affected_files?.join(', ') || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');

  const selectedFeature = features.find(f => f.id === featureId);
  const tasks = selectedFeature?.tasks || [];

  useEffect(() => {
    if (!isEdit && tasks.length > 0 && !taskId) {
      setTaskId(tasks[0].id);
    }
  }, [featureId, tasks, isEdit, taskId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || (!isEdit && (!featureId || !taskId))) return;

    const debtData = {
      description,
      severity,
      priority,
      estimated_effort: estimatedEffort || null,
      impact: impact || null,
      solution: solution || null,
      assigned_to: assignedTo || null,
      affected_files: affectedFiles ? affectedFiles.split(',').map(f => f.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    onSave(featureId, taskId, debtData);
  };

  return (
    <form onSubmit={handleSubmit} className="terminal-card p-5 space-y-4">
      <h3 className="font-mono text-sm text-signal tracking-wider">
        {isEdit ? '# EDIT DEBT' : '# NEW TECHNICAL DEBT'}
      </h3>

      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">FEATURE *</label>
            <select
              value={featureId}
              onChange={(e) => { setFeatureId(e.target.value); setTaskId(''); }}
              className="input-terminal w-full px-3 py-2 text-sm"
              required
            >
              <option value="">Select feature...</option>
              {features.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">TASK *</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="input-terminal w-full px-3 py-2 text-sm"
              required
              disabled={!featureId}
            >
              <option value="">Select task...</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">DESCRIPTION *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the technical debt..."
          rows={2}
          className="input-terminal w-full px-3 py-2 text-sm resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">SEVERITY</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input-terminal w-full px-3 py-2 text-sm">
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">PRIORITY</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-terminal w-full px-3 py-2 text-sm">
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">EFFORT</label>
          <input
            type="text"
            value={estimatedEffort}
            onChange={(e) => setEstimatedEffort(e.target.value)}
            placeholder="e.g. 2h, 1d"
            className="input-terminal w-full px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">ASSIGNED</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-terminal w-full px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {team.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">IMPACT</label>
        <textarea
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          placeholder="What happens if not fixed?"
          rows={2}
          className="input-terminal w-full px-3 py-2 text-sm resize-none"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">PROPOSED SOLUTION</label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="How to fix this?"
          rows={2}
          className="input-terminal w-full px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">AFFECTED FILES</label>
          <input
            type="text"
            value={affectedFiles}
            onChange={(e) => setAffectedFiles(e.target.value)}
            placeholder="src/file1.js, src/file2.js"
            className="input-terminal w-full px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider mb-2 block">TAGS</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="security, performance"
            className="input-terminal w-full px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-white/10 text-gray-500 font-mono text-xs hover:text-white transition-all">
          CANCEL
        </button>
        <button type="submit" className="btn-terminal flex-1 py-2">
          {isEdit ? 'UPDATE' : 'ADD DEBT'}
        </button>
      </div>
    </form>
  );
}

// ============ INFO TAB ============
function InfoTab({ projectInfo }) {
  const conventions = projectInfo.conventions || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stack */}
      <div className="terminal-card p-5">
        <h3 className="font-mono text-sm text-matrix tracking-wider mb-4"># STACK</h3>
        <div className="flex flex-wrap gap-2">
          {(projectInfo.stack || []).map((tech, idx) => (
            <span key={idx} className="font-mono text-xs px-3 py-1.5 border border-matrix/30 text-matrix bg-matrix/5">
              {tech}
            </span>
          ))}
          {(!projectInfo.stack || projectInfo.stack.length === 0) && (
            <p className="font-mono text-xs text-gray-600">NO STACK DEFINED</p>
          )}
        </div>
      </div>

      {/* Architecture */}
      {projectInfo.architecture && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-cyber tracking-wider mb-4"># ARCHITECTURE</h3>
          <p className="font-mono text-xs text-gray-400 leading-relaxed">{projectInfo.architecture}</p>
        </div>
      )}

      {/* Conventions */}
      {Object.keys(conventions).length > 0 && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-signal tracking-wider mb-4"># CONVENTIONS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conventions.naming && (
              <div className="bg-void-100 border border-white/5 p-4">
                <h4 className="font-mono text-[10px] text-matrix tracking-wider mb-3">NAMING</h4>
                {typeof conventions.naming === 'object' ? (
                  <div className="space-y-1">
                    {Object.entries(conventions.naming).map(([key, value]) => (
                      <div key={key} className="flex justify-between font-mono text-[11px]">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-400">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-gray-400">{conventions.naming}</p>
                )}
              </div>
            )}
            {conventions.file_structure && (
              <div className="bg-void-100 border border-white/5 p-4">
                <h4 className="font-mono text-[10px] text-cyber tracking-wider mb-3">FILE STRUCTURE</h4>
                <p className="font-mono text-xs text-gray-400">{conventions.file_structure}</p>
              </div>
            )}
            {conventions.database && (
              <div className="bg-void-100 border border-white/5 p-4">
                <h4 className="font-mono text-[10px] text-signal tracking-wider mb-3">DATABASE</h4>
                <p className="font-mono text-xs text-gray-400">{conventions.database}</p>
              </div>
            )}
            {conventions.styling && (
              <div className="bg-void-100 border border-white/5 p-4">
                <h4 className="font-mono text-[10px] text-alert tracking-wider mb-3">STYLING</h4>
                <p className="font-mono text-xs text-gray-400">{conventions.styling}</p>
              </div>
            )}
            {conventions.error_handling && (
              <div className="bg-void-100 border border-white/5 p-4 md:col-span-2">
                <h4 className="font-mono text-[10px] text-matrix tracking-wider mb-3">ERROR HANDLING</h4>
                <p className="font-mono text-xs text-gray-400">{conventions.error_handling}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purpose */}
      {projectInfo.purpose && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-matrix tracking-wider mb-4"># PURPOSE</h3>
          <p className="font-mono text-xs text-gray-400 leading-relaxed">{projectInfo.purpose}</p>
        </div>
      )}

      {/* Last Sync */}
      {projectInfo.last_sync && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-gray-600">
          <Activity className="w-3 h-3" />
          LAST SYNC: {new Date(projectInfo.last_sync).toLocaleString('es-ES')}
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab({ roadmap, setRoadmap, setHasChanges, authState, showConfirm, showAlert, t, language, changeLanguage }) {
  const [copiedItem, setCopiedItem] = useState(null);
  const [clinerules, setClinerules] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployMessage, setDeployMessage] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [deployBoth, setDeployBoth] = useState(false);
  const [jsonEditMode, setJsonEditMode] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [clineruleExpanded, setClineruleExpanded] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState('profile');

  // User management state (admin only)
  const [usersExpanded, setUsersExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'member' });
  const [userError, setUserError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [authSettings, setAuthSettings] = useState({ requireAuth: true });

  const isAdmin = authState?.user?.role === 'admin';

  // Profile editing state
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [profileData, setProfileData] = useState({
    name: authState?.user?.name || '',
    email: authState?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (authState?.user) {
      setProfileData(prev => ({
        ...prev,
        name: authState.user.name || '',
        email: authState.user.email || ''
      }));
    }
  }, [authState?.user]);

  const updateProfile = async () => {
    setProfileError(null);
    setProfileSuccess(null);

    // Validate
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }
    if (profileData.newPassword && !profileData.currentPassword) {
      setProfileError('Current password required to set new password');
      return;
    }
    if (profileData.newPassword && profileData.newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = { name: profileData.name, email: profileData.email };
      if (profileData.newPassword) {
        payload.currentPassword = profileData.currentPassword;
        payload.newPassword = profileData.newPassword;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setProfileSuccess('Profile updated successfully');
        setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        // Update authState if we have a callback
        if (data.user && window.location) {
          // Reload to refresh session
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('Error updating profile');
    }
    setSavingProfile(false);
  };

  // Load users and auth settings
  const loadUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const [usersRes, settingsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/auth/settings')
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAuthSettings(data.settings || {});
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (usersExpanded && isAdmin && users.length === 0) {
      loadUsers();
    }
  }, [usersExpanded, isAdmin]);

  const createUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setUserError(language === 'es' ? 'Todos los campos son requeridos' : 'All fields are required');
      return;
    }
    setUserError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => [...prev, data.user]);
        setNewUser({ name: '', email: '', password: '', role: 'member' });
      } else {
        setUserError(data.error);
      }
    } catch (err) {
      setUserError(language === 'es' ? 'Error al crear usuario' : 'Error creating user');
    }
  };

  const deleteUser = async (userId) => {
    showConfirm(
      t('settings.deleteUser'),
      language === 'es' ? '¿Estás seguro de que quieres eliminar este usuario?' : 'Are you sure you want to delete this user?',
      async () => {
        try {
          const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
          if (res.ok) {
            setUsers(prev => prev.filter(u => u.id !== userId));
          } else {
            const data = await res.json();
            showAlert(t('common.error'), data.error || (language === 'es' ? 'Error al eliminar usuario' : 'Error deleting user'));
          }
        } catch (err) {
          showAlert(t('common.error'), language === 'es' ? 'Error al eliminar usuario' : 'Error deleting user');
        }
      }
    );
  };

  const updateAuthSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setAuthSettings(data.settings);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  useEffect(() => {
    setClinerules(generateClinerules());
    setJsonContent(JSON.stringify(roadmap, null, 2));
    fetch('/api/project-info')
      .then(res => res.json())
      .then(data => setProjectInfo(data))
      .catch(() => {});
  }, [roadmap]);

  const validateAndApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.project_info || !parsed.features) {
        throw new Error('JSON must have project_info and features');
      }
      setRoadmap(parsed);
      setHasChanges(true);
      setJsonError(null);
      setJsonEditMode(false);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err) {
      setJsonError('INVALID JSON: ' + err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deployToProject = async () => {
    setDeploying(true);
    setDeployMessage(null);
    try {
      const payload = { clinerules, roadmap };
      if (deployBoth) payload.cursorrules = clinerules;

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setDeployMessage({ type: 'success', text: `DEPLOYED: ${result.projectRoot}`, files: result.files });
      } else {
        throw new Error('API unavailable');
      }
    } catch (err) {
      downloadFile(clinerules, '.clinerules');
      if (deployBoth) downloadFile(clinerules, '.cursorrules');
      downloadFile(JSON.stringify(roadmap, null, 2), 'roadmap.json');
      setDeployMessage({ type: 'info', text: 'FILES DOWNLOADED. Copy manually to project root.' });
    } finally {
      setDeploying(false);
    }
  };

  // Version history state
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [restoringVersion, setRestoringVersion] = useState(false);

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch('/api/versions');
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Error loading versions:', err);
    }
    setLoadingVersions(false);
  };

  const viewVersion = async (versionId) => {
    try {
      const res = await fetch(`/api/versions/${versionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVersion(data.version);
      }
    } catch (err) {
      console.error('Error loading version:', err);
    }
  };

  const restoreVersion = async (versionId) => {
    const confirmed = await showConfirm({
      title: 'RESTORE VERSION',
      message: 'This will restore the selected version. A backup of the current state will be saved first.',
      type: 'warning',
      confirmText: 'RESTORE',
      cancelText: 'CANCEL'
    });
    if (!confirmed) return;

    setRestoringVersion(true);
    try {
      const res = await fetch(`/api/versions/${versionId}/restore`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap);
        setSelectedVersion(null);
        loadVersions();
        showAlert({
          title: 'VERSION RESTORED',
          message: 'The roadmap has been restored successfully. A backup was saved.',
          type: 'success'
        });
      }
    } catch (err) {
      showAlert({
        title: 'RESTORE FAILED',
        message: err.message,
        type: 'error'
      });
    }
    setRestoringVersion(false);
  };

  // Settings sub-tabs configuration
  const settingsTabs = [
    { id: 'profile', label: t('settings.profile'), icon: User, show: !!authState?.user },
    { id: 'users', label: t('settings.users'), icon: Lock, show: isAdmin },
    { id: 'history', label: t('settings.history'), icon: Clock, show: true },
    { id: 'files', label: t('settings.files'), icon: FileCode, show: true },
    { id: 'language', label: t('settings.language'), icon: Globe, show: true },
  ].filter(tab => tab.show);

  // Auto-select first available tab if current is hidden
  useEffect(() => {
    if (!settingsTabs.find(t => t.id === settingsSubTab)) {
      setSettingsSubTab(settingsTabs[0]?.id || 'profile');
    }
  }, [isAdmin, authState?.user]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Horizontal Tab Navigation */}
      <div className="flex gap-2 flex-wrap border-b border-white/10 pb-4">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSettingsSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs tracking-wider border transition-all ${
                settingsSubTab === tab.id
                  ? 'border-signal text-signal bg-signal/10'
                  : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PROFILE TAB */}
      {settingsSubTab === 'profile' && authState?.user && (
        <div className="terminal-card p-5 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 border border-cyber/30 bg-cyber/10 flex items-center justify-center font-display text-cyber text-xl">
              {authState.user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-mono text-sm text-white">{authState.user.name}</h3>
              <p className="font-mono text-[11px] text-gray-500">{authState.user.email}</p>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 mt-1 inline-block ${
                authState.user.role === 'admin' ? 'bg-alert/20 text-alert' : 'bg-cyber/20 text-cyber'
              }`}>
                {authState.user.role?.toUpperCase()}
              </span>
            </div>
          </div>

          {profileError && (
            <div className="p-3 border border-alert/30 bg-alert/5 font-mono text-xs text-alert flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 border border-matrix/30 bg-matrix/5 font-mono text-xs text-matrix flex items-center gap-2">
              <Check className="w-4 h-4" />
              {profileSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-2">NAME</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full input-terminal px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-2">EMAIL</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full input-terminal px-3 py-2 text-sm"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-5">
            <h4 className="font-mono text-[10px] text-gray-500 tracking-wider mb-4">CHANGE PASSWORD</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-[10px] text-gray-600 block mb-2">Current Password</label>
                <input
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full input-terminal px-3 py-2 text-sm"
                  placeholder="Required"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-gray-600 block mb-2">New Password</label>
                <input
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full input-terminal px-3 py-2 text-sm"
                  placeholder="Min 6 chars"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-gray-600 block mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full input-terminal px-3 py-2 text-sm"
                  placeholder="Repeat"
                />
              </div>
            </div>
          </div>

          <button
            onClick={updateProfile}
            disabled={savingProfile}
            className="btn-terminal py-2 px-6 disabled:opacity-50 flex items-center gap-2"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SAVE CHANGES
          </button>
        </div>
      )}

      {/* HISTORY TAB */}
      {settingsSubTab === 'history' && (
        <div className="terminal-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-mono text-sm text-white">VERSION HISTORY</h3>
              <p className="font-mono text-[10px] text-gray-600">
                Last {versions.length} changes • Click to preview & restore
              </p>
            </div>
            <button
              onClick={loadVersions}
              disabled={loadingVersions}
              className="btn-terminal py-2 px-4 text-xs"
            >
              {loadingVersions ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>

          {/* Load on first view */}
          {versions.length === 0 && !loadingVersions && (
            <div className="py-10 text-center border border-dashed border-white/10">
              <Clock className="w-10 h-10 mx-auto mb-3 text-gray-800" />
              <p className="font-mono text-xs text-gray-600">NO VERSIONS YET</p>
              <p className="font-mono text-[10px] text-gray-700 mt-1">Versions are saved automatically when you save changes</p>
              <button onClick={loadVersions} className="mt-4 btn-terminal py-2 px-4 text-xs">
                LOAD HISTORY
              </button>
            </div>
          )}

          {loadingVersions && (
            <div className="py-10 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-600" />
            </div>
          )}

          {/* Version List */}
          {versions.length > 0 && (
            <div className="space-y-2">
              {versions.map((version, idx) => (
                <div
                  key={version.id}
                  className={`p-4 border transition-all cursor-pointer ${
                    selectedVersion?.id === version.id
                      ? 'border-cyber/50 bg-cyber/5'
                      : 'border-white/5 bg-void-100 hover:border-white/20'
                  }`}
                  onClick={() => viewVersion(version.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 border flex items-center justify-center font-display text-xs ${
                        idx === 0 ? 'border-matrix/30 bg-matrix/10 text-matrix' : 'border-gray-700 bg-gray-800 text-gray-500'
                      }`}>
                        {idx === 0 ? 'NOW' : `-${idx}`}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-white">
                          {new Date(version.timestamp).toLocaleString()}
                        </div>
                        <div className="font-mono text-[10px] text-gray-500">
                          {version.userName} • {version.description}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-gray-600">
                      {version.featuresCount} features • {version.tasksCount} tasks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Version Preview with Diff */}
          {selectedVersion && (() => {
            const diff = computeRoadmapDiff(roadmap, selectedVersion.snapshot);
            const hasChanges = diff.summary.added > 0 || diff.summary.removed > 0 || diff.summary.modified > 0;

            return (
              <div className="mt-5 p-4 border border-cyber/30 bg-cyber/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-sm text-cyber flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    VERSION DIFF
                  </div>
                  <button
                    onClick={() => restoreVersion(selectedVersion.id)}
                    disabled={restoringVersion}
                    className="btn-terminal py-2 px-4 text-xs flex items-center gap-2"
                  >
                    {restoringVersion ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    RESTORE THIS VERSION
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-400 mb-4">
                  {new Date(selectedVersion.timestamp).toLocaleString()} by {selectedVersion.userName}
                </div>

                {/* Diff Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-matrix/10 border border-matrix/30">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-matrix" />
                      <div className="font-mono text-[10px] text-matrix">ADDED</div>
                    </div>
                    <div className="font-display text-lg text-matrix">{diff.summary.added}</div>
                  </div>
                  <div className="p-3 bg-alert/10 border border-alert/30">
                    <div className="flex items-center gap-2">
                      <MinusCircle className="w-4 h-4 text-alert" />
                      <div className="font-mono text-[10px] text-alert">REMOVED</div>
                    </div>
                    <div className="font-display text-lg text-alert">{diff.summary.removed}</div>
                  </div>
                  <div className="p-3 bg-signal/10 border border-signal/30">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-signal" />
                      <div className="font-mono text-[10px] text-signal">MODIFIED</div>
                    </div>
                    <div className="font-display text-lg text-signal">{diff.summary.modified}</div>
                  </div>
                </div>

                {/* Diff Details */}
                {hasChanges ? (
                  <div className="space-y-3 max-h-80 overflow-auto">
                    {/* Added Features */}
                    {diff.features.added.map(feature => (
                      <div key={feature.id} className="p-3 bg-matrix/5 border-l-2 border-matrix">
                        <div className="flex items-center gap-2 mb-1">
                          <PlusCircle className="w-3 h-3 text-matrix" />
                          <span className="font-mono text-xs text-matrix">+ FEATURE: {feature.name}</span>
                        </div>
                        <p className="font-mono text-[10px] text-gray-500 ml-5">{feature.tasks?.length || 0} tasks</p>
                      </div>
                    ))}

                    {/* Removed Features */}
                    {diff.features.removed.map(feature => (
                      <div key={feature.id} className="p-3 bg-alert/5 border-l-2 border-alert">
                        <div className="flex items-center gap-2 mb-1">
                          <MinusCircle className="w-3 h-3 text-alert" />
                          <span className="font-mono text-xs text-alert">- FEATURE: {feature.name}</span>
                        </div>
                        <p className="font-mono text-[10px] text-gray-500 ml-5">{feature.tasks?.length || 0} tasks</p>
                      </div>
                    ))}

                    {/* Added Tasks */}
                    {diff.tasks.added.map(task => (
                      <div key={task.id} className="p-2 bg-matrix/5 border-l-2 border-matrix ml-4">
                        <div className="flex items-center gap-2">
                          <PlusCircle className="w-3 h-3 text-matrix" />
                          <span className="font-mono text-[11px] text-matrix">+ {task.name}</span>
                          <span className="font-mono text-[9px] text-gray-600">({task.featureName})</span>
                        </div>
                      </div>
                    ))}

                    {/* Removed Tasks */}
                    {diff.tasks.removed.map(task => (
                      <div key={task.id} className="p-2 bg-alert/5 border-l-2 border-alert ml-4">
                        <div className="flex items-center gap-2">
                          <MinusCircle className="w-3 h-3 text-alert" />
                          <span className="font-mono text-[11px] text-alert line-through">- {task.name}</span>
                          <span className="font-mono text-[9px] text-gray-600">({task.featureName})</span>
                        </div>
                      </div>
                    ))}

                    {/* Status Changes */}
                    {diff.tasks.statusChanged.map(({ task, featureName, oldStatus, newStatus }) => (
                      <div key={task.id} className="p-2 bg-signal/5 border-l-2 border-signal ml-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ArrowRight className="w-3 h-3 text-signal" />
                          <span className="font-mono text-[11px] text-white">{task.name}</span>
                          <span className="font-mono text-[9px] text-gray-600">({featureName})</span>
                        </div>
                        <div className="flex items-center gap-2 ml-5 mt-1">
                          <span className={`px-2 py-0.5 text-[9px] font-mono ${
                            oldStatus === 'completed' ? 'bg-matrix/20 text-matrix' :
                            oldStatus === 'in_progress' ? 'bg-signal/20 text-signal' :
                            'bg-gray-700 text-gray-400'
                          }`}>{oldStatus}</span>
                          <ArrowRight className="w-3 h-3 text-gray-500" />
                          <span className={`px-2 py-0.5 text-[9px] font-mono ${
                            newStatus === 'completed' ? 'bg-matrix/20 text-matrix' :
                            newStatus === 'in_progress' ? 'bg-signal/20 text-signal' :
                            'bg-gray-700 text-gray-400'
                          }`}>{newStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed border-white/10">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p className="font-mono text-xs text-gray-600">NO CHANGES</p>
                    <p className="font-mono text-[10px] text-gray-700 mt-1">Current roadmap matches this version</p>
                  </div>
                )}

                {/* Raw JSON Toggle */}
                <details className="group mt-4">
                  <summary className="font-mono text-[10px] text-gray-600 cursor-pointer hover:text-gray-400">
                    View raw JSON
                  </summary>
                  <div className="mt-2 p-3 bg-void-100 border border-white/5 max-h-48 overflow-auto">
                    <pre className="font-mono text-[10px] text-gray-500 whitespace-pre-wrap">
                      {JSON.stringify(selectedVersion.snapshot, null, 2)}
                    </pre>
                  </div>
                </details>

                <button
                  onClick={() => setSelectedVersion(null)}
                  className="mt-3 w-full py-2 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all font-mono text-xs"
                >
                  CLOSE PREVIEW
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* USERS TAB (Admin only) */}
      {settingsSubTab === 'users' && isAdmin && (
        <div className="space-y-5">
          {/* Auth Settings */}
          <div className="terminal-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm text-white">Authentication Required</h3>
                <p className="font-mono text-[10px] text-gray-600">Disable to allow anonymous access</p>
              </div>
              <button
                onClick={() => updateAuthSettings({ requireAuth: !authSettings.requireAuth })}
                className={`w-14 h-7 rounded-full transition-all relative ${authSettings.requireAuth ? 'bg-matrix' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${authSettings.requireAuth ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Add User */}
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-white mb-4">ADD NEW USER</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name *"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="input-terminal px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="input-terminal px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Password *"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="input-terminal px-3 py-2 text-sm"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="input-terminal px-3 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {userError && (
              <div className="mb-3 p-2 border border-alert/30 bg-alert/5 font-mono text-xs text-alert">
                {userError}
              </div>
            )}
            <button
              onClick={createUser}
              disabled={!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()}
              className="btn-terminal py-2 px-4 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 inline mr-1" /> CREATE USER
            </button>
          </div>

          {/* Users List */}
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-white mb-4">REGISTERED USERS ({users.length})</h3>
            {loadingUsers ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-600" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-void-100 border border-white/5">
                    <div className={`w-10 h-10 border flex items-center justify-center font-display text-sm ${
                      user.role === 'admin' ? 'border-alert/30 bg-alert/10 text-alert' : 'border-cyber/30 bg-cyber/10 text-cyber'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-sans text-sm text-white flex items-center gap-2">
                        {user.name}
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 ${
                          user.role === 'admin' ? 'bg-alert/20 text-alert' : 'bg-cyber/20 text-cyber'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-gray-500">{user.email}</div>
                    </div>
                    <div className="font-mono text-[9px] text-gray-700 hidden sm:block">
                      {user.lastLogin ? `Last: ${new Date(user.lastLogin).toLocaleDateString()}` : 'Never logged in'}
                    </div>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-gray-600 hover:text-alert transition-all"
                      title="Delete user"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-white/10">
                <User className="w-10 h-10 mx-auto mb-3 text-gray-800" />
                <p className="font-mono text-xs text-gray-600">NO USERS FOUND</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILES TAB */}
      {settingsSubTab === 'files' && (
        <div className="space-y-5">
          {/* Deploy */}
          <div className="terminal-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="led led-green" />
              <div>
                <h3 className="font-mono text-sm text-matrix tracking-wider">DEPLOY CONFIG</h3>
                <p className="font-mono text-[10px] text-gray-600">Copy files to project root</p>
              </div>
            </div>

            {projectInfo && (
              <div className="mb-4 p-3 border border-matrix/20 bg-matrix/5 font-mono text-[11px]">
                <span className="text-gray-500">PROJECT:</span> <span className="text-matrix">{projectInfo.projectRoot}</span>
              </div>
            )}

            <label className="flex items-center gap-2 font-mono text-[11px] text-gray-500 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={deployBoth}
                onChange={(e) => setDeployBoth(e.target.checked)}
                className="w-4 h-4 bg-void-100 border border-white/20 accent-matrix"
              />
              Also create .cursorrules (for Cursor IDE)
            </label>

            <button onClick={deployToProject} disabled={deploying} className="btn-terminal flex items-center gap-2">
              {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              DEPLOY FILES
            </button>

            {deployMessage && (
              <div className={`mt-4 p-3 border font-mono text-[11px] ${
                deployMessage.type === 'success' ? 'border-matrix/30 text-matrix bg-matrix/5' :
                deployMessage.type === 'error' ? 'border-alert/30 text-alert bg-alert/5' :
                'border-cyber/30 text-cyber bg-cyber/5'
              }`}>
                <p>{deployMessage.text}</p>
                {deployMessage.files && (
                  <ul className="mt-2 space-y-1 text-gray-500">
                    {deployMessage.files.map((file, idx) => <li key={idx}>✓ {file}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* .clinerules */}
          <div className="terminal-card">
            <button
              onClick={() => setClineruleExpanded(!clineruleExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-4 h-4 text-cyber" />
                <div className="text-left">
                  <h3 className="font-mono text-sm text-white">.clinerules</h3>
                  <p className="font-mono text-[10px] text-gray-600">Rules for Claude, Cursor, Cline</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${clineruleExpanded ? 'rotate-180' : ''}`} />
            </button>

            {clineruleExpanded && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="flex justify-end gap-2 py-3">
                  <button onClick={() => downloadFile(clinerules, '.clinerules')} className="p-2 border border-white/10 text-gray-500 hover:text-matrix hover:border-matrix/30 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`p-2 border transition-all ${editMode ? 'border-matrix/30 text-matrix bg-matrix/10' : 'border-white/10 text-gray-500 hover:text-matrix hover:border-matrix/30'}`}
                  >
                    {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyToClipboard(clinerules, 'clinerules')} className="p-2 border border-white/10 text-gray-500 hover:text-matrix hover:border-matrix/30 transition-all">
                    {copiedItem === 'clinerules' ? <Check className="w-4 h-4 text-matrix" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {editMode ? (
                  <textarea
                    value={clinerules}
                    onChange={(e) => setClinerules(e.target.value)}
                    className="w-full h-[400px] input-terminal p-4 text-xs resize-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="bg-void-100 border border-white/5 p-4 max-h-[400px] overflow-y-auto">
                    <pre className="font-mono text-[11px] text-gray-400 whitespace-pre-wrap">{clinerules}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* roadmap.json */}
          <div className="terminal-card">
            <button
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-signal" />
                <div className="text-left">
                  <h3 className="font-mono text-sm text-white">roadmap.json</h3>
                  <p className="font-mono text-[10px] text-gray-600">Project structure & state</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${jsonExpanded ? 'rotate-180' : ''}`} />
            </button>

            {jsonExpanded && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="flex justify-end gap-2 py-3">
                  <button onClick={() => downloadFile(JSON.stringify(roadmap, null, 2), 'roadmap.json')} className="p-2 border border-white/10 text-gray-500 hover:text-signal hover:border-signal/30 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  {jsonEditMode && (
                    <>
                      <button onClick={formatJson} className="p-2 border border-white/10 text-gray-500 hover:text-signal hover:border-signal/30 transition-all">
                        <Code className="w-4 h-4" />
                      </button>
                      <button onClick={validateAndApplyJson} className="px-3 py-2 border border-matrix/30 text-matrix bg-matrix/10 hover:bg-matrix/20 transition-all font-mono text-[10px]">
                        APPLY
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (jsonEditMode) {
                        setJsonContent(JSON.stringify(roadmap, null, 2));
                        setJsonError(null);
                      }
                      setJsonEditMode(!jsonEditMode);
                    }}
                    className={`p-2 border transition-all ${jsonEditMode ? 'border-alert/30 text-alert' : 'border-white/10 text-gray-500 hover:text-signal hover:border-signal/30'}`}
                  >
                    {jsonEditMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyToClipboard(JSON.stringify(roadmap, null, 2), 'json')} className="p-2 border border-white/10 text-gray-500 hover:text-signal hover:border-signal/30 transition-all">
                    {copiedItem === 'json' ? <Check className="w-4 h-4 text-matrix" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {jsonError && (
                  <div className="mb-3 p-3 border border-alert/30 bg-alert/5 text-alert font-mono text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {jsonError}
                  </div>
                )}

                {jsonEditMode ? (
                  <>
                    <textarea
                      value={jsonContent}
                      onChange={(e) => { setJsonContent(e.target.value); setJsonError(null); }}
                      className="w-full h-[400px] input-terminal p-4 text-xs resize-none"
                      spellCheck={false}
                    />
                    <p className="mt-2 font-mono text-[10px] text-gray-600">
                      Edit JSON → "APPLY" → "SAVE" in sidebar
                    </p>
                  </>
                ) : (
                  <div className="bg-void-100 border border-white/5 p-4 max-h-[400px] overflow-auto">
                    <pre className="font-mono text-[11px] text-gray-400 whitespace-pre">{JSON.stringify(roadmap, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LANGUAGE TAB */}
      {settingsSubTab === 'language' && (
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-white mb-2">{t('settings.language')}</h3>
          <p className="font-mono text-[10px] text-gray-600 mb-6">
            {language === 'es' ? 'Selecciona el idioma de la interfaz' : 'Select interface language'}
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Spanish */}
            <button
              onClick={() => changeLanguage('es')}
              className={`p-5 border transition-all text-left ${
                language === 'es'
                  ? 'border-matrix/50 bg-matrix/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 border flex items-center justify-center font-display text-lg ${
                  language === 'es' ? 'border-matrix/50 bg-matrix/10 text-matrix' : 'border-gray-700 text-gray-500'
                }`}>
                  ES
                </div>
                <div>
                  <div className={`font-mono text-sm ${language === 'es' ? 'text-matrix' : 'text-white'}`}>
                    Español
                  </div>
                  <div className="font-mono text-[10px] text-gray-500">Spanish</div>
                </div>
              </div>
              {language === 'es' && (
                <div className="flex items-center gap-2 text-matrix">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-mono text-[10px]">ACTIVO</span>
                </div>
              )}
            </button>

            {/* English */}
            <button
              onClick={() => changeLanguage('en')}
              className={`p-5 border transition-all text-left ${
                language === 'en'
                  ? 'border-cyber/50 bg-cyber/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 border flex items-center justify-center font-display text-lg ${
                  language === 'en' ? 'border-cyber/50 bg-cyber/10 text-cyber' : 'border-gray-700 text-gray-500'
                }`}>
                  EN
                </div>
                <div>
                  <div className={`font-mono text-sm ${language === 'en' ? 'text-cyber' : 'text-white'}`}>
                    English
                  </div>
                  <div className="font-mono text-[10px] text-gray-500">Inglés</div>
                </div>
              </div>
              {language === 'en' && (
                <div className="flex items-center gap-2 text-cyber">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-mono text-[10px]">ACTIVE</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ HELP TAB ============
function HelpTab({ t, language }) {
  const [activeSection, setActiveSection] = useState('templates');
  const [copiedPath, setCopiedPath] = useState(null);

  const sections = [
    { id: 'templates', label: t('help.templates'), icon: FileCode },
    { id: 'commits', label: t('help.commits'), icon: GitCommit },
    { id: 'ai', label: t('help.aiWorkflow'), icon: Bot },
    { id: 'troubleshooting', label: t('help.debug'), icon: Wrench },
  ];

  const copyPath = (path) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs tracking-wider border transition-all ${
                activeSection === section.id
                  ? 'border-matrix text-matrix bg-matrix/10'
                  : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Templates */}
      {activeSection === 'templates' && (
        <div className="space-y-6">
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-matrix tracking-wider mb-4">{t('help.referenceFiles')}</h3>
            <p className="font-mono text-[11px] text-gray-500 mb-4">{t('help.sharePaths')}</p>
            <div className="space-y-2">
              {[
                { path: 'roadmap-kit/templates/clinerules.template', label: t('help.clinerulesTpl'), color: 'text-cyber' },
                { path: 'roadmap-kit/templates/roadmap.template.json', label: t('help.roadmapTpl'), color: 'text-signal' },
                { path: 'roadmap-kit/examples/roadmap-ecommerce.json', label: t('help.exampleEcommerce'), color: 'text-matrix' },
                { path: 'roadmap-kit/examples/roadmap-api-rest.json', label: t('help.exampleApi'), color: 'text-cyber' },
                { path: 'roadmap-kit/docs/TECHNICAL_DEBT_GUIDE.md', label: t('help.debtGuide'), color: 'text-alert' },
              ].map((item) => (
                <div key={item.path} className="flex items-center justify-between p-3 bg-void-100 border border-white/5">
                  <div>
                    <p className={`font-mono text-[10px] ${item.color} tracking-wider`}>{item.label}</p>
                    <code className="font-mono text-[11px] text-gray-500">{item.path}</code>
                  </div>
                  <button onClick={() => copyPath(item.path)} className="p-2 hover:bg-white/5 transition-all">
                    {copiedPath === item.path ? <Check className="w-4 h-4 text-matrix" /> : <Copy className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-cyber tracking-wider mb-4">{t('help.aiInstructions')}</h3>
            <div className="bg-void-100 border border-white/5 p-4 font-mono text-[11px] text-gray-400 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{`Read the example files in:
- roadmap-kit/examples/roadmap-ecommerce.json
- roadmap-kit/examples/roadmap-api-rest.json

Then generate a roadmap.json for my project following this structure:

{
  "project_info": {
    "name": "Project Name",
    "version": "1.0.0",
    "description": "Brief description",
    "purpose": "Main objective",
    "stack": ["Tech1", "Tech2"],
    "architecture": "Architecture description",
    "conventions": { ... },
    "shared_resources": { ... }
  },
  "features": [
    {
      "id": "feature-id",
      "name": "Name",
      "description": "Description",
      "status": "pending",
      "progress": 0,
      "priority": "high|medium|low",
      "tasks": [ ... ]
    }
  ]
}`}</pre>
            </div>
          </div>

          <div className="terminal-card p-5 border-matrix/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-sm text-matrix">{t('help.quickPrompt')}</h4>
              <button
                onClick={() => copyPath(`Read the files:
- roadmap-kit/templates/clinerules.template
- roadmap-kit/examples/roadmap-ecommerce.json
- roadmap-kit/docs/TECHNICAL_DEBT_GUIDE.md

Then help me create/improve the roadmap.json for my project following that format.`)}
                className="px-3 py-1.5 border border-matrix/30 text-matrix font-mono text-[10px] hover:bg-matrix/10 transition-all"
              >
                {copiedPath?.includes('Read the files') ? t('common.copied').toUpperCase() : t('help.copyPrompt')}
              </button>
            </div>
            <div className="bg-void-100 border border-white/5 p-3 font-mono text-[11px] text-gray-500">
              <p>Read the files:</p>
              <p className="text-cyber">- roadmap-kit/templates/clinerules.template</p>
              <p className="text-matrix">- roadmap-kit/examples/roadmap-ecommerce.json</p>
              <p className="text-alert">- roadmap-kit/docs/TECHNICAL_DEBT_GUIDE.md</p>
              <p className="mt-2">Then help me create/improve the roadmap.json...</p>
            </div>
          </div>
        </div>
      )}

      {/* Commits */}
      {activeSection === 'commits' && (
        <div className="space-y-6">
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-matrix tracking-wider mb-4">{t('help.commitFormat')}</h3>
            <p className="font-mono text-[11px] text-gray-500 mb-4">{t('help.commitFormatDesc')}</p>
            <div className="bg-void-100 border border-white/5 p-4 mb-6">
              <code className="font-mono text-sm text-cyber">git commit -m "[task:ID] [status:STATUS] Description"</code>
            </div>

            <h4 className="font-mono text-xs text-gray-400 mb-3">{t('help.availableTags')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-gray-500">{t('help.tag')}</th>
                    <th className="text-left py-2 text-gray-500">{t('help.values')}</th>
                    <th className="text-left py-2 text-gray-500">{t('help.example')}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-white/5">
                    <td className="py-2"><code className="text-cyber">[task:id]</code></td>
                    <td className="py-2">Task ID</td>
                    <td className="py-2"><code className="text-matrix">[task:auth-login]</code></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2"><code className="text-cyber">[status:x]</code></td>
                    <td className="py-2">pending, in_progress, completed</td>
                    <td className="py-2"><code className="text-matrix">[status:completed]</code></td>
                  </tr>
                  <tr>
                    <td className="py-2"><code className="text-cyber">[debt:...]</code></td>
                    <td className="py-2">desc|severity|effort</td>
                    <td className="py-2"><code className="text-matrix">[debt:No validation|high|1h]</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="terminal-card p-5">
            <h4 className="font-mono text-xs text-gray-400 mb-4">{t('help.examples')}</h4>
            <div className="space-y-3">
              {[
                { comment: t('help.completeTask'), cmd: 'git commit -m "[task:auth-login] [status:completed] Implement JWT login"' },
                { comment: t('help.taskInProgress'), cmd: 'git commit -m "[task:user-list] [status:in_progress] Add basic listing"' },
                { comment: t('help.withDebt'), cmd: 'git commit -m "[task:api-users] [status:completed] [debt:No tests|medium|2h] CRUD users"' },
              ].map((item, idx) => (
                <div key={idx} className="bg-void-100 border border-white/5 p-3">
                  <p className="font-mono text-[10px] text-gray-600 mb-1">{item.comment}</p>
                  <code className="font-mono text-[11px] text-cyber">{item.cmd}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal-card p-5 border-cyber/20">
            <h4 className="font-mono text-sm text-cyber tracking-wider mb-3">{t('help.syncWithGit')}</h4>
            <p className="font-mono text-[11px] text-gray-500 mb-3">{t('help.afterCommits')}</p>
            <div className="bg-void-100 border border-white/5 p-3">
              <code className="font-mono text-sm text-matrix">node roadmap-kit/scanner.js</code>
            </div>
            <p className="font-mono text-[10px] text-gray-600 mt-3">
              {t('help.updatesInfo')}
            </p>
          </div>
        </div>
      )}

      {/* AI Workflow */}
      {activeSection === 'ai' && (
        <div className="space-y-6">
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-matrix tracking-wider mb-4">{t('help.recommendedWorkflow')}</h3>
            <div className="space-y-2">
              {[
                { step: '01', text: t('help.step01') },
                { step: '02', text: t('help.step02') },
                { step: '03', text: t('help.step03') },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-3 bg-void-100 border border-white/5">
                  <span className="font-display text-lg text-matrix">{item.step}</span>
                  <span className="font-mono text-xs text-gray-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="terminal-card p-5 border-matrix/20">
              <h4 className="font-mono text-xs text-matrix tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {t('help.aiMustDo')}
              </h4>
              <ul className="space-y-2 font-mono text-[11px] text-gray-400">
                {t('help.mustDoList').map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-matrix">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="terminal-card p-5 border-alert/20">
              <h4 className="font-mono text-xs text-alert tracking-wider mb-4 flex items-center gap-2">
                <X className="w-4 h-4" /> {t('help.aiMustNot')}
              </h4>
              <ul className="space-y-2 font-mono text-[11px] text-gray-400">
                {t('help.mustNotList').map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-alert">✗</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting */}
      {activeSection === 'troubleshooting' && (
        <div className="space-y-4">
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-signal tracking-wider mb-4">{t('help.troubleshooting')}</h3>
            <div className="space-y-4">
              {[
                { title: '"Cannot load roadmap.json"', solutions: ['Verify roadmap-kit/roadmap.json exists', 'Check server is running on correct port', 'Restart: npm run dev'] },
                { title: 'Changes not saving', solutions: ['Click "SAVE" in sidebar', 'Check server has write permissions', 'Check browser console for errors'] },
                { title: 'Deploy not working', solutions: ['Check project path in Settings', 'Use "Download" and copy manually', 'Verify write permissions'] },
                { title: 'AI not following rules', solutions: ['Verify .clinerules in project root', 'Regenerate from Settings', 'Restart AI session'] },
                { title: 'Port in use error', solutions: ['Run: lsof -ti:3001 | xargs kill -9'] },
              ].map((item, idx) => (
                <div key={idx} className="bg-void-100 border border-white/5 p-4">
                  <h4 className="font-mono text-xs text-white mb-2">{item.title}</h4>
                  <ul className="font-mono text-[11px] text-gray-500 space-y-1">
                    {item.solutions.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal-card p-5">
            <h4 className="font-mono text-xs text-gray-400 mb-4">{t('help.fileSummary')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-gray-500">{t('help.file')}</th>
                    <th className="text-left py-2 text-gray-500">{t('help.location')}</th>
                    <th className="text-left py-2 text-gray-500">{t('help.purposeCol')}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-white/5">
                    <td className="py-2"><code className="text-cyber">roadmap.json</code></td>
                    <td className="py-2">roadmap-kit/</td>
                    <td className="py-2">Project state</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2"><code className="text-cyber">.clinerules</code></td>
                    <td className="py-2">Project root</td>
                    <td className="py-2">AI rules</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2"><code className="text-cyber">.cursorrules</code></td>
                    <td className="py-2">Project root</td>
                    <td className="py-2">Cursor rules</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code className="text-cyber">.env</code></td>
                    <td className="py-2">roadmap-kit/</td>
                    <td className="py-2">Auth credentials</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SETUP TAB (AI-Powered) ============
function SetupTab({ roadmap, setRoadmap, setHasChanges, loadRoadmap, t, language }) {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasKey: false, maskedKey: null });
  const [claudeCodeStatus, setClaudeCodeStatus] = useState({ available: false, version: null, checking: true });
  const [generationMode, setGenerationMode] = useState('claude-code');
  const [requirements, setRequirements] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // Project scan state
  const [projectScan, setProjectScan] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanExpanded, setScanExpanded] = useState(false);

  // Check if roadmap has real content
  const hasExistingRoadmap = roadmap?.features?.length > 0 &&
    roadmap.features.some(f => f.tasks?.length > 0);

  // Validate roadmap structure and completeness
  const validateRoadmap = useMemo(() => {
    const isEs = language === 'es';
    if (!roadmap) return { valid: false, issues: [isEs ? 'No se encontró roadmap' : 'No roadmap found'], score: 0 };

    const issues = [];
    const warnings = [];
    let score = 0;
    const maxScore = 100;

    // Check project_info
    if (!roadmap.project_info) {
      issues.push(isEs ? 'Falta la sección project_info' : 'Missing project_info section');
    } else {
      const info = roadmap.project_info;

      // Required fields
      if (!info.name) issues.push(isEs ? 'El nombre del proyecto es requerido' : 'Project name is required');
      else score += 10;

      if (!info.description) warnings.push(isEs ? 'Se recomienda añadir descripción del proyecto' : 'Project description is recommended');
      else score += 5;

      if (!info.stack || info.stack.length === 0) {
        warnings.push(isEs ? 'Stack tecnológico no definido' : 'Tech stack not defined');
      } else score += 10;

      if (!info.architecture) warnings.push(isEs ? 'Arquitectura no documentada' : 'Architecture not documented');
      else score += 5;

      // Conventions
      if (!info.conventions || Object.keys(info.conventions).length === 0) {
        warnings.push(isEs ? 'Convenciones de código no definidas' : 'Coding conventions not defined');
      } else score += 10;

      // Shared resources
      if (!info.shared_resources) {
        warnings.push(isEs ? 'Falta sección de recursos compartidos' : 'Shared resources section missing');
      } else {
        const res = info.shared_resources;
        if (!res.ui_components || res.ui_components.length === 0) warnings.push(isEs ? 'Sin componentes UI documentados' : 'No UI components documented');
        else score += 5;
        if (!res.utilities || res.utilities.length === 0) warnings.push(isEs ? 'Sin utilidades documentadas' : 'No utilities documented');
        else score += 5;
        if (!res.database_tables || res.database_tables.length === 0) warnings.push(isEs ? 'Sin tablas de BD documentadas' : 'No database tables documented');
        else score += 5;
      }

      // Check if project uses database but no tables defined
      const usesDb = info.stack?.some(t =>
        ['postgresql', 'mysql', 'mongodb', 'sqlite', 'prisma', 'supabase', 'firebase'].some(db =>
          t.toLowerCase().includes(db)
        )
      );
      if (usesDb && (!info.shared_resources?.database_tables || info.shared_resources.database_tables.length === 0)) {
        issues.push(isEs ? 'El proyecto usa BD pero no tiene tablas documentadas' : 'Project uses database but no tables are documented');
      }
    }

    // Check features
    if (!roadmap.features || roadmap.features.length === 0) {
      issues.push(isEs ? 'No hay features definidas' : 'No features defined');
    } else {
      score += 15;

      // Check each feature has required fields
      const incompleteFeatures = roadmap.features.filter(f => !f.name || !f.description);
      if (incompleteFeatures.length > 0) {
        warnings.push(isEs ? `${incompleteFeatures.length} feature(s) sin nombre o descripción` : `${incompleteFeatures.length} feature(s) missing name or description`);
      }

      // Check tasks
      const totalTasks = roadmap.features.reduce((acc, f) => acc + (f.tasks?.length || 0), 0);
      if (totalTasks === 0) {
        issues.push(isEs ? 'No hay tareas definidas en ninguna feature' : 'No tasks defined in any feature');
      } else {
        score += 20;

        // Check task completeness
        const incompleteTasks = roadmap.features.flatMap(f =>
          (f.tasks || []).filter(t => !t.name || !t.description)
        );
        if (incompleteTasks.length > 0) {
          warnings.push(isEs ? `${incompleteTasks.length} tarea(s) sin nombre o descripción` : `${incompleteTasks.length} task(s) missing name or description`);
        }

        // Check for affected_files
        const tasksWithFiles = roadmap.features.flatMap(f =>
          (f.tasks || []).filter(t => t.affected_files && t.affected_files.length > 0)
        );
        if (tasksWithFiles.length > totalTasks * 0.5) {
          score += 10;
        } else {
          warnings.push(isEs ? 'La mayoría de tareas no tienen affected_files' : 'Most tasks are missing affected_files');
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      score: Math.min(score, maxScore),
      hasProject: !!roadmap.project_info?.name,
      hasFeatures: (roadmap.features?.length || 0) > 0,
      hasTasks: roadmap.features?.some(f => f.tasks?.length > 0),
      totalFeatures: roadmap.features?.length || 0,
      totalTasks: roadmap.features?.reduce((acc, f) => acc + (f.tasks?.length || 0), 0) || 0
    };
  }, [roadmap, language]);

  // Load status and scan project on mount
  useEffect(() => {
    // Check API key status
    fetch('/api/api-key-status')
      .then(res => res.json())
      .then(data => setApiKeyStatus(data))
      .catch(() => {});

    // Check Claude Code CLI status
    fetch('/api/claude-code-status')
      .then(res => res.json())
      .then(data => {
        setClaudeCodeStatus({ ...data, checking: false });
        if (data.available) {
          setGenerationMode('claude-code');
          setActiveStep(2);
        }
      })
      .catch(() => setClaudeCodeStatus({ available: false, checking: false }));

    // Scan project automatically
    scanProject();
  }, []);

  // Scan project function
  const scanProject = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan-project');
      if (res.ok) {
        const data = await res.json();
        setProjectScan(data);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
    setScanning(false);
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    try {
      const res = await fetch('/api/save-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      if (res.ok) {
        setApiKeyStatus({ hasKey: true, maskedKey: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` });
        setApiKey('');
        setActiveStep(2);
      } else {
        throw new Error('Error saving API key');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const analyzeWithAI = async () => {
    if (!requirements.trim()) {
      setError(language === 'es' ? 'Por favor describe los requerimientos o características que quieres implementar' : 'Please describe the requirements or features you want to implement');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements,
          projectScan,
          existingRoadmap: roadmap,
          useClaudeCode: generationMode === 'claude-code'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error analyzing project');
      }

      setGeneratedResult(data);
      setActiveStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const applyGenerated = async () => {
    if (!generatedResult) return;

    try {
      // Apply roadmap
      setRoadmap(generatedResult.roadmap);
      setHasChanges(true);

      // Deploy clinerules
      await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinerules: generatedResult.clinerules,
          roadmap: generatedResult.roadmap
        })
      });

      setActiveStep(4);
    } catch (err) {
      setError(err.message);
    }
  };

  // Check if setup is complete (valid roadmap with good score)
  const isSetupComplete = validateRoadmap.valid && validateRoadmap.score >= 60;

  // If setup is complete and not in reconfigure mode, show complete state
  if (isSetupComplete && activeStep !== 2 && !generatedResult) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Setup Complete Header */}
        <div className="terminal-card p-8 border-matrix/50 text-center">
          <div className="w-20 h-20 mx-auto border-2 border-matrix/50 flex items-center justify-center mb-6 glow-matrix">
            <CheckCircle2 className="w-10 h-10 text-matrix" />
          </div>
          <h2 className="font-display text-2xl text-matrix tracking-wider mb-2">
            {t ? t('setup.setupComplete') : 'SETUP COMPLETE'}
          </h2>
          <p className="font-mono text-xs text-gray-500">
            {t ? t('setup.setupCompleteDesc') : 'Your roadmap is configured and ready to use'}
          </p>
        </div>

        {/* Roadmap Status Card */}
        <div className="terminal-card p-5">
          <h3 className="font-mono text-sm text-white tracking-wider mb-4">
            {t ? t('setup.roadmapStatus') : 'ROADMAP STATUS'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-void-100 border border-matrix/20">
              <div className="font-mono text-[9px] text-gray-600">{t ? t('stats.total').toUpperCase() : 'FEATURES'}</div>
              <div className="font-display text-2xl text-matrix">{validateRoadmap.totalFeatures}</div>
            </div>
            <div className="p-4 bg-void-100 border border-cyber/20">
              <div className="font-mono text-[9px] text-gray-600">TASKS</div>
              <div className="font-display text-2xl text-cyber">{validateRoadmap.totalTasks}</div>
            </div>
            <div className="p-4 bg-void-100 border border-signal/20">
              <div className="font-mono text-[9px] text-gray-600">{language === 'es' ? 'PROGRESO' : 'PROGRESS'}</div>
              <div className="font-display text-2xl text-signal">{roadmap?.project_info?.total_progress || 0}%</div>
            </div>
            <div className="p-4 bg-void-100 border border-white/10">
              <div className="font-mono text-[9px] text-gray-600">{language === 'es' ? 'PUNTUACIÓN' : 'SCORE'}</div>
              <div className="font-display text-2xl text-white">{validateRoadmap.score}%</div>
            </div>
          </div>

          {/* Warnings if any */}
          {validateRoadmap.warnings.length > 0 && (
            <details className="mb-4 p-3 bg-signal/5 border border-signal/20">
              <summary className="font-mono text-[10px] text-signal cursor-pointer">
                {validateRoadmap.warnings.length} {t ? t('setup.warnings').toLowerCase() : 'warnings'} ({language === 'es' ? 'click para ver' : 'click to view'})
              </summary>
              <ul className="mt-2 space-y-1">
                {validateRoadmap.warnings.map((w, idx) => (
                  <li key={idx} className="font-mono text-[10px] text-signal/70 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => window.location.hash = '#features'}
              className="btn-terminal flex-1 py-3 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {t ? t('setup.goToDashboard') : 'GO TO DASHBOARD'}
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className="px-6 py-3 border border-white/10 text-gray-500 font-mono text-xs hover:text-white hover:border-white/30 transition-all"
            >
              {t ? t('setup.reconfigure') : 'RECONFIGURE'}
            </button>
          </div>
        </div>

        {/* Project Info Summary */}
        {roadmap?.project_info && (
          <div className="terminal-card p-5">
            <h3 className="font-mono text-sm text-cyber tracking-wider mb-4"># {roadmap.project_info.name || 'PROJECT'}</h3>
            {roadmap.project_info.description && (
              <p className="font-mono text-xs text-gray-400 mb-4">{roadmap.project_info.description}</p>
            )}
            {roadmap.project_info.stack?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {roadmap.project_info.stack.map((tech, idx) => (
                  <span key={idx} className="font-mono text-[10px] px-2 py-1 bg-matrix/10 text-matrix border border-matrix/30">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="terminal-card p-5 border-matrix/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border border-matrix/50 flex items-center justify-center glow-matrix">
            <Sparkles className="w-7 h-7 text-matrix" />
          </div>
          <div>
            <h2 className="font-display text-xl text-matrix tracking-wider">{t ? t('setup.title') : 'AI SETUP WIZARD'}</h2>
            <p className="font-mono text-xs text-gray-500 mt-1">{t ? t('setup.subtitle') : 'Describe your project and Claude will generate the configuration'}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: t ? t('setup.stepConnect') : 'CONNECT' },
          { num: 2, label: t ? t('setup.stepDescribe') : 'DESCRIBE' },
          { num: 3, label: t ? t('setup.stepReview') : 'REVIEW' },
          { num: 4, label: t ? t('setup.stepDone') : 'DONE' }
        ].map((step, idx) => (
          <React.Fragment key={step.num}>
            <button
              onClick={() => step.num <= activeStep && setActiveStep(step.num)}
              className={`flex items-center gap-2 px-4 py-2 border transition-all ${
                activeStep === step.num
                  ? 'border-matrix text-matrix bg-matrix/10'
                  : activeStep > step.num
                  ? 'border-matrix/30 text-matrix/60'
                  : 'border-white/10 text-gray-600'
              }`}
            >
              <span className="font-display text-lg">{step.num}</span>
              <span className="font-mono text-[10px] tracking-wider hidden sm:block">{step.label}</span>
            </button>
            {idx < 3 && <div className={`flex-1 h-px ${activeStep > step.num ? 'bg-matrix/50' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-alert/30 bg-alert/5 text-alert font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Choose Connection Mode */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="terminal-card p-6">
            <h3 className="font-mono text-sm text-matrix tracking-wider mb-4"># {t ? t('setup.chooseConnection') : 'CHOOSE CONNECTION MODE'}</h3>
            <p className="font-mono text-xs text-gray-500 mb-6">
              {t ? t('setup.chooseConnectionDesc') : 'Choose how to connect with Claude to generate your project configuration.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Claude Code (Subscription) */}
              <button
                onClick={() => { setGenerationMode('claude-code'); if (claudeCodeStatus.available) setActiveStep(2); }}
                className={`p-5 border text-left transition-all ${
                  generationMode === 'claude-code'
                    ? 'border-matrix bg-matrix/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`led ${claudeCodeStatus.available ? 'led-green' : claudeCodeStatus.checking ? 'led-amber' : 'led-red'}`} />
                  <span className="font-mono text-sm text-white">CLAUDE CODE</span>
                  <span className="font-mono text-[9px] px-2 py-0.5 bg-matrix/20 text-matrix border border-matrix/30">
                    {t ? t('setup.recommended') : 'RECOMMENDED'}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-gray-500 mb-3">
                  {language === 'es' ? 'Usa tu suscripción de Claude (Max/Pro) a través de Claude Code CLI. Sin coste adicional.' : 'Use your Claude subscription (Max/Pro) via Claude Code CLI. No additional cost.'}
                </p>
                {claudeCodeStatus.checking ? (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-signal">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {language === 'es' ? 'Verificando Claude Code...' : 'Verifying Claude Code...'}
                  </div>
                ) : claudeCodeStatus.available ? (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-matrix">
                    <CheckCircle2 className="w-3 h-3" />
                    Claude Code {t ? t('setup.available').toLowerCase() : 'available'} {claudeCodeStatus.version && `(${claudeCodeStatus.version})`}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-alert">
                    <AlertTriangle className="w-3 h-3" />
                    Claude Code {t ? t('setup.notAvailable').toLowerCase() : 'not detected'}
                  </div>
                )}
              </button>

              {/* Option 2: API Key */}
              <button
                onClick={() => setGenerationMode('api')}
                className={`p-5 border text-left transition-all ${
                  generationMode === 'api'
                    ? 'border-cyber bg-cyber/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`led ${apiKeyStatus.hasKey ? 'led-green' : 'led-gray'}`} />
                  <span className="font-mono text-sm text-white">API KEY</span>
                </div>
                <p className="font-mono text-[11px] text-gray-500 mb-3">
                  Usa una API key de Anthropic. Pago por uso (~$0.05-0.15 por generación).
                </p>
                {apiKeyStatus.hasKey ? (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-matrix">
                    <CheckCircle2 className="w-3 h-3" />
                    API Key configurada
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500">
                    <Circle className="w-3 h-3" />
                    Sin API Key configurada
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Claude Code selected but not available */}
          {generationMode === 'claude-code' && !claudeCodeStatus.checking && !claudeCodeStatus.available && (
            <div className="terminal-card p-5 border-signal/30">
              <h4 className="font-mono text-xs text-signal tracking-wider mb-3">INSTALAR CLAUDE CODE</h4>
              <p className="font-mono text-[11px] text-gray-500 mb-4">
                Para usar tu suscripción, necesitas tener Claude Code instalado y autenticado.
              </p>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 bg-black/50 border border-white/10">
                  <code className="text-cyber">npm install -g @anthropic-ai/claude-code</code>
                </div>
                <div className="p-2 bg-black/50 border border-white/10">
                  <code className="text-cyber">claude auth login</code>
                </div>
              </div>
              <button
                onClick={() => fetch('/api/claude-code-status').then(r => r.json()).then(d => setClaudeCodeStatus({ ...d, checking: false }))}
                className="mt-4 px-4 py-2 border border-signal/30 text-signal font-mono text-[10px] hover:bg-signal/10 transition-all"
              >
                VERIFICAR DE NUEVO
              </button>
            </div>
          )}

          {/* API mode selected - show key input */}
          {generationMode === 'api' && (
            <div className="terminal-card p-5">
              <h4 className="font-mono text-xs text-cyber tracking-wider mb-3">CONFIGURAR API KEY</h4>
              <p className="font-mono text-[11px] text-gray-500 mb-4">
                Obtén una API key en{' '}
                <a href="https://platform.claude.com" target="_blank" rel="noopener noreferrer" className="text-cyber hover:underline">
                  platform.claude.com
                </a>
              </p>

              {apiKeyStatus.hasKey ? (
                <div className="space-y-3">
                  <div className="p-3 border border-matrix/30 bg-matrix/5 font-mono text-xs">
                    <span className="text-gray-500">CURRENT KEY:</span>{' '}
                    <span className="text-matrix">{apiKeyStatus.maskedKey}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveStep(2)} className="btn-terminal flex-1">
                      CONTINUE →
                    </button>
                    <button
                      onClick={() => setApiKeyStatus({ hasKey: false, maskedKey: null })}
                      className="px-4 py-2 border border-white/10 text-gray-500 font-mono text-xs hover:text-white transition-all"
                    >
                      CHANGE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="sk-ant-api03-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="input-terminal w-full px-4 py-3 text-sm"
                  />
                  <button
                    onClick={saveApiKey}
                    disabled={!apiKey.trim()}
                    className="btn-terminal w-full py-3 disabled:opacity-50"
                  >
                    SAVE API KEY
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Continue button for Claude Code mode */}
          {generationMode === 'claude-code' && claudeCodeStatus.available && (
            <button onClick={() => setActiveStep(2)} className="btn-terminal w-full py-4">
              CONTINUE WITH CLAUDE CODE →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Project Description */}
      {activeStep === 2 && (
        <div className="space-y-4">
          {/* Roadmap Validation Status */}
          {hasExistingRoadmap && (
            <div className={`terminal-card p-5 ${validateRoadmap.valid ? 'border-matrix/50' : validateRoadmap.issues.length > 0 ? 'border-alert/30' : 'border-signal/30'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 border flex items-center justify-center ${
                  validateRoadmap.valid ? 'border-matrix/50 bg-matrix/10' :
                  validateRoadmap.issues.length > 0 ? 'border-alert/50 bg-alert/10' :
                  'border-signal/50 bg-signal/10'
                }`}>
                  {validateRoadmap.valid ? (
                    <CheckCircle2 className="w-6 h-6 text-matrix" />
                  ) : validateRoadmap.issues.length > 0 ? (
                    <AlertTriangle className="w-6 h-6 text-alert" />
                  ) : (
                    <Info className="w-6 h-6 text-signal" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`font-mono text-sm ${
                      validateRoadmap.valid ? 'text-matrix' :
                      validateRoadmap.issues.length > 0 ? 'text-alert' : 'text-signal'
                    }`}>
                      {validateRoadmap.valid ? 'ROADMAP COMPLETE' :
                       validateRoadmap.issues.length > 0 ? 'ROADMAP INCOMPLETE' : 'ROADMAP NEEDS REVIEW'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-void-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            validateRoadmap.score >= 80 ? 'bg-matrix' :
                            validateRoadmap.score >= 50 ? 'bg-signal' : 'bg-alert'
                          }`}
                          style={{ width: `${validateRoadmap.score}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-gray-500">{validateRoadmap.score}%</span>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-gray-500 mb-3">
                    {validateRoadmap.totalFeatures} features • {validateRoadmap.totalTasks} tasks • {roadmap.project_info?.total_progress || 0}% progress
                  </p>

                  {/* Issues */}
                  {validateRoadmap.issues.length > 0 && (
                    <div className="mb-3">
                      <div className="font-mono text-[9px] text-alert tracking-wider mb-1">ISSUES TO FIX:</div>
                      <ul className="space-y-1">
                        {validateRoadmap.issues.map((issue, idx) => (
                          <li key={idx} className="font-mono text-[10px] text-alert/80 flex items-start gap-2">
                            <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {validateRoadmap.warnings.length > 0 && (
                    <details className="mb-3">
                      <summary className="font-mono text-[9px] text-signal tracking-wider cursor-pointer hover:text-signal/80">
                        {validateRoadmap.warnings.length} WARNINGS (click to expand)
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {validateRoadmap.warnings.map((warning, idx) => (
                          <li key={idx} className="font-mono text-[10px] text-signal/70 flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Action buttons based on status */}
                  {validateRoadmap.valid ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveStep(4)}
                        className="btn-terminal px-6 py-2 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        CONTINUE TO DASHBOARD
                      </button>
                      <button
                        onClick={() => {}}
                        className="px-4 py-2 border border-white/10 text-gray-500 font-mono text-xs hover:text-white transition-all"
                      >
                        REGENERATE ANYWAY
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          // Auto-fill requirements with issues
                          const autoReq = `Fix the following issues in my roadmap:\n${validateRoadmap.issues.map(i => `- ${i}`).join('\n')}${
                            validateRoadmap.warnings.length > 0 ?
                            `\n\nAlso consider these improvements:\n${validateRoadmap.warnings.slice(0, 5).map(w => `- ${w}`).join('\n')}` : ''
                          }`;
                          setRequirements(autoReq);
                        }}
                        className="px-4 py-2 border border-signal/30 text-signal font-mono text-xs hover:bg-signal/10 transition-all flex items-center gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        AI FIX ISSUES
                      </button>
                      {validateRoadmap.issues.length <= 2 && (
                        <button
                          onClick={() => setActiveStep(4)}
                          className="px-4 py-2 border border-white/10 text-gray-500 font-mono text-xs hover:text-white transition-all"
                        >
                          SKIP ANYWAY →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Project Scan Results */}
          <div className="terminal-card">
            <button
              onClick={() => setScanExpanded(!scanExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-4 h-4 text-cyber" />
                <div className="text-left">
                  <h3 className="font-mono text-sm text-white">PROJECT ANALYSIS</h3>
                  <p className="font-mono text-[10px] text-gray-600">
                    {scanning ? 'Scanning...' : projectScan ? `${projectScan.totalFiles} files • ${projectScan.techStack?.join(', ') || 'Unknown stack'}` : 'Not scanned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); scanProject(); }}
                  className="p-1.5 text-gray-600 hover:text-matrix transition-all"
                  title="Re-scan project"
                >
                  <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                </button>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${scanExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {scanExpanded && projectScan && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                  <div className="p-3 bg-void-100 border border-white/5">
                    <div className="font-mono text-[9px] text-gray-600">FILES</div>
                    <div className="font-display text-lg text-matrix">{projectScan.totalFiles}</div>
                  </div>
                  <div className="p-3 bg-void-100 border border-white/5">
                    <div className="font-mono text-[9px] text-gray-600">SIZE</div>
                    <div className="font-display text-lg text-cyber">{(projectScan.totalSize / 1024).toFixed(0)} KB</div>
                  </div>
                  <div className="col-span-2 p-3 bg-void-100 border border-white/5">
                    <div className="font-mono text-[9px] text-gray-600 mb-1">TECH STACK</div>
                    <div className="flex flex-wrap gap-1">
                      {projectScan.techStack?.map((tech, idx) => (
                        <span key={idx} className="font-mono text-[10px] px-2 py-0.5 bg-matrix/20 text-matrix">{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {projectScan.keyFiles?.length > 0 && (
                  <details className="mt-2">
                    <summary className="font-mono text-[10px] text-gray-500 cursor-pointer hover:text-white">
                      KEY FILES ({projectScan.keyFiles.length})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {projectScan.keyFiles.map((f, idx) => (
                        <div key={idx} className="p-2 bg-black/30 border border-white/5">
                          <code className="font-mono text-[10px] text-cyber">{f.path}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <details className="mt-2">
                  <summary className="font-mono text-[10px] text-gray-500 cursor-pointer hover:text-white">
                    ALL FILES ({projectScan.files?.length || 0})
                  </summary>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    <div className="font-mono text-[10px] text-gray-600 space-y-0.5">
                      {projectScan.files?.slice(0, 100).map((f, idx) => (
                        <div key={idx} className="truncate hover:text-white">{f.path}</div>
                      ))}
                      {projectScan.files?.length > 100 && <div className="text-gray-700">... and {projectScan.files.length - 100} more</div>}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Requirements Input */}
          <div className="terminal-card p-6">
            <h3 className="font-mono text-sm text-matrix tracking-wider mb-2"># REQUIREMENTS</h3>
            <p className="font-mono text-[10px] text-gray-500 mb-4">
              Describe las características, funcionalidades o mejoras que quieres implementar. Claude analizará tu proyecto y generará un roadmap estructurado.
            </p>

            <textarea
              placeholder="Ejemplo:
- Sistema de autenticación con login/registro
- Dashboard de administración con estadísticas
- API REST para gestión de usuarios
- Notificaciones por email
- Integración con pasarela de pago
- Tests unitarios y e2e
..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={10}
              className="input-terminal w-full px-4 py-3 text-sm resize-none mb-4"
            />

            <button
              onClick={analyzeWithAI}
              disabled={generating || !requirements.trim()}
              className="btn-terminal w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ANALYZING PROJECT...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  ANALYZE & GENERATE ROADMAP
                </>
              )}
            </button>

            <p className="font-mono text-[9px] text-gray-700 mt-3 text-center">
              Claude will analyze your project structure and create detailed tasks with affected files
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Review Generated */}
      {activeStep === 3 && generatedResult && (
        <div className="space-y-4">
          {/* Analysis Summary */}
          {generatedResult.analysis && (
            <div className="terminal-card p-4 border-cyber/30">
              <h4 className="font-mono text-xs text-cyber tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> ANALYSIS SUMMARY
              </h4>
              <p className="font-mono text-xs text-gray-400 mb-3">{generatedResult.analysis.summary}</p>

              {generatedResult.analysis.suggestions?.length > 0 && (
                <div className="mb-3">
                  <div className="font-mono text-[9px] text-gray-600 mb-1">SUGGESTIONS:</div>
                  <ul className="space-y-1">
                    {generatedResult.analysis.suggestions.map((s, idx) => (
                      <li key={idx} className="font-mono text-[10px] text-gray-500 flex items-start gap-2">
                        <span className="text-cyber">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedResult.analysis.warnings?.length > 0 && (
                <div className="p-2 border border-signal/30 bg-signal/5">
                  <div className="font-mono text-[9px] text-signal mb-1">WARNINGS:</div>
                  <ul className="space-y-1">
                    {generatedResult.analysis.warnings.map((w, idx) => (
                      <li key={idx} className="font-mono text-[10px] text-signal/80">{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="terminal-card p-6">
            <h3 className="font-mono text-sm text-matrix tracking-wider mb-4"># GENERATED ROADMAP</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 border border-matrix/20 bg-matrix/5">
                <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">FEATURES</div>
                <div className="metric-display text-2xl text-matrix">{generatedResult.roadmap?.features?.length || 0}</div>
              </div>
              <div className="p-4 border border-cyber/20 bg-cyber/5">
                <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">TASKS</div>
                <div className="metric-display text-2xl text-cyber">
                  {generatedResult.roadmap?.features?.reduce((acc, f) => acc + (f.tasks?.length || 0), 0) || 0}
                </div>
              </div>
            </div>

            {/* Preview features */}
            <div className="space-y-2 mb-6">
              <h4 className="font-mono text-[10px] text-gray-500 tracking-wider">FEATURES PREVIEW:</h4>
              {generatedResult.roadmap?.features?.map((feature) => (
                <details key={feature.id} className="bg-void-100 border border-white/5">
                  <summary className="p-3 cursor-pointer hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2 inline">
                      <span className={`font-mono text-[9px] px-2 py-0.5 ${
                        feature.priority === 'high' ? 'bg-alert text-black' :
                        feature.priority === 'medium' ? 'bg-signal text-black' :
                        'bg-cyber text-black'
                      }`}>{feature.priority?.toUpperCase()}</span>
                      <span className="font-sans text-sm text-white">{feature.name}</span>
                      <span className="font-mono text-[10px] text-gray-600 ml-auto">{feature.tasks?.length || 0} tasks</span>
                    </div>
                  </summary>
                  <div className="px-3 pb-3 border-t border-white/5 space-y-2">
                    <p className="font-mono text-[10px] text-gray-500 pt-2">{feature.description}</p>
                    {feature.tasks?.map((task, idx) => (
                      <div key={idx} className="p-2 bg-black/30 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Circle className="w-3 h-3 text-gray-600" />
                          <span className="font-mono text-[11px] text-white">{task.name}</span>
                        </div>
                        {task.affected_files?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.affected_files.slice(0, 3).map((f, i) => (
                              <code key={i} className="font-mono text-[9px] px-1 py-0.5 bg-black/50 text-cyber">{f}</code>
                            ))}
                            {task.affected_files.length > 3 && (
                              <span className="font-mono text-[9px] text-gray-600">+{task.affected_files.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setActiveStep(2)} className="px-4 py-2 border border-white/10 text-gray-500 font-mono text-xs hover:text-white transition-all">
                ← BACK
              </button>
              <button onClick={applyGenerated} className="btn-terminal flex-1 py-3">
                APPLY & DEPLOY
              </button>
            </div>
          </div>

          {/* JSON Preview */}
          <div className="terminal-card p-4">
            <details>
              <summary className="font-mono text-xs text-gray-500 cursor-pointer hover:text-white">
                VIEW GENERATED JSON
              </summary>
              <pre className="mt-4 p-4 bg-void-100 border border-white/5 font-mono text-[10px] text-gray-400 max-h-64 overflow-auto">
                {JSON.stringify(generatedResult.roadmap, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {activeStep === 4 && (
        <div className="terminal-card p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 border-2 border-matrix flex items-center justify-center glow-matrix">
            <CheckCircle2 className="w-10 h-10 text-matrix" />
          </div>
          <h3 className="font-display text-2xl text-matrix tracking-wider mb-3">SETUP COMPLETE</h3>
          <p className="font-mono text-xs text-gray-500 mb-6">
            Tu roadmap.json y .clinerules han sido generados y guardados.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setActiveStep(1); setGeneratedResult(null); }} className="px-4 py-2 border border-white/10 text-gray-500 font-mono text-xs hover:text-white transition-all">
              START OVER
            </button>
            <button onClick={() => window.location.reload()} className="btn-terminal px-6 py-2">
              VIEW DASHBOARD
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ============ FORMS & MODALS ============
function AddTaskForm({ onAdd, onCancel, team = [], t, language }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const taskData = { name, description, priority };
    if (assignedTo) {
      const member = team.find(m => m.id === assignedTo);
      taskData.assigned_to = assignedTo;
      taskData.assigned_name = member?.name || '';
    }
    onAdd(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border border-matrix/30 bg-matrix/5">
      <div className="space-y-3">
        <input
          type="text"
          placeholder={t ? t('features.taskName') : "Task name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-terminal w-full px-3 py-2 text-sm"
          autoFocus
        />
        <textarea
          placeholder={t ? t('features.taskDescription') : "Description (optional)"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="input-terminal w-full px-3 py-2 text-sm resize-none"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-terminal px-3 py-2 text-sm">
            <option value="high">{t ? t('common.high').toUpperCase() : 'HIGH'}</option>
            <option value="medium">{t ? t('common.medium').toUpperCase() : 'MEDIUM'}</option>
            <option value="low">{t ? t('common.low').toUpperCase() : 'LOW'}</option>
          </select>
          {team.length > 0 && (
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="input-terminal px-3 py-2 text-sm"
            >
              <option value="">{t ? t('features.unassigned') : 'Unassigned'}</option>
              {team.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onCancel} className="px-4 py-2 font-mono text-xs text-gray-500 hover:text-white transition-all">
            {t ? t('common.cancel').toUpperCase() : 'CANCEL'}
          </button>
          <button type="submit" disabled={!name.trim()} className="btn-terminal px-4 py-2 disabled:opacity-50">
            {t ? t('common.add').toUpperCase() : 'ADD'}
          </button>
        </div>
      </div>
    </form>
  );
}

function AddFeatureForm({ onAdd, onClose, team = [], t, language }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [id, setId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const featureData = { id: id || undefined, name, description, priority };
    if (assignedTo) {
      const member = team.find(m => m.id === assignedTo);
      featureData.assigned_to = assignedTo;
      featureData.assigned_name = member?.name || '';
    }
    onAdd(featureData);
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="font-display text-xl text-matrix tracking-wider mb-6">
        {t ? t('features.addFeature') : 'NEW FEATURE'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider">ID ({language === 'es' ? 'opcional' : 'optional'})</label>
          <input
            type="text"
            placeholder="e.g. user-auth"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="input-terminal w-full px-4 py-2.5 mt-2 text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider">{t ? t('settings.name').toUpperCase() : 'NAME'} *</label>
          <input
            type="text"
            placeholder={t ? t('features.featureName') : "Feature name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-terminal w-full px-4 py-2.5 mt-2 text-sm"
            autoFocus
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider">{language === 'es' ? 'DESCRIPCIÓN' : 'DESCRIPTION'}</label>
          <textarea
            placeholder={t ? t('features.featureDescription') : "Feature description"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-terminal w-full px-4 py-2.5 mt-2 text-sm resize-none"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 tracking-wider">{t ? t('features.priority').toUpperCase() : 'PRIORITY'}</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-terminal w-full px-4 py-2.5 mt-2 text-sm">
            <option value="high">{t ? t('common.high').toUpperCase() : 'HIGH'}</option>
            <option value="medium">{t ? t('common.medium').toUpperCase() : 'MEDIUM'}</option>
            <option value="low">{t ? t('common.low').toUpperCase() : 'LOW'}</option>
          </select>
        </div>
        {team.length > 0 && (
          <div>
            <label className="font-mono text-[10px] text-gray-500 tracking-wider">{t ? t('features.assignTo').toUpperCase() : 'ASSIGN TO'}</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="input-terminal w-full px-4 py-2.5 mt-2 text-sm"
            >
              <option value="">{t ? t('features.unassigned') : 'Unassigned'}</option>
              {team.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-white/20 text-gray-500 font-mono text-xs hover:bg-white/5 transition-all">
            {t ? t('common.cancel').toUpperCase() : 'CANCEL'}
          </button>
          <button type="submit" disabled={!name.trim()} className="btn-terminal flex-1 py-2.5 disabled:opacity-50">
            {language === 'es' ? 'CREAR' : 'CREATE'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in" onClick={onClose}>
      <div className="terminal-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ============ THEME MODAL ============
function ThemeModal({ roadmap, setRoadmap, setHasChanges, onClose }) {
  const themePresets = [
    { name: 'Matrix Green', color: '#00ff88' },
    { name: 'Cyber Blue', color: '#00d4ff' },
    { name: 'Signal Orange', color: '#ff9500' },
    { name: 'Alert Red', color: '#ff3366' },
    { name: 'Purple Haze', color: '#a855f7' },
    { name: 'Gold', color: '#fbbf24' },
    { name: 'Teal', color: '#14b8a6' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Lime', color: '#84cc16' },
    { name: 'Sky', color: '#0ea5e9' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Rose', color: '#f43f5e' },
  ];

  const currentTheme = roadmap?.project_info?.theme || { name: 'Matrix Green', color: '#00ff88' };

  const updateTheme = (theme) => {
    setRoadmap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.project_info.theme = theme;
      return updated;
    });
    setHasChanges(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in" onClick={onClose}>
      <div className="terminal-card p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{
                backgroundColor: currentTheme.color,
                boxShadow: `0 0 20px ${currentTheme.color}50`
              }}
            />
            <div>
              <h3 className="font-mono text-sm text-white tracking-wider">PROJECT THEME</h3>
              <p className="font-mono text-[10px] text-gray-600">{currentTheme.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Presets Grid */}
        <div className="mb-6">
          <h4 className="font-mono text-[10px] text-gray-500 tracking-wider mb-3">PRESETS</h4>
          <div className="grid grid-cols-6 gap-3">
            {themePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => updateTheme(preset)}
                className={`w-full aspect-square rounded-lg transition-all hover:scale-110 relative group ${
                  currentTheme.color === preset.color ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : ''
                }`}
                style={{
                  backgroundColor: preset.color,
                  boxShadow: currentTheme.color === preset.color ? `0 0 20px ${preset.color}` : 'none'
                }}
                title={preset.name}
              >
                {currentTheme.color === preset.color && (
                  <Check className="w-4 h-4 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="font-mono text-[10px] text-gray-500 tracking-wider mb-3">CUSTOM</h4>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={currentTheme.color}
              onChange={(e) => updateTheme({ name: 'Custom', color: e.target.value })}
              className="w-12 h-12 cursor-pointer bg-transparent border border-white/20 rounded"
            />
            <input
              type="text"
              value={currentTheme.color}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  updateTheme({ name: 'Custom', color: e.target.value });
                }
              }}
              placeholder="#00ff88"
              className="input-terminal px-3 py-2 text-sm w-32 font-mono"
            />
            <input
              type="text"
              value={currentTheme.name}
              onChange={(e) => updateTheme({ ...currentTheme, name: e.target.value })}
              placeholder="Theme name"
              className="input-terminal px-3 py-2 text-sm flex-1 font-mono"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 border border-white/10 bg-black/50 rounded">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-gray-600">FAVICON:</span>
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: currentTheme.color }}
              />
            </div>
            <div className="flex-1">
              <div className="font-mono text-xs text-white">{roadmap?.project_info?.name || 'Project'}</div>
              <div className="progress-brutal mt-2 h-2">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${roadmap?.project_info?.total_progress || 0}%`,
                    backgroundColor: currentTheme.color
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="font-mono text-[10px] text-gray-600 mt-4 text-center">
          Theme color appears in browser tab favicon and UI accents
        </p>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="w-24 h-24 border-2 border-matrix/50 flex items-center justify-center glow-matrix">
              <Terminal className="w-10 h-10 text-matrix" />
            </div>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-matrix" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-matrix" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-matrix" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-matrix" />
          </div>
          <h1 className="font-display text-3xl text-matrix tracking-wider mt-6 crt-glow">ROADMAP</h1>
          <p className="font-mono text-xs text-gray-600 tracking-widest mt-2">TERMINAL ACCESS</p>
        </div>

        {/* Login Form */}
        <div className="terminal-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="led led-amber" />
            <span className="font-mono text-xs text-signal tracking-wider">AUTHENTICATION REQUIRED</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-gray-500 tracking-wider">EMAIL</label>
              <div className="relative mt-2">
                <User className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@localhost"
                  className="input-terminal w-full pl-10 pr-4 py-3 text-sm"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] text-gray-500 tracking-wider">PASSWORD</label>
              <div className="relative mt-2">
                <Lock className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-terminal w-full pl-10 pr-4 py-3 text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 border border-alert/30 bg-alert/5 text-alert font-mono text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !email.trim() || !password.trim()} className="btn-terminal w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  ACCESS
                </>
              )}
            </button>
          </form>

          <p className="font-mono text-[10px] text-gray-700 text-center mt-6">
            Credentials configured in .env file
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ CLINERULES GENERATOR ============
function generateClinerules() {
  return `# AI Development Rules

## 📖 FIRST STEP - READ THE ROADMAP

**BEFORE writing any code, you MUST read:**
\`\`\`
roadmap-kit/roadmap.json
\`\`\`

This file contains:
- Project context, stack, and architecture
- Shared resources (components, utilities, DB tables) - **DO NOT DUPLICATE**
- Coding conventions specific to this project
- Current features and tasks with detailed descriptions

---

## 📝 Code Conventions

### Naming
- **Variables & Functions**: \`camelCase\`
- **Components/Classes**: \`PascalCase\`
- **Constants**: \`UPPER_SNAKE_CASE\`
- **Files**: \`kebab-case\` for utils, \`PascalCase\` for components
- **CSS/Tailwind classes**: \`kebab-case\`

### Best Practices
- Keep functions small and focused (single responsibility)
- Use descriptive names over comments
- DRY - Don't Repeat Yourself (check shared_resources first)
- Prefer composition over inheritance
- Handle errors explicitly, never swallow them
- Validate inputs at system boundaries

### Code Quality
- No magic numbers - use named constants
- Avoid deep nesting (max 3 levels)
- Early returns over nested conditionals
- Explicit is better than implicit

---

## ♻️ SHARED RESOURCES - MANDATORY

**Check \`roadmap.json > project_info > shared_resources\` BEFORE creating:**

1. **UI Components** - Reuse existing buttons, inputs, modals, etc.
2. **Utilities** - Use existing helpers, formatters, validators
3. **Database Tables** - Don't create duplicate tables

**RULE:** If it exists in shared_resources, you MUST use it.

---

## 🔖 Commit Format

Use this format for automatic roadmap updates:

\`\`\`
[task:TASK-ID] [status:STATUS] Description
\`\`\`

**Examples:**
\`\`\`bash
git commit -m "[task:auth-login] [status:completed] Implement JWT authentication"
git commit -m "[task:user-api] [status:in_progress] Add user CRUD endpoints"
git commit -m "[task:payment] [status:completed] [debt:Missing validation|high] Add payment processing"
\`\`\`

**Available tags:**
- \`[task:id]\` - Task ID from roadmap.json
- \`[status:pending|in_progress|completed]\` - Task status
- \`[debt:description|severity|effort]\` - Technical debt (severity: low/medium/high)

---

## ⚠️ Technical Debt Capture

**You MUST register technical debt when:**
- Skipping validation or error handling
- Using workarounds or hacks
- Leaving TODO comments
- Not writing tests
- Hardcoding values
- Any "temporary" solutions

**Severity Guide:**
| Severity | When | Action Required |
|----------|------|-----------------|
| high | Security, data integrity | Fix ASAP |
| medium | Functionality degraded | Fix soon |
| low | Improvements, optimizations | When time allows |

---

## 📋 After Completing a Task

Update \`roadmap.json\` with:

1. **status**: "completed" or "in_progress"
2. **ai_notes**: Your implementation decisions and reasoning
3. **affected_files**: All files created or modified
4. **reused_resources**: Components/utilities you reused
5. **technical_debt**: Any debt you introduced

---

## ✅ Pre-Commit Checklist

- [ ] Read the task description from roadmap.json?
- [ ] Checked shared_resources for existing code?
- [ ] Followed project conventions?
- [ ] Updated roadmap.json with results?
- [ ] Registered technical debt if any?
- [ ] Used correct commit format?

---

## 🚫 DO NOT

- Create duplicate components/utilities
- Ignore project conventions
- Commit without task tags
- Leave undocumented technical debt
- Refactor unrelated code
- Skip reading the roadmap

---

**🗺️ ROADMAP-KIT** - AI needs context too.
`;
}

// Wrap App with providers
function AppWithProviders() {
  return (
    <ToastProvider>
      <ActivityProvider>
        <App />
      </ActivityProvider>
    </ToastProvider>
  );
}

export default AppWithProviders;
