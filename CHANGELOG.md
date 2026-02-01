# Changelog

All notable changes to ROADMAP-KIT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-02-01

### Fixed

- **Glass Theme Typography Consistency**: Unified typography across all pages (Setup, Help, Config, Info)
  - All UI elements now use clean sans-serif fonts (Inter) instead of monospace
  - Code blocks and `<pre>` elements preserve monospace styling
  - Consistent font weights: headings 600, body 500
  - Removed terminal-style wide letter spacing for cleaner appearance
- **Theme Color Variables**: Mapped hardcoded colors to CSS variables for proper theme adaptation
  - `text-white`, `text-gray-*` colors now use theme-aware variables
  - Background tints (`bg-matrix/*`, `bg-cyber/*`) properly blend with theme
  - Border colors softer in Glass theme
- **Technical Debt Page i18n**: Changed nav label from "DEUDA" to "DEUDA TÉCNICA"

### Changed

- Glass theme now properly applies clean typography to all dashboard tabs
- Improved readability with refined letter spacing and font weights

## [1.0.2] - 2026-02-01

### Added

- **Dynamic Port Detection**: Dashboard now automatically detects if port 6969 is in use and finds an available port (6969-6978 range)
- **Custom Port Option**: New `--port <port>` option for `roadmap-kit dashboard` command
- **Comprehensive Tech Stack Detection**: Detects 50+ technologies across 7 categories:
  - Frameworks: React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Express, NestJS, Fastify, Angular, Astro, Remix
  - Databases: Prisma, TypeORM, Sequelize, Mongoose, Drizzle, Knex, PostgreSQL, MySQL, SQLite, MongoDB, Redis, Supabase, Firebase
  - Styling: TailwindCSS, Styled Components, Emotion, SCSS, Material UI, Ant Design, Chakra UI, Bootstrap
  - Testing: Jest, Vitest, Mocha, Playwright, Cypress, Testing Library
  - Build: Vite, Webpack, esbuild, Parcel, Rollup, Turborepo
  - Tools: TypeScript, ESLint, Prettier, Husky, Zod, Axios, GraphQL, tRPC, Socket.io
  - Python: Django, Flask, FastAPI, SQLAlchemy, Pytest, Celery
- **Project Structure Analysis**: Detects folder patterns (app-router, feature-based, layer-based, mixed, flat)
- **Shared Resources Scanning**: Automatically detects UI components, utilities, and Prisma database tables
- **Git History Analysis**: Analyzes commit count and determines project maturity (new/early/established)
- **Conventions Extraction**: Extracts naming conventions, file structure, database, and styling conventions from config files
- **Enhanced Init Output**: Displays comprehensive analysis summary after initialization

### Changed

- `roadmap-kit init` now shows detected stack, structure, components count, utilities count, and git history
- `roadmap.json` now includes structured `conventions` object with detailed naming rules
- `roadmap.json` now includes `git_info` with commit count, maturity, and dates

## [1.0.1] - 2026-02-01

### Changed

- Updated homepage to roadmap-kit.com

## [1.0.0] - 2026-01-31

### Added

- Initial release
- CLI with commands: `init`, `scan`, `dashboard`, `docker`, `nginx`
- Git scanner for automatic task tracking via commit tags
- React dashboard with 4 tabs: Features, Shared Resources, Technical Debt, Settings
- Theme system with Glass/Matrix themes and light/dark mode
- Docker and Nginx configuration generators
- Support for multiple AI tools (.clinerules, .cursorrules, .windsurfrules)
