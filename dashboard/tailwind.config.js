/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Pure black base
        void: {
          DEFAULT: '#000000',
          50: '#0a0a0a',
          100: '#0d0d0d',
          200: '#121212',
          300: '#1a1a1a',
          400: '#222222',
        },
        // Electric terminal green
        matrix: {
          DEFAULT: '#00ff88',
          dim: '#00cc6a',
          bright: '#33ffaa',
          glow: 'rgba(0, 255, 136, 0.5)',
        },
        // Amber warning/active
        signal: {
          DEFAULT: '#ff9500',
          dim: '#cc7700',
          bright: '#ffaa33',
          glow: 'rgba(255, 149, 0, 0.5)',
        },
        // Cyan interactive
        cyber: {
          DEFAULT: '#00d4ff',
          dim: '#00a8cc',
          bright: '#33ddff',
          glow: 'rgba(0, 212, 255, 0.5)',
        },
        // Rose danger
        alert: {
          DEFAULT: '#ff3366',
          dim: '#cc2952',
          bright: '#ff5580',
          glow: 'rgba(255, 51, 102, 0.5)',
        },
        // Status semantic colors
        status: {
          completed: '#00ff88',
          progress: '#ff9500',
          pending: '#555555'
        },
        severity: {
          high: '#ff3366',
          medium: '#ff9500',
          low: '#00d4ff'
        }
      },
      boxShadow: {
        'matrix': '0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.1)',
        'signal': '0 0 20px rgba(255, 149, 0, 0.3), 0 0 40px rgba(255, 149, 0, 0.1)',
        'cyber': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)',
        'alert': '0 0 20px rgba(255, 51, 102, 0.3), 0 0 40px rgba(255, 51, 102, 0.1)',
        'inner-glow': 'inset 0 0 30px rgba(0, 255, 136, 0.05)',
      },
      keyframes: {
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.95" },
          "52%": { opacity: "1" },
          "54%": { opacity: "0.9" },
          "56%": { opacity: "1" },
        },
        "typing": {
          "from": { width: "0" },
          "to": { width: "100%" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "slide-up": {
          "from": { opacity: "0", transform: "translateY(20px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "from": { opacity: "0", transform: "translateX(-20px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-left": {
          "from": { opacity: "0", transform: "translateX(100%)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          "from": { opacity: "0" },
          "to": { opacity: "1" },
        },
        "progress-fill": {
          "from": { width: "0" },
          "to": { width: "var(--progress-width)" },
        },
      },
      animation: {
        "scan": "scan 8s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "flicker": "flicker 0.15s ease-in-out",
        "typing": "typing 2s steps(30) forwards",
        "blink": "blink 1s step-end infinite",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "slide-left": "slide-left 0.3s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "progress-fill": "progress-fill 1s ease-out forwards",
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
        `,
        'scanline': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
