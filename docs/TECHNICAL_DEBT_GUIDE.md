# Guia de Deuda Tecnica para IA

## Que es la Deuda Tecnica?

La deuda tecnica son atajos o soluciones temporales que funcionan pero que deben mejorarse en el futuro. La IA DEBE registrar toda deuda tecnica que genere o detecte.

---

## Tipos de Deuda Tecnica a Capturar

### 1. Hardcoding (Severidad: HIGH)

**Que es:** Valores escritos directamente en el codigo que deberian estar en configuracion.

**Ejemplos:**
- URLs de API escritas directamente
- Claves API o secrets en el codigo
- Valores magicos (numeros, strings) sin explicacion
- Configuraciones especificas del entorno

**Como reportar:**
```json
{
  "description": "URL de API hardcodeada en fetch(). Mover a .env como NEXT_PUBLIC_API_URL",
  "severity": "high",
  "estimated_effort": "15min"
}
```

**Formato de commit:**
```bash
git commit -m "[task:api-client] [status:completed] [debt:API URL hardcodeada - mover a .env|high|15min] Implementa cliente de API"
```

---

### 2. Falta de Validacion (Severidad: HIGH/MEDIUM)

**Que es:** Datos que entran al sistema sin verificar su formato o contenido.

**Ejemplos:**
- Formularios sin validacion de campos
- API endpoints que no validan el body
- Queries a DB sin sanitizar inputs
- Archivos subidos sin verificar tipo/tamano

**Como reportar:**
```json
{
  "description": "Endpoint POST /users no valida email ni password. Anadir validacion con Zod",
  "severity": "high",
  "estimated_effort": "1h"
}
```

---

### 3. Codigo Duplicado (Severidad: MEDIUM)

**Que es:** La misma logica repetida en multiples lugares.

**Ejemplos:**
- Funciones de formateo copiadas en varios archivos
- Logica de autenticacion repetida
- Estilos CSS duplicados
- Queries de base de datos identicas

**Como reportar:**
```json
{
  "description": "Funcion formatDate() duplicada en 3 archivos. Refactorizar a lib/utils.ts",
  "severity": "medium",
  "estimated_effort": "30min"
}
```

---

### 4. Falta de Tests (Severidad: MEDIUM)

**Que es:** Codigo que funciona pero no tiene pruebas automatizadas.

**Ejemplos:**
- Funciones de logica de negocio sin unit tests
- Endpoints de API sin integration tests
- Componentes UI sin tests de renderizado
- Flujos criticos sin e2e tests

**Como reportar:**
```json
{
  "description": "Logica de calculo de descuentos sin tests. Anadir unit tests con Jest",
  "severity": "medium",
  "estimated_effort": "2h"
}
```

---

### 5. Falta de Manejo de Errores (Severidad: HIGH)

**Que es:** Codigo que no contempla casos de error.

**Ejemplos:**
- fetch() sin try/catch
- Promesas sin .catch()
- Operaciones de DB que pueden fallar
- Llamadas a APIs externas sin timeout

**Como reportar:**
```json
{
  "description": "fetch() a API externa sin try/catch ni timeout. Agregar manejo de errores",
  "severity": "high",
  "estimated_effort": "30min"
}
```

---

### 6. Falta de Logging (Severidad: LOW/MEDIUM)

**Que es:** Codigo que no registra eventos importantes.

**Ejemplos:**
- Errores que se ignoran silenciosamente
- Operaciones criticas sin log
- Falta de trazabilidad en produccion

**Como reportar:**
```json
{
  "description": "Errores de pago no se loggean. Agregar logging con lib/logger.ts",
  "severity": "medium",
  "estimated_effort": "30min"
}
```

---

### 7. Seguridad (Severidad: HIGH)

**Que es:** Vulnerabilidades potenciales de seguridad.

**Ejemplos:**
- SQL injection posible
- XSS no sanitizado
- CORS abierto a todos los origenes
- Passwords no hasheados

**Como reportar:**
```json
{
  "description": "Endpoint vulnerable a SQL injection. Usar parametros preparados",
  "severity": "high",
  "estimated_effort": "1h"
}
```

---

### 8. Performance (Severidad: MEDIUM/LOW)

**Que es:** Codigo que funciona pero es ineficiente.

**Ejemplos:**
- Queries N+1 a la base de datos
- Componentes que re-renderizan innecesariamente
- Falta de paginacion en listados
- Imagenes sin optimizar

**Como reportar:**
```json
{
  "description": "Query N+1 al cargar usuarios con sus posts. Usar populate/include",
  "severity": "medium",
  "estimated_effort": "45min"
}
```

---

### 9. Accesibilidad (Severidad: MEDIUM)

**Que es:** Barreras para usuarios con discapacidades.

**Ejemplos:**
- Imagenes sin alt text
- Formularios sin labels
- Contraste insuficiente
- Navegacion sin keyboard support

**Como reportar:**
```json
{
  "description": "Formulario de login sin labels asociados. Agregar labels y aria-labels",
  "severity": "medium",
  "estimated_effort": "30min"
}
```

---

### 10. Documentacion (Severidad: LOW)

**Que es:** Codigo sin explicacion suficiente.

**Ejemplos:**
- Funciones complejas sin comentarios
- APIs sin documentacion
- README desactualizado
- Tipos/interfaces sin JSDoc

**Como reportar:**
```json
{
  "description": "Funcion calculateDiscount() compleja sin documentacion. Agregar JSDoc",
  "severity": "low",
  "estimated_effort": "15min"
}
```

---

## Severidades

| Severidad | Cuando usar | Accion |
|-----------|-------------|--------|
| **high** | Seguridad, datos corruptos, crashes | Arreglar ASAP |
| **medium** | Funcionalidad degradada, mantenibilidad | Arreglar pronto |
| **low** | Mejoras, optimizaciones | Arreglar cuando haya tiempo |

---

## Formato en roadmap.json

```json
{
  "technical_debt": [
    {
      "description": "Descripcion clara del problema y solucion sugerida",
      "severity": "high|medium|low",
      "estimated_effort": "15min|30min|1h|2h|4h|1d"
    }
  ]
}
```

---

## Formato en Commits

```bash
# Un item de deuda
git commit -m "[task:id] [status:completed] [debt:Descripcion|severity|effort] Mensaje"

# Multiples items
git commit -m "[task:id] [status:completed] [debt:Item 1|high|1h] [debt:Item 2|medium|30min] Mensaje"
```

---

## Checklist para la IA

Antes de marcar una tarea como completada, verifica:

- [ ] No hay URLs/claves hardcodeadas?
- [ ] Los inputs estan validados?
- [ ] No hay codigo duplicado que deberia ser compartido?
- [ ] Hay tests para la logica critica?
- [ ] Los errores estan manejados?
- [ ] Hay logging donde es necesario?
- [ ] No hay vulnerabilidades obvias?
- [ ] El codigo es performante?
- [ ] Es accesible?
- [ ] Esta documentado lo suficiente?

**Si alguna respuesta es NO, DEBES registrar la deuda tecnica.**
