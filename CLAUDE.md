# ROADMAP-KIT - AI-Assisted Project Management System

## Project Purpose

ROADMAP-KIT solves critical problems in AI-assisted programming ("Vibe Coding"):
- **AI memory loss** between sessions
- **Code duplication** - AI recreates existing components
- **Lack of traceability** - no visibility of what changed and why
- **Missing context** - AI doesn't know project conventions
- **No progress visibility** - can't track completion across features

This is a **plug & play** system that uses `roadmap.json` as the single source of truth, synchronized automatically via Git commits.

## Quick Start Commands

```bash
# Initialize in a new project
npx roadmap-kit init

# Scan git history and update roadmap
npx roadmap-kit scan
# or: npm run scan

# Launch dashboard
npx roadmap-kit dashboard
# or: npm run dev

# Generate Docker setup
npx roadmap-kit docker

# Dashboard development (from /dashboard folder)
cd dashboard
npm run dev      # Starts on http://localhost:3001
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture Overview

```
┌─────────────┐
│ Git Commits │ ──┐
│ with tags   │   │
└─────────────┘   │
                  ▼
            ┌──────────┐      ┌──────────────┐
            │scanner.js│ ───► │roadmap.json  │
            └──────────┘      └──────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ React Dashboard│
                              │ (Vite + Tailwind)│
                              └───────────────┘
```

### Core Components

1. **roadmap.json** - Single source of truth
   - Project metadata (name, stack, conventions)
   - Features and tasks with status tracking
   - Shared resources (UI components, utilities, DB tables)
   - Technical debt registry
   - Auto-updated by scanner.js

2. **scanner.js** - Git History Parser
   - Parses commits for special tags: `[task:id]`, `[status:value]`, `[debt:description]`
   - Extracts metrics: lines added/removed, files changed, complexity
   - Updates roadmap.json automatically
   - Calculates feature/project progress percentages

3. **cli.js** - Command Line Interface
   - `init` - Creates roadmap.json from template, detects environment
   - `scan` - Runs scanner.js
   - `dashboard` - Launches React dashboard
   - `docker` - Generates docker-compose.yml

4. **dashboard/** - React + Vite Application
   - 4 tabs: Features, Shared Resources, Technical Debt, Settings
   - shadcn/ui components with Radix primitives
   - Recharts for visualizations
   - Dark mode optimized (slate color palette)
   - Real-time progress tracking

## Git Commit Format (CRITICAL)

All commits should follow this format to enable auto-tracking:

```bash
git commit -m "[task:AUTH-001] [status:completed] Implement JWT authentication"
git commit -m "[task:USER-003] [status:in_progress] Add user profile page"
git commit -m "[task:AUTH-002] [debt:Missing rate limiting|high|2h] Complete login endpoint"
```

### Tag Structure

- `[task:FEATURE-NNN]` - Links commit to task ID in roadmap.json
- `[status:pending|in_progress|completed]` - Updates task status
- `[debt:description|severity|effort]` - Registers technical debt
  - severity: `low`, `medium`, `high`
  - effort: e.g., `2h`, `1d`, `3d`

## File Structure

```
roadmap-kit/
├── roadmap.json              # Main state file
├── scanner.js                # Git parser (275 lines)
├── cli.js                    # CLI with 4 commands
├── package.json              # NPM package config (bin: roadmap-kit)
├── templates/
│   ├── roadmap.template.json
│   └── clinerules.template   # AI rules template
├── dashboard/
│   ├── src/
│   │   ├── App.jsx           # Main dashboard (370 lines)
│   │   ├── components/
│   │   │   ├── TaskList.jsx
│   │   │   ├── TechnicalDebt.jsx
│   │   │   ├── SharedResources.jsx
│   │   │   ├── ProjectSettings.jsx  # .clinerules generator
│   │   │   ├── CircularProgress.jsx
│   │   │   └── ui/           # shadcn/ui components
│   │   └── lib/utils.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── docker/
    ├── Dockerfile            # node:20-alpine
    ├── docker-compose.yml
    └── entrypoint.sh         # Runs scanner then Vite
```

## Key Functions & Logic

### scanner.js

```javascript
// Parses commit messages for special tags
function parseCommitTags(message) {
  const tags = { taskId: null, status: null, debts: [] };
  const taskMatch = message.match(/\[task:([^\]]+)\]/);
  const statusMatch = message.match(/\[status:([^\]]+)\]/);
  const debtMatch = message.match(/\[debt:([^\]]+)\]/);
  // Returns structured tags
}

// Extracts metrics from git diff
async function getCommitStats(commit) {
  // Returns: lines_added, lines_removed, files_created, files_modified
}

// Updates task in roadmap.json
function updateTask(roadmap, tags, commit) {
  // Finds task by ID, updates status, adds git info, appends debts
}

// Calculates completion percentage
function calculateFeatureProgress(feature) {
  // completed_tasks / total_tasks * 100
}
```

### ProjectSettings.jsx

```javascript
// Generates .clinerules file from roadmap.json
const generateClinerules = () => {
  // Includes:
  // 1. Project context (name, purpose, stack)
  // 2. OBLIGATORY roadmap-kit protocol
  // 3. Nomenclature conventions
  // 4. Shared resources (components, utilities, tables)
  // 5. Commit format rules
  // 6. Pre-commit checklist
}
```

## Dashboard Features

### 1. Features Tab
- Accordions for each feature
- Circular progress indicators
- Filterable task list (by status, search term)
- Task metrics: lines changed, files, complexity, commits
- AI notes expandable sections
- Technical debt inline warnings
- Copy-to-clipboard for file paths

### 2. Shared Resources Tab
- 3 summary cards (UI Components, Utilities, DB Tables)
- Expandable accordions per resource
- Usage examples with copy button
- Color-coded by type (blue=UI, green=utils, purple=DB)

### 3. Technical Debt Tab
- Bar chart by severity
- Summary cards (high/medium/low counts)
- Grouped debt items with gradient cards
- Estimated effort display
- Links to source feature/task

### 4. Settings Tab
- Generates .clinerules dynamically from roadmap.json
- Preview with syntax highlighting
- Download button (.clinerules file)
- Copy-to-clipboard
- Convention display (nomenclature, architecture, structure, DB)

## Tech Stack

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn/ui (Radix primitives)
- **Charts**: Recharts
- **Icons**: Lucide React
- **CLI**: Commander.js
- **Git Operations**: simple-git
- **Module System**: ESM (type: "module")
- **Docker**: node:20-alpine

## Important Conventions

### roadmap.json Structure

```json
{
  "project_info": {
    "name": "Project Name",
    "description": "Purpose",
    "stack": ["React", "Node.js"],
    "total_progress": 50,
    "last_sync": "2024-01-01T12:00:00Z",
    "conventions": {
      "naming": "camelCase for JS, PascalCase for components",
      "architecture": "Clean Architecture, DDD",
      "structure": "Feature-based folders",
      "database": "PostgreSQL with migrations"
    },
    "shared_resources": {
      "ui_components": [
        {
          "path": "src/components/ui/Button.jsx",
          "description": "Primary button",
          "usage": "<Button variant='primary'>Click</Button>"
        }
      ],
      "utilities": [
        {
          "path": "src/utils/api.js",
          "description": "HTTP client",
          "exports": ["get", "post"],
          "usage": "import { get } from '@/utils/api'"
        }
      ],
      "database_tables": [
        {
          "name": "users",
          "description": "User accounts",
          "fields": ["id", "email", "created_at"]
        }
      ]
    }
  },
  "features": [
    {
      "id": "AUTH",
      "name": "Authentication",
      "description": "User login system",
      "priority": "high",
      "progress": 50,
      "tasks": [
        {
          "id": "AUTH-001",
          "name": "JWT Authentication",
          "description": "Implement JWT auth",
          "status": "completed",
          "priority": "high",
          "affected_files": ["src/auth/jwt.js"],
          "reused_resources": ["@/utils/api"],
          "ai_notes": "Used bcrypt for hashing",
          "metrics": {
            "lines_added": 250,
            "lines_removed": 10,
            "files_created": 2,
            "files_modified": 3,
            "complexity_score": 7
          },
          "git": {
            "commits": ["abc123"],
            "last_commit": "abc123def",
            "pr_number": "42",
            "pr_url": "https://github.com/..."
          },
          "technical_debt": [
            {
              "description": "Missing rate limiting",
              "severity": "high",
              "estimated_effort": "2h"
            }
          ]
        }
      ]
    }
  ]
}
```

## Docker Usage

```bash
# Generate docker-compose.yml in project root
npx roadmap-kit docker

# Start dashboard
docker-compose up -d

# Access at http://localhost:3001
```

### Docker Volume Strategy
- `.git` mounted read-only (scanner needs commit history)
- `roadmap.json` mounted read-write (scanner updates it)
- `entrypoint.sh` runs scanner before Vite server starts

## NPM Package Distribution

```json
{
  "name": "roadmap-kit",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "roadmap-kit": "./cli.js"
  }
}
```

Install globally or use with npx:
```bash
npm install -g roadmap-kit
npx roadmap-kit init
```

## Troubleshooting

**Dashboard not loading roadmap.json:**
- Ensure `roadmap.json` exists in project root
- Run `npx roadmap-kit scan` first
- Check browser console for fetch errors

**Scanner not finding tasks:**
- Verify commit messages use `[task:ID]` format exactly
- Ensure task IDs match those in roadmap.json
- Run with `node scanner.js` to see debug output

**Vite build fails:**
- Clear cache: `rm -rf dashboard/.vite dashboard/node_modules/.vite`
- Reinstall: `cd dashboard && npm install`

## Working with AI (Claude)

1. **Always check roadmap.json first** before creating new components
2. **Reuse shared_resources** instead of duplicating code
3. **Use commit tags** for every task: `[task:ID] [status:value]`
4. **Register technical debt** immediately: `[debt:description|severity|effort]`
5. **Update conventions** in roadmap.json when establishing new patterns
6. **Generate .clinerules** from Settings tab and add to project root

## Critical Files to Never Modify Manually

- `roadmap.json` - Updated by scanner.js only (except initial setup)
- Git history - Scanner depends on commit message format

## Manual Updates Allowed

- `project_info.conventions` - Document agreed-upon patterns
- `project_info.shared_resources` - Add new reusable components
- `features[].tasks[]` - Add new tasks (scanner will track progress)

---

**Last Updated**: Auto-generated from codebase analysis
**Dashboard Version**: 1.0.0
**Scanner Version**: 1.0.0
