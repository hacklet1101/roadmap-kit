import React, { useState } from 'react';
import { Settings, Download, FileCode, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';

/**
 * ProjectSettings Component
 * Manage project conventions and generate .clinerules file
 */
export default function ProjectSettings({ roadmap = {}, onReload }) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [conventions, setConventions] = useState(roadmap?.project_info?.conventions || {});

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Generate .clinerules content
  const generateClinerules = () => {
    const projectInfo = roadmap?.project_info || {};
    const { ui_components = [], utilities = [], database_tables = [] } = projectInfo.shared_resources || {};

    return `# Reglas del Proyecto: ${projectInfo.name || '[PROJECT_NAME]'}

## 🎯 Contexto General
${projectInfo.description || '[PROJECT_DESCRIPTION]'}

**Propósito:** ${projectInfo.purpose || '[PROJECT_PURPOSE]'}

## 📐 Arquitectura
${projectInfo.architecture || '[ARCHITECTURE_DESCRIPTION]'}

**Stack Tecnológico:**
${projectInfo.stack ? projectInfo.stack.map(tech => `- ${tech}`).join('\n') : '- [STACK_ITEMS]'}

---

## 🛠️ Sistema de Gestión de Proyecto (OBLIGATORIO)

Este proyecto utiliza **ROADMAP-KIT** para gestionar el progreso y mantener la coherencia.

### 📋 Reglas de Operación:

1. **📖 Consulta el Roadmap SIEMPRE:**
   - ANTES de empezar cualquier tarea, lee \`roadmap-kit/roadmap.json\`
   - Verifica el contexto, las dependencias y los recursos compartidos
   - Busca tu tarea específica por \`id\` y lee su \`description\`

2. **♻️ NO Duplicar - Reutilizar:**
   - Consulta la sección \`shared_resources\` en el JSON
   - Si una utilidad, componente o tabla DB ya existe, **DEBES reutilizarla**
   - Añade el recurso reutilizado a \`reused_resources\` de tu tarea
   - **NUNCA** crees componentes, funciones o tablas duplicadas

3. **📝 Actualización Post-Tarea:**
   Al finalizar una tarea, actualiza el \`roadmap.json\` con:
   - \`status\`: "completed" (o "in_progress" si no terminaste)
   - \`ai_notes\`: Explica QUÉ decisiones tomaste y POR QUÉ
   - \`affected_files\`: Lista TODOS los archivos que creaste o modificaste
   - \`reused_resources\`: Lista los recursos compartidos que usaste
   - \`technical_debt\`: Si dejaste algo pendiente, "sucio" o temporal, anótalo aquí con severidad (high/medium/low) y esfuerzo estimado

4. **🔖 Formato de Commit:**
   Cada vez que termines una tarea, genera un commit con este formato EXACTO:
   \`\`\`
   [task:ID_DE_LA_TAREA] [status:completed] Breve descripción del cambio
   \`\`\`

   Ejemplos:
   \`\`\`
   [task:auth-login] [status:completed] Implementa endpoint de login con JWT
   [task:user-list] [status:in_progress] [debt:Falta paginación] Añade listado básico
   \`\`\`

5. **⚠️ Reportar Deuda Técnica:**
   Si detectas algo que debe mejorarse pero no tienes tiempo ahora:
   \`\`\`
   [task:payment-api] [status:completed] [debt:Falta validación de tarjetas] [debt:Sin logs centralizados] Implementa endpoint de pagos
   \`\`\`

---

## 📝 Convenciones de Código

### Nomenclatura
${conventions.naming ? Object.entries(conventions.naming).map(([key, value]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`).join('\n') : `- **Variables y funciones**: camelCase
- **Componentes**: PascalCase
- **Archivos**: kebab-case
- **Constantes**: UPPER_SNAKE_CASE`}

### Estructura de Archivos
${conventions.file_structure || '[FILE_STRUCTURE_DESCRIPTION]'}

### Base de Datos
${conventions.database || '[DATABASE_CONVENTIONS]'}

### Estilos
${conventions.styling || '[STYLING_CONVENTIONS]'}

### Manejo de Errores
${conventions.error_handling || '[ERROR_HANDLING_CONVENTIONS]'}

---

## 🚫 Recursos Compartidos (NO DUPLICAR)

### Componentes UI Existentes
**ANTES de crear un nuevo componente UI, verifica si ya existe uno similar:**

${ui_components.length > 0 ? ui_components.map(comp => `- \`${comp.path}\` - ${comp.description}
  - Uso: \`${comp.usage || 'N/A'}\``).join('\n\n') : '*(No hay componentes UI registrados aún)*'}

### Utilidades Existentes
**SIEMPRE importar estas utilidades. NO duplicar lógica:**

${utilities.length > 0 ? utilities.map(util => `- \`${util.path}\` - ${util.description}
  - Exports: ${util.exports ? util.exports.map(e => `'${e}'`).join(', ') : 'N/A'}
  - Uso: \`${util.usage || 'N/A'}\`${util.warning ? `\n  - ⚠️ **IMPORTANTE**: ${util.warning}` : ''}`).join('\n\n') : '*(No hay utilidades registradas aún)*'}

### Base de Datos
**Tablas existentes:**

${database_tables.length > 0 ? database_tables.map(table => `- \`${table.name}\` (${table.fields.join(', ')})
  - ${table.description}`).join('\n\n') : '*(No hay tablas registradas aún)*'}

**IMPORTANTE:** NO crear nuevas tablas sin consultar el roadmap y actualizar \`shared_resources\`.

---

## 🔄 Flujo de Trabajo

1. **Inicio de Tarea:**
   \`\`\`bash
   # Lee el roadmap
   cat roadmap-kit/roadmap.json
   # Busca tu tarea por ID
   \`\`\`

2. **Durante el Desarrollo:**
   - Reutiliza componentes y utilidades existentes
   - Sigue las convenciones de nomenclatura
   - NO refactorices código que no está relacionado con tu tarea

3. **Al Finalizar:**
   \`\`\`bash
   # Actualiza el roadmap.json (campos: status, ai_notes, affected_files, etc.)
   # Haz commit con el formato correcto
   git add .
   git commit -m "[task:tu-task-id] [status:completed] Descripción del cambio"
   \`\`\`

4. **Sincronización:**
   \`\`\`bash
   # El scanner automático leerá tu commit y actualizará métricas
   npm run roadmap:scan
   \`\`\`

---

## 📊 Visualización del Progreso

Para ver el estado del proyecto:

\`\`\`bash
npm run roadmap              # Abre el dashboard visual
npm run roadmap:scan         # Actualiza desde Git
\`\`\`

O con Docker:
\`\`\`bash
docker-compose up roadmap-dashboard
\`\`\`

---

## ✅ Checklist Antes de Cada Commit

- [ ] ¿Leí la descripción de mi tarea en roadmap.json?
- [ ] ¿Verifiqué que no estoy duplicando componentes/utilidades existentes?
- [ ] ¿Seguí las convenciones de nomenclatura del proyecto?
- [ ] ¿Actualicé el roadmap.json con mis cambios?
- [ ] ¿Añadí ai_notes explicando mis decisiones?
- [ ] ¿Listé todos los affected_files?
- [ ] ¿Reporté la technical_debt si existe?
- [ ] ¿Usé el formato correcto de commit \`[task:id] [status:...]\`?

---

**🗺️ ROADMAP-KIT** - Because AI needs context too.

Última sincronización: ${projectInfo.last_sync ? new Date(projectInfo.last_sync).toLocaleString() : 'Nunca'}
`;
  };

  const downloadClinerules = () => {
    const content = generateClinerules();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.clinerules';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const projectInfo = roadmap?.project_info || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Settings className="w-6 h-6" />
                Configuración del Proyecto
              </CardTitle>
              <CardDescription className="mt-2">
                Gestiona las convenciones y genera el archivo .clinerules para Claude/Cursor/Cline
              </CardDescription>
            </div>
            <button
              onClick={onReload}
              className="p-3 hover:bg-purple-500/10 rounded-lg transition-all hover:scale-105"
              title="Recargar"
            >
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-sm text-slate-400 mb-1">Nombre del Proyecto</h3>
            <p className="text-lg font-semibold text-slate-100">{projectInfo.name || 'Sin nombre'}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-sm text-slate-400 mb-1">Versión</h3>
            <p className="text-lg font-semibold text-slate-100">{projectInfo.version || '1.0.0'}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-sm text-slate-400 mb-1">Stack</h3>
            <p className="text-lg font-semibold text-slate-100">
              {projectInfo.stack ? projectInfo.stack.length : 0} tecnologías
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate .clinerules */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            Generar .clinerules
          </CardTitle>
          <CardDescription>
            Archivo de configuración para que Claude/Cursor/Cline siga las reglas del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={downloadClinerules}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar .clinerules
            </button>

            <button
              onClick={() => copyToClipboard(generateClinerules(), 'clinerules')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {copiedSection === 'clinerules' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar al Portapapeles
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700/50 max-h-96 overflow-y-auto scrollbar-dark">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
              {generateClinerules()}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Conventions */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle>Convenciones del Proyecto</CardTitle>
          <CardDescription>
            Define las reglas de nomenclatura y estructura que la IA debe seguir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {/* Naming */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <AccordionItem value="naming" className="border-none">
                <AccordionTrigger className="hover:no-underline px-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span>Nomenclatura</span>
                    <Badge variant="secondary">{Object.keys(conventions.naming || {}).length} reglas</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 space-y-2">
                    {conventions.naming && Object.entries(conventions.naming).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                        <span className="text-sm text-slate-400">{key}:</span>
                        <code className="text-sm text-emerald-400">{value}</code>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* Architecture */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <AccordionItem value="architecture" className="border-none">
                <AccordionTrigger className="hover:no-underline px-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span>Arquitectura</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-300">{projectInfo.architecture || 'No definida'}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* File Structure */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <AccordionItem value="structure" className="border-none">
                <AccordionTrigger className="hover:no-underline px-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <span>Estructura de Archivos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-300">{conventions.file_structure || 'No definida'}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* Database */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <AccordionItem value="database" className="border-none">
                <AccordionTrigger className="hover:no-underline px-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-green-400" />
                    <span>Base de Datos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-300">{conventions.database || 'No definida'}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          </Accordion>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-900/10 border-blue-700/50">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">📖 Instrucciones de Instalación</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>1. Descarga o copia el contenido del archivo .clinerules</p>
            <p>2. Colócalo en la raíz de tu proyecto como <code className="text-emerald-400">.clinerules</code></p>
            <p>3. Si usas Cursor, renómbralo a <code className="text-emerald-400">.cursorrules</code></p>
            <p>4. Claude/Cursor/Cline leerá automáticamente estas reglas antes de generar código</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
