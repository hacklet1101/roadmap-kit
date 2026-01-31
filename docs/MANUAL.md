# ROADMAP-KIT - Manual de Uso

## Indice

1. [Inicio Rapido](#inicio-rapido)
2. [El Dashboard](#el-dashboard)
3. [Gestion de Features y Tareas](#gestion-de-features-y-tareas)
4. [Recursos Compartidos](#recursos-compartidos)
5. [Deuda Tecnica](#deuda-tecnica)
6. [Informacion del Proyecto](#informacion-del-proyecto)
7. [Configuracion y Despliegue](#configuracion-y-despliegue)
8. [Formato de Commits](#formato-de-commits)
9. [Trabajando con la IA](#trabajando-con-la-ia)

---

## Inicio Rapido

### 1. Iniciar el Dashboard

```bash
cd roadmap-kit/dashboard
npm install    # Solo la primera vez
npm run dev
```

### 2. Abrir en el navegador

Abre **http://localhost:3001**

### 3. Configurar y desplegar

1. Ve a la pestaña **"Configuracion"**
2. Revisa el contenido de `.clinerules`
3. Haz clic en **"Desplegar Archivos"**
4. Los archivos se copiaran a la raiz de tu proyecto

---

## El Dashboard

El dashboard tiene 5 pestañas principales:

| Pestaña | Icono | Funcion |
|---------|-------|---------|
| **Features** | ⚡ | Gestionar features y tareas |
| **Recursos** | 📦 | Ver componentes y utilidades compartidas |
| **Deuda Tecnica** | ⚠️ | Ver items de deuda pendientes |
| **Informacion** | ℹ️ | Stack, arquitectura y convenciones |
| **Configuracion** | ⚙️ | Editar y desplegar .clinerules |

### Barra Lateral

- **Logo ROADMAP**: Identidad de la app
- **Progreso**: Porcentaje de tareas completadas
- **Estadisticas**: Tareas listas, activas y pendientes
- **Navegacion**: Acceso a las 5 pestañas
- **Guardar Cambios**: Aparece cuando hay cambios sin guardar

### Cabecera

- **Nombre del proyecto** y version
- **Boton recargar**: Actualiza los datos desde el archivo
- **Boton salir**: Solo visible si la autenticacion esta activa

---

## Gestion de Features y Tareas

### Ver Features

1. Ve a la pestaña **"Features"**
2. Cada feature se muestra como una tarjeta expandible
3. Haz clic en una feature para ver sus tareas

### Filtrar Tareas

Usa los controles superiores:
- **Buscar**: Escribe para filtrar por nombre o descripcion
- **Estado**: Filtra por Todos/Pendiente/En Progreso/Completado

### Añadir una Nueva Feature

1. Haz clic en el boton **"+ Nueva Feature"**
2. Rellena el formulario:
   - **ID** (opcional): Identificador unico (ej: `user-auth`)
   - **Nombre**: Nombre de la feature (ej: "Autenticacion de Usuarios")
   - **Descripcion**: Que incluye esta feature
   - **Prioridad**: Alta, Media o Baja
3. Haz clic en **"Crear"**
4. **IMPORTANTE**: Haz clic en **"Guardar Cambios"** en la barra lateral

### Añadir una Tarea dentro de una Feature

1. Expande la feature haciendo clic en ella
2. Haz clic en **"+ Agregar Tarea"** (al final de la lista de tareas)
3. Rellena el formulario:
   - **Nombre**: Descripcion breve de la tarea
   - **Descripcion**: Detalles de implementacion
   - **Prioridad**: Alta, Media o Baja
4. Haz clic en **"Agregar"**
5. **IMPORTANTE**: Haz clic en **"Guardar Cambios"** en la barra lateral

### Cambiar el Estado de una Tarea

1. Localiza la tarea en la lista
2. Haz clic en el **icono de estado** (circulo a la izquierda):
   - ⚪ Gris = Pendiente
   - 🟡 Amarillo = En Progreso
   - 🟢 Verde = Completada
3. Cada clic cambia al siguiente estado
4. **IMPORTANTE**: Haz clic en **"Guardar Cambios"**

### Guardar Cambios

- El boton **"Guardar Cambios"** aparece cuando modificas algo
- Los cambios se guardan directamente en `roadmap.json`
- Si ves el mensaje "Guardado correctamente", los cambios estan persistidos

---

## Recursos Compartidos

Esta seccion muestra los recursos que la IA debe reutilizar.

### Componentes UI

Componentes React/Vue/etc. que ya existen:
- **Path**: Ruta del archivo
- **Descripcion**: Que hace el componente
- **Uso**: Como importar y usar

### Utilidades

Funciones y helpers compartidos:
- **Path**: Ruta del archivo
- **Exports**: Funciones exportadas
- **Uso**: Ejemplo de importacion
- **Warning**: Advertencias importantes

### Tablas de Base de Datos

Estructura de la base de datos:
- **Nombre**: Nombre de la tabla/coleccion
- **Campos**: Lista de columnas
- **Descripcion**: Proposito de la tabla

### Añadir Recursos

Los recursos se definen en `roadmap.json`:

```json
{
  "project_info": {
    "shared_resources": {
      "ui_components": [
        {
          "path": "components/ui/Button.tsx",
          "description": "Boton reutilizable",
          "usage": "<Button variant='primary'>Click</Button>"
        }
      ],
      "utilities": [
        {
          "path": "lib/api.ts",
          "description": "Cliente HTTP",
          "exports": ["get", "post", "put", "delete"],
          "usage": "import { get } from '@/lib/api'",
          "warning": "Siempre usar try/catch"
        }
      ],
      "database_tables": [
        {
          "name": "users",
          "fields": ["id", "email", "password", "role"],
          "description": "Tabla de usuarios"
        }
      ]
    }
  }
}
```

---

## Deuda Tecnica

Muestra los items de deuda tecnica registrados en las tareas.

### Severidades

| Color | Severidad | Accion |
|-------|-----------|--------|
| 🔴 Rojo | HIGH | Arreglar inmediatamente |
| 🟡 Amarillo | MEDIUM | Arreglar pronto |
| 🔵 Azul | LOW | Arreglar cuando haya tiempo |

### Ver Deuda por Tarea

Cada item muestra:
- Descripcion del problema
- Severidad
- Esfuerzo estimado
- Feature y tarea de origen

### Registrar Deuda

La deuda se registra:

1. **Desde el codigo**: La IA añade al completar una tarea
2. **En commits**: Usando el tag `[debt:descripcion|severidad|esfuerzo]`
3. **Manualmente**: Editando `roadmap.json`

Formato en `roadmap.json`:
```json
{
  "tasks": [{
    "technical_debt": [
      {
        "description": "Falta validacion en formulario",
        "severity": "high",
        "estimated_effort": "1h"
      }
    ]
  }]
}
```

---

## Informacion del Proyecto

Esta pestaña muestra la configuracion del proyecto.

### Stack Tecnologico

Lista de tecnologias usadas (React, Node.js, PostgreSQL, etc.)

### Arquitectura

Descripcion de como esta estructurado el proyecto.

### Convenciones

Reglas de codigo que la IA debe seguir:
- **Nomenclatura**: camelCase, PascalCase, etc.
- **Estructura de archivos**: Como organizar el codigo
- **Base de datos**: Convenciones de BD
- **Estilos**: TailwindCSS, CSS Modules, etc.
- **Manejo de errores**: Como gestionar errores

### Editar Informacion

Edita directamente `roadmap.json`:

```json
{
  "project_info": {
    "name": "Mi Proyecto",
    "version": "1.0.0",
    "description": "Descripcion del proyecto",
    "purpose": "Objetivo principal",
    "stack": ["React", "Node.js", "PostgreSQL"],
    "architecture": "Monorepo con API REST...",
    "conventions": {
      "naming": {
        "variables": "camelCase",
        "components": "PascalCase"
      },
      "file_structure": "src/features para cada modulo",
      "database": "Prisma con migraciones",
      "styling": "TailwindCSS",
      "error_handling": "Usar lib/errors.ts"
    }
  }
}
```

---

## Configuracion y Despliegue

### El archivo .clinerules

Este archivo contiene las instrucciones para la IA:
- Contexto del proyecto
- Reglas de operacion obligatorias
- Convenciones de codigo
- Recursos compartidos (NO duplicar)
- Guia de deuda tecnica
- Checklist pre-commit

### Ver y Editar

1. Ve a la pestaña **"Configuracion"**
2. El contenido de `.clinerules` se muestra abajo
3. Haz clic en **"Editar"** para modificar
4. Haz clic en **"Vista Previa"** para ver el resultado

### Desplegar Archivos

1. Ve a la pestaña **"Configuracion"**
2. Verifica la ruta del proyecto (se muestra arriba)
3. (Opcional) Marca "Crear tambien .cursorrules" si usas Cursor
4. Haz clic en **"Desplegar Archivos"**
5. Los archivos se copian a:
   - `.clinerules` → Raiz del proyecto
   - `.cursorrules` → Raiz del proyecto (si marcaste la opcion)
   - `roadmap.json` → `roadmap-kit/roadmap.json`

### Descargar Manualmente

Si prefieres copiar los archivos manualmente:
- **"Descargar .clinerules"**: Descarga el archivo
- **"Descargar .cursorrules"**: Descarga para Cursor
- **"Copiar"**: Copia al portapapeles

---

## Formato de Commits

Para que el scanner actualice automaticamente el roadmap:

### Formato Basico

```bash
git commit -m "[task:ID] [status:ESTADO] Descripcion"
```

### Tags Disponibles

| Tag | Valores | Ejemplo |
|-----|---------|---------|
| `[task:id]` | ID de la tarea | `[task:auth-login]` |
| `[status:estado]` | pending, in_progress, completed | `[status:completed]` |
| `[debt:desc\|sev\|effort]` | Deuda tecnica | `[debt:Falta validacion\|high\|1h]` |

### Ejemplos

```bash
# Completar una tarea
git commit -m "[task:auth-login] [status:completed] Implementa login con JWT"

# Tarea en progreso
git commit -m "[task:user-list] [status:in_progress] Añade listado basico"

# Con deuda tecnica
git commit -m "[task:api-users] [status:completed] [debt:Sin tests|medium|2h] CRUD usuarios"

# Multiples deudas
git commit -m "[task:checkout] [status:completed] [debt:Falta validacion|high|1h] [debt:Sin logging|low|30min] Proceso de pago"
```

### Sincronizar con Git

Despues de hacer commits:

```bash
node roadmap-kit/scanner.js
```

Esto actualiza automaticamente:
- Estado de las tareas
- Metricas (lineas, archivos)
- Deuda tecnica
- Progreso de features

---

## Trabajando con la IA

### Flujo Recomendado

1. **Antes de empezar**: La IA lee `.clinerules` y `roadmap.json`
2. **Durante el trabajo**: La IA consulta recursos compartidos
3. **Al terminar**: La IA actualiza el roadmap y hace commit con tags

### Lo que la IA debe hacer

1. ✅ Leer la descripcion de la tarea antes de empezar
2. ✅ Consultar recursos compartidos antes de crear codigo nuevo
3. ✅ Reutilizar componentes y utilidades existentes
4. ✅ Seguir las convenciones del proyecto
5. ✅ Registrar deuda tecnica si deja algo pendiente
6. ✅ Actualizar `roadmap.json` con sus cambios
7. ✅ Usar el formato de commit correcto

### Lo que la IA NO debe hacer

1. ❌ Crear componentes duplicados
2. ❌ Ignorar las convenciones
3. ❌ Olvidar registrar deuda tecnica
4. ❌ Hacer commits sin tags
5. ❌ Modificar recursos compartidos sin justificacion

---

## Atajos de Teclado

| Atajo | Accion |
|-------|--------|
| Clic en estado | Cambiar estado de tarea |
| Enter en formulario | Enviar formulario |
| Esc | Cerrar modal |

---

## Solucionar Problemas

### "No se pudo cargar roadmap.json"

- Verifica que `roadmap-kit/roadmap.json` existe
- Verifica que el servidor esta corriendo en el puerto correcto

### Los cambios no se guardan

- Asegurate de hacer clic en "Guardar Cambios"
- Verifica que el servidor tiene permisos de escritura

### El deploy no funciona

- Verifica la ruta del proyecto en la pestana Configuracion
- Si falla, usa "Descargar" y copia manualmente

### La IA no sigue las reglas

- Verifica que `.clinerules` esta en la raiz del proyecto
- Regenera el archivo desde el dashboard
- Reinicia la sesion de la IA

---

## Resumen de Archivos

| Archivo | Ubicacion | Proposito |
|---------|-----------|-----------|
| `roadmap.json` | `roadmap-kit/` | Estado del proyecto |
| `.clinerules` | Raiz del proyecto | Reglas para Claude/Cline |
| `.cursorrules` | Raiz del proyecto | Reglas para Cursor |
| `.env` | `roadmap-kit/` | Credenciales (opcional) |

---

**ROADMAP-KIT** - Because AI needs context too.
