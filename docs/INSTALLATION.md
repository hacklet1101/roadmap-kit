# Guia de Instalacion de ROADMAP-KIT

## Metodos de Instalacion

### Metodo 1: Copiar la carpeta (Recomendado para desarrollo)

```bash
# Desde la raiz de tu proyecto
git clone https://github.com/hacklet1101/roadmap-kit.git roadmap-kit

# Instalar dependencias del dashboard
cd roadmap-kit/dashboard
npm install
```

### Metodo 2: Script de instalacion

```bash
# Desde la raiz de tu proyecto
curl -sSL https://raw.githubusercontent.com/hacklet1101/roadmap-kit/main/install.sh | bash
```

---

## Estructura Final

Despues de instalar, tu proyecto deberia verse asi:

```
mi-proyecto/
├── .clinerules              <- Reglas para Claude/Cline (desplegado desde dashboard)
├── .cursorrules             <- Reglas para Cursor (opcional)
├── src/
├── package.json
└── roadmap-kit/
    ├── roadmap.json         <- Estado del proyecto
    ├── .env                 <- Credenciales (opcional)
    ├── cli.js
    ├── scanner.js
    ├── docs/
    └── dashboard/
        ├── server.js
        └── src/
```

---

## Configuracion Inicial

### 1. Editar roadmap.json

Abre `roadmap-kit/roadmap.json` y configura:

```json
{
  "project_info": {
    "name": "Nombre de tu proyecto",
    "version": "1.0.0",
    "description": "Descripcion breve",
    "purpose": "Objetivo principal del proyecto",
    "stack": ["React", "Node.js", "PostgreSQL"],
    "architecture": "Descripcion de la arquitectura",
    "conventions": {
      "naming": {
        "variables": "camelCase",
        "components": "PascalCase"
      },
      "file_structure": "Descripcion de estructura",
      "database": "Convenciones de BD",
      "styling": "TailwindCSS"
    }
  }
}
```

### 2. Configurar autenticacion (opcional)

Edita `roadmap-kit/.env`:

```env
ROADMAP_AUTH_ENABLED=true
ROADMAP_USER=admin
ROADMAP_PASSWORD=tu_contraseña_segura
PORT=3001
```

### 3. Iniciar el Dashboard

```bash
cd roadmap-kit/dashboard
npm run dev
```

Abre http://localhost:3001

### 4. Desplegar archivos de configuracion

1. Ve a la pestana "Configuracion"
2. Revisa/edita el contenido de .clinerules
3. Haz clic en "Desplegar Archivos"
4. Los archivos .clinerules y roadmap.json se copiaran a tu proyecto

---

## Despliegue en Servidor (Produccion)

### Con Docker

```bash
# Desde la carpeta roadmap-kit
docker build -t roadmap-kit .
docker run -d -p 3001:3001 -v $(pwd):/app roadmap-kit
```

### Con PM2 (Node.js)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar el dashboard
cd roadmap-kit/dashboard
pm2 start server.js --name roadmap-kit

# Ver logs
pm2 logs roadmap-kit

# Reiniciar
pm2 restart roadmap-kit
```

### Con Nginx (Reverse Proxy)

Ver la guia completa en [NGINX.md](./NGINX.md)

---

## Comandos Utiles

```bash
# Iniciar dashboard
cd roadmap-kit/dashboard && npm run dev

# Escanear commits de Git
node roadmap-kit/scanner.js

# Actualizar dependencias
cd roadmap-kit/dashboard && npm update
```

---

## Troubleshooting

### Error: "EADDRINUSE: address already in use"

```bash
# Matar proceso en el puerto 3001
lsof -ti:3001 | xargs kill -9
```

### Error: "roadmap.json not found"

Asegurate de que `roadmap-kit/roadmap.json` existe y tiene contenido valido.

### Dashboard no carga

1. Verifica que el servidor esta corriendo: `lsof -i:3001`
2. Revisa los logs en la terminal
3. Verifica que las dependencias estan instaladas: `npm install`

---

## Integracion con IAs

### Claude / Cline

1. Despliega `.clinerules` a la raiz de tu proyecto
2. Claude lo leera automaticamente al iniciar sesion

### Cursor

1. Despliega `.cursorrules` a la raiz de tu proyecto
2. Cursor lo leera automaticamente

### Otros

Copia el contenido de `.clinerules` y pegalo en el contexto de la IA que uses.
