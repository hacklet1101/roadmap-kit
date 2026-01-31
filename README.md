# 🗺️ ROADMAP-KIT

**Sistema de gestión de proyectos optimizado para "Vibe Coding" (programación asistida por IA)**

ROADMAP-KIT elimina los problemas comunes al programar con IA: pérdida de memoria entre sesiones, duplicación de código, falta de trazabilidad y ausencia de contexto. Es un sistema **plug & play** que se integra fácilmente en cualquier proyecto y se puede eliminar sin dejar rastro.

---

## 🎯 Problemas que Resuelve

### ❌ Sin ROADMAP-KIT:
- **Falta de memoria a largo plazo**: La IA olvida decisiones técnicas entre sesiones
- **Duplicación constante**: Crea funciones, componentes y tablas que ya existen
- **Sin trazabilidad**: No hay forma de ver qué cambió la IA, por qué y cuándo
- **Falta de contexto**: La IA no sabe qué convenciones seguir
- **Sin visibilidad del progreso**: No hay forma de ver el % de completitud del proyecto

### ✅ Con ROADMAP-KIT:
- ✅ **Memoria persistente**: `roadmap.json` guarda todas las decisiones de la IA
- ✅ **Cero duplicación**: La IA consulta recursos compartidos antes de crear código nuevo
- ✅ **Trazabilidad completa**: Cada commit actualiza automáticamente el roadmap
- ✅ **Contexto siempre disponible**: `.clinerules` define las reglas del proyecto
- ✅ **Dashboard visual**: Ve el progreso en tiempo real

---

## 🚀 Características

- **📋 Roadmap JSON**: Estado completo del proyecto con features, tareas y métricas
- **🤖 AI Memory**: Campo `ai_notes` para que la IA documente sus decisiones
- **♻️ Resource Tracking**: Lista de componentes, utilidades y tablas DB reutilizables
- **📊 Git Scanner**: Lee commits automáticamente y actualiza el roadmap
- **💳 Technical Debt Tracking**: Registro de deuda técnica con severidad
- **🎨 Visual Dashboard**: Interfaz React para visualizar el progreso
- **🐳 Docker Support**: Contenedor listo para usar
- **📦 NPM Package**: Instalable con `npm` o `npx`

---

## 📦 Instalación

### Opción 1: NPX (Zero-Config)

```bash
npx roadmap-kit init
```

### Opción 2: NPM Global

```bash
npm install -g roadmap-kit
roadmap-kit init
```

### Opción 3: Instalación Manual

```bash
# Clonar el repositorio
git clone https://github.com/hacklet1101/roadmap-kit.git

# Copiar a tu proyecto
cp -r roadmap-kit /path/to/your/project/

# Ejecutar setup
cd /path/to/your/project/roadmap-kit
chmod +x setup.sh
./setup.sh
```

---

## 🎯 Uso Rápido

### 1. Inicializar Roadmap

```bash
# Con NPM scripts (si instalaste con setup.sh)
npm run roadmap:init

# O con CLI directamente
node roadmap-kit/cli.js init
```

Esto crea:
- `roadmap.json` - Estado del proyecto
- `.clinerules` - Reglas para la IA

### 2. Definir Features y Tareas

Edita `roadmap.json` y añade tus features:

```json
{
  "features": [
    {
      "id": "auth",
      "name": "Autenticación",
      "description": "Sistema de login con JWT",
      "tasks": [
        {
          "id": "auth-login",
          "name": "Implementar login",
          "description": "Crear endpoint POST /api/auth/login"
        }
      ]
    }
  ]
}
```

### 3. Trabajar con la IA

Cuando la IA complete una tarea, haz commit con tags especiales:

```bash
git commit -m "[task:auth-login] [status:completed] Implementa endpoint de login con JWT"
```

### 4. Sincronizar con Git

```bash
npm run roadmap:scan
```

Esto lee los commits y actualiza automáticamente el `roadmap.json`.

### 5. Ver el Dashboard

```bash
npm run roadmap
```

Abre http://localhost:6969 y ve:
- Progreso de cada feature
- Tareas completadas vs pendientes
- Deuda técnica acumulada
- Recursos compartidos

---

## 📋 Formato de Commits

Para que el scanner actualice automáticamente el roadmap, usa estos tags:

### Tags Disponibles:

- `[task:id]` - ID de la tarea del roadmap
- `[status:pending|in_progress|completed]` - Estado de la tarea
- `[debt:descripción]` - Deuda técnica detectada

### Ejemplos:

```bash
# Completar una tarea
git commit -m "[task:auth-login] [status:completed] Implementa endpoint de login con JWT"

# Marcar en progreso y reportar deuda técnica
git commit -m "[task:user-list] [status:in_progress] [debt:Falta paginación] Implementa listado básico"

# Múltiples deudas técnicas
git commit -m "[task:payment] [status:completed] [debt:Falta validación de tarjetas] [debt:Logs no centralizados] Implementa pagos"
```

---

## 🤖 Protocolo de Trabajo con IA

### ANTES de generar código:

1. ✅ Lee el `roadmap.json` para entender la tarea
2. ✅ Verifica qué recursos compartidos puedes reutilizar
3. ✅ Consulta las convenciones de nomenclatura en `.clinerules`

### DURANTE la implementación:

1. ✅ NO dupliques código existente
2. ✅ Mantén la nomenclatura existente
3. ✅ Reutiliza componentes UI, utilidades y tablas DB

### DESPUÉS de generar código:

1. ✅ Actualiza el campo `ai_notes` explicando tus decisiones
2. ✅ Lista los archivos modificados
3. ✅ Indica qué recursos reutilizaste
4. ✅ Reporta cualquier deuda técnica
5. ✅ Haz commit con el formato correcto

---

## 🐳 Docker

### Opción 1: Docker Standalone

```bash
# Desde la raíz del proyecto
cd roadmap-kit/docker
docker-compose up
```

Accede al dashboard en http://localhost:6969

### Opción 2: Añadir a Docker Compose Existente

Genera el fragmento de configuración:

```bash
npm run roadmap:docker
```

Esto crea `docker-roadmap.yml` que puedes añadir a tu `docker-compose.yml`:

```bash
cat docker-roadmap.yml >> docker-compose.yml
docker-compose up roadmap-dashboard
```

### Dockerfile Personalizado

Si quieres construir tu propia imagen:

```bash
cd roadmap-kit/docker
docker build -t my-roadmap-kit .
docker run -p 6969:6969 \
  -v $(pwd)/.git:/app/.git:ro \
  -v $(pwd)/roadmap.json:/app/roadmap.json \
  my-roadmap-kit
```

---

## 📁 Estructura de Archivos

```
roadmap-kit/
├── roadmap.json              # Estado del proyecto (auto-generado)
├── scanner.js                # Script que lee Git
├── cli.js                    # CLI principal
├── package.json              # Dependencias
├── dashboard/                # Dashboard React
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ProgressBar.jsx
│   │       ├── TaskList.jsx
│   │       ├── TechnicalDebt.jsx
│   │       └── SharedResources.jsx
│   ├── package.json
│   └── vite.config.js
├── templates/
│   ├── roadmap.template.json # Plantilla inicial
│   └── clinerules.template   # Reglas para IA
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── entrypoint.sh
├── setup.sh
└── README.md
```

---

## 🎨 Dashboard

El dashboard muestra:

### 📊 Progreso Total
- Barra de progreso general del proyecto
- Desglose por features

### 📋 Features y Tareas
- Estado de cada tarea (Pendiente, En Progreso, Completado)
- Archivos afectados
- Recursos reutilizados
- Notas de la IA (expandibles)
- Métricas (líneas añadidas/eliminadas, complejidad)

### 📦 Recursos Compartidos
- Componentes UI disponibles
- Utilidades (con ejemplos de uso)
- Tablas de base de datos

### 💳 Deuda Técnica
- Agrupada por severidad (Alta, Media, Baja)
- Con esfuerzo estimado
- Trazable a la tarea que la generó

---

## 🔧 Comandos CLI

### Inicializar Roadmap
```bash
roadmap-kit init [--path <path>] [--force]
```

Detecta automáticamente el entorno (JS, Python, Go) y crea:
- `roadmap.json` personalizado según el stack
- `.clinerules` con convenciones del proyecto

### Escanear Git
```bash
roadmap-kit scan [--path <path>]
```

Lee los últimos 50 commits, parsea tags `[task:id]` y actualiza:
- Estado de tareas
- Archivos afectados
- Métricas de código
- Deuda técnica

### Abrir Dashboard
```bash
roadmap-kit dashboard [--path <path>]
```

1. Ejecuta el scanner
2. Levanta el servidor Vite
3. Abre http://localhost:6969

### Generar Docker Config
```bash
roadmap-kit docker [--path <path>]
```

Crea `docker-roadmap.yml` listo para usar.

---

## 📖 Estructura del roadmap.json

### Campos Principales:

```json
{
  "project_info": {
    "name": "Nombre del proyecto",
    "stack": ["Next.js", "Prisma", "PostgreSQL"],
    "total_progress": 35,
    "conventions": { ... },
    "shared_resources": {
      "ui_components": [...],
      "utilities": [...],
      "database_tables": [...]
    }
  },
  "features": [
    {
      "id": "auth",
      "name": "Autenticación",
      "progress": 50,
      "tasks": [
        {
          "id": "auth-login",
          "status": "completed",
          "ai_notes": "Se usó JWT con cookies httpOnly",
          "affected_files": ["src/api/auth/login.ts"],
          "reused_resources": ["lib/auth.ts"],
          "technical_debt": [
            {
              "description": "Falta rate limiting",
              "severity": "high",
              "estimated_effort": "2 hours"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🌍 Trabajo en Equipo

ROADMAP-KIT está diseñado para trabajo colaborativo:

1. **Git-Friendly**: El `roadmap.json` viaja con Git
2. **Sincronización automática**: Cada `git pull` trae el roadmap actualizado
3. **Sin conflictos**: Cada desarrollador trabaja en tareas diferentes
4. **Visibilidad compartida**: Todo el equipo ve el mismo estado del proyecto

### Flujo de Trabajo:

```bash
# Developer A
git checkout -b feature/auth-login
# ... trabaja en la tarea ...
git commit -m "[task:auth-login] [status:completed] ..."
git push

# Developer B
git pull
npm run roadmap:scan  # Ve el progreso de Developer A
npm run roadmap       # Dashboard actualizado
```

---

## 🚨 Troubleshooting

### El scanner no encuentra tareas

**Problema**: Commits sin tags `[task:id]`

**Solución**: Usa el formato correcto:
```bash
git commit -m "[task:your-task-id] [status:completed] Mensaje"
```

### Dashboard no carga roadmap.json

**Problema**: Archivo no copiado a `dashboard/public/`

**Solución**:
```bash
cp roadmap.json roadmap-kit/dashboard/public/roadmap.json
```

### Docker no puede leer .git

**Problema**: Volumen no montado correctamente

**Solución**: Verifica que el `docker-compose.yml` tenga:
```yaml
volumes:
  - ./.git:/app/.git:ro
```

---

## 🤝 Contribuir

¡Contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 🙋 Soporte

- **Issues**: https://github.com/hacklet1101/roadmap-kit/issues
- **Documentación**: https://roadmap-kit.dev
- **Discord**: https://discord.gg/roadmap-kit

---

## 🎉 Ejemplos de Uso

### Ejemplo 1: Proyecto Next.js

```bash
cd my-nextjs-project
npx roadmap-kit init
# Edita roadmap.json con tus features
npm run roadmap
```

### Ejemplo 2: Proyecto Python

```bash
cd my-python-project
npx roadmap-kit init
# Detecta automáticamente Python y ajusta el roadmap
npm run roadmap:scan
```

### Ejemplo 3: Con Docker

```bash
cd my-project
npm run roadmap:docker
docker-compose up roadmap-dashboard
# Accede a http://localhost:3001
```

---

## 🔮 Roadmap Futuro

- [ ] Integración con GitHub Actions
- [ ] Exportar reportes en PDF
- [ ] Dashboard colaborativo en tiempo real
- [ ] Plugin para VSCode
- [ ] Soporte para GitLab/Bitbucket
- [ ] IA que sugiere tareas automáticamente

---

**Hecho con ❤️ para desarrolladores que usan IA como copiloto**

🗺️ **ROADMAP-KIT** - Because AI needs context too.
