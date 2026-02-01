/**
 * Theme Configuration for ROADMAP-KIT Dashboard
 *
 * Two themes available:
 * - glass: Modern, clean interface (default)
 * - matrix: Cyberpunk terminal aesthetic
 */

export const themes = {
  glass: {
    id: 'glass',
    name: 'Glass',
    description: 'Interfaz moderna y limpia',
    descriptionEn: 'Modern and clean interface',
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'Fira Code', 'Consolas', monospace"
    },
    preview: {
      bg: '#f1f5f9',
      card: '#ffffff',
      accent: '#10b981',
      text: '#1e293b'
    }
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    description: 'Estética cyberpunk terminal',
    descriptionEn: 'Cyberpunk terminal aesthetic',
    fonts: {
      heading: "'Orbitron', monospace",
      body: "'IBM Plex Mono', monospace",
      mono: "'IBM Plex Mono', monospace"
    },
    preview: {
      bg: '#0a0a0a',
      card: '#0d0d0d',
      accent: '#00ff88',
      text: '#e0e0e0'
    }
  }
};

export const DEFAULT_THEME = 'glass';

export const getTheme = (themeId) => {
  return themes[themeId] || themes[DEFAULT_THEME];
};
