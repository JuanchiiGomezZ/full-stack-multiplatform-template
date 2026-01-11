# Flujo de Trabajo con Claude Code

## Overview

Este documento describe el flujo de trabajo establecido para el desarrollo de features utilizando Claude Code con modelos de Anthropic (planificación) y MiniMax (implementación). El proceso se divide en tres fases principales: planificación, clarificación e implementación.

## Fases del Flujo

```dot
digraph workflow {
    rankdir=LR;
    node [shape=box, style=rounded];

    Simple [label="Tareas Simples\n(Antigravity IDE)" style=fill:lightgray];
    Planning [label="2. Planificación\n(Anthropic Sonnet 4.5 / Opus 4.5)" style=fill:lightblue];
    Clarification [label="3. Clarificación de Gaps\n(MiniMax + Brainstorming)" style=fill:lightyellow];
    Implementation [label="4. Implementación\n(MiniMax + Execute Plan)" style=lightgreen;

    Simple -> Planning [label="Si requiere investigación"];
    Simple -> Clarification [label="Complejidad media"];
    Planning -> Clarification -> Implementation;
}
```

## Selección de Herramientas

El flujo de trabajo utiliza tres herramientas principales, seleccionadas según la complejidad de la tarea:

| Herramienta | Uso | Caso |
|-------------|-----|------|
| **Antigravity IDE** | Tareas simples y rápidas | Cambios menores, fixes triviales, refactorizaciones pequeñas |
| **Claude Code (Anthropic)** | Planificación e investigación | Features complejas que requieren investigación, Context7, web search |
| **Claude Code (MiniMax)** | Implementación de planes | Cuando el plan ya está claro y validado |

### Regla de decisión

```
┌─────────────────────────────────────────────────────┐
│ ¿Es un cambio simple/trivial?                       │
│   SÍ → Antigravity IDE                              │
│   NO  → ¿Requiere investigación/nuevas libs?        │
│           SÍ → Claude Code (Anthropic)              │
│           NO  → Claude Code (MiniMax)               │
└─────────────────────────────────────────────────────┘
```

### Restricción de MiniMax

**MiniMax 2.1 no se utiliza para investigación** porque:
- Sus búsquedas web devuelven resultados en chino
- No puede usar MCPs de forma efectiva para documentación técnica en inglés/español

**MiniMax está reservado exclusivamente para:**
- Clarificación de gaps (con brainstorming)
- Implementación de planes ya validados
- Tareas de código puro

---

## 1. Planificación (Anthropic)

En esta fase se utiliza **Claude Code con modelos de Anthropic** (Sonnet 4.5 para complejidad media, Opus 4.5 para alta complejidad) para definir el alcance y diseño de la feature.

### Pasos

1. **Brainstorming inicial**: Se utiliza el skill `superpowers:brainstorming` para aclarar la idea, propósito y requisitos de la feature.

2. **Investigación**: Se emplean herramientas de apoyo:
   - **Context7 MCP**: Para consultar documentación actualizada de librerías y frameworks
   - **Web Search**: Para buscar información adicional cuando Context7 no es suficiente

3. **Planificación detallada**: Se utiliza el skill `superpowers:writing-plans` para crear un plan estructurado.

4. **Documentación del plan**: Se genera un archivo `.md` que contiene:
   - Descripción de la feature
   - Objetivos y criterios de éxito
   - Lista de tareas (TODOs) detallados
   - Consideraciones técnicas
   - Notas de investigación

### Resultado

Archivo de plan (ej: `docs/plans/PLAN_IMPLEMENTATION.md`) listo para revisión.

## 2. Clarificación de Gaps (MiniMax + Brainstorming)

En esta fase se utiliza **MiniMax 2.1** para revisar críticamente el plan creado por Anthropic e identificar partes faltantes o ambiguas.

### Proceso de "Ping Pong"

```dot
digraph pingpong {
    node [shape=box, style=rounded];
    rankdir=TB;

    MiniMax [label="MiniMax 2.1\n(Identifica gaps)" style=fill:lightyellow];
    Human [label="Yo (usuario)\n(Responde si puede)"];
    Anthropic [label="Anthropic\n(Responde y actualiza plan)" style=fill:lightblue];

    MiniMax -> Human [label="Preguntas sobre gaps"];
    Human -> MiniMax [label="Respuestas"];
    MiniMax -> Anthropic [label="Si no sé responder"];
    Anthropic -> Human [label="Respuestas + plan actualizado"];
    Human -> MiniMax [label="El plan fue actualizado"];
}
```

### Pasos

1. **Revisión del plan**: MiniMax lee el archivo de plan y lo analiza con el skill de brainstorming.

2. **Identificación de gaps**: MiniMax formula preguntas sobre:
   - Casos edge no considerados
   - Dependencias faltantes
   - Decisiones arquitectónicas ambiguas
   - Requisitos técnicos incompletos

3. **Resolución de preguntas**:
   - Si el usuario puede responder → responde directamente a MiniMax
   - Si el usuario no puede responder → copia la pregunta y la envía a Anthropic
   - Anthropic responde y **actualiza el plan** con las clarificaciones
   - El usuario avisa a MiniMax: "El plan fue actualizado"
   - MiniMax relee el plan y continúa identificando más gaps si es necesario

4. **Actualización del plan**: Cuando Anthropic responde a una pregunta, se le pide explícitamente que:
   - Responda la pregunta directamente
   - Actualice el archivo de plan (`@PLAN_IMPLEMENTATION.md`) con la clarificación
   - Mantenga el documento actualizado con todas las nuevas decisiones

5. **Iteración**: El proceso se repite hasta que MiniMax confirma que el plan está completo y sin ambigüedades.

### Resultado

Plan completo y validado con todas las clarificaciones incorporadas.

## 3. Implementación (MiniMax)

En esta fase, MiniMax 2.1 ejecuta el plan validado utilizando el skill `superpowers:executing-plans`.

### Pasos

1. **Configuración inicial**: Se proporciona contexto breve sobre la feature y se referencia el archivo de plan con `@PLAN_IMPLEMENTATION.md`.

2. **Validación de comprensión**: Se indica a MiniMax que use brainstorming para aclarar cualquier duda restante sobre el plan.

3. **Ejecución del plan**: Se utiliza el skill `superpowers:executing-plans` que:
   - Lee y valida el plan completo
   - Ejecuta las tareas en el orden definido
   - Utiliza skills específicos por stack cuando corresponda
   - Documenta el progreso en el archivo de plan (marcando TODOs completados)

### Skills de Implementación (Futuro)

En el futuro, se planean skills específicos por stack:
- `superpowers:implementing-frontend-web`: Para interfaces web
- `superpowers:implementing-backend`: Para APIs y servicios
- `superpowers:implementing-mobile`: Para aplicaciones móviles

Estos skills contendrán:
- Patrones arquitectónicos del proyecto
- Estructura de directorios
- Convenciones de código
- Reglas específicas del stack

## Herramientas y Recursos Utilizados

### Modelos de IA

| Modelo | Uso | Restricción |
|--------|-----|-------------|
| Anthropic Sonnet 4.5 | Planificación de complejidad media | Sin restricciones |
| Anthropic Opus 4.5 | Planificación de alta complejidad | Sin restricciones |
| MiniMax 2.1 | Implementación | **Solo implementación**, nunca investigación |

### MCPs (Machine Code Protocols)

**Solo disponibles y funcionales con Anthropic:**
- **Context7**: Para consultar documentación actualizada de librerías y frameworks
- **WebSearch**: Para buscar información adicional cuando Context7 no es suficiente

**Nota:** MiniMax no puede usar estos MCPs de forma efectiva.

### Skills de Claude Code

**Planificación:**
- `superpowers:brainstorming`: Para aclarar ideas y explorar alternativas
- `superpowers:writing-plans`: Para crear planes detallados

**Ejecución:**
- `superpowers:executing-plans`: Para ejecutar planes de implementación
- `superpowers:using-git-worktrees`: Para crear workspaces aislados (opcional)

**Revisión (pendiente de uso regular):**
- `superpowers:requesting-code-review`: Para revisión de código
- `superpowers:verification-before-completion`: Para verificación final

## Ejemplo de Flujo en Sesión

### Sesión 1 - Planificación (Anthropic Sonnet 4.5)

**Prompt al modelo:**
```
Necesito agregar autenticación con OAuth2 a la aplicación.
```

**Acciones ejecutadas:**
1. Invocar skill: `superpowers:brainstorming` para aclarar requisitos
2. Usar MCP: `context7` para consultar docs de NextAuth.js
3. Usar MCP: `WebSearch` si se necesita información adicional
4. Invocar skill: `superpowers:writing-plans` para crear plan estructurado
5. Generar archivo: `docs/plans/oauth2-authentication.md`

**Resultado:** Plan inicial creado con descripción, objetivos, TODOs y consideraciones técnicas.

---

### Sesión 2 - Clarificación de Gaps (MiniMax 2.1)

**Prompt al modelo:**
```
Revisa el plan en @docs/plans/oauth2-authentication.md y usa el skill superpowers:brainstorming para identificar gaps o partes faltantes.
```

**Acciones ejecutadas:**
1. MiniMax lee el archivo de plan
2. Invoca skill: `superpowers:brainstorming` para análisis crítico
3. Identifica gaps y formula preguntas
4. Si hay preguntas que el usuario no puede responder:

**Ping Pong con Anthropic:**
```
[Usuario copia pregunta de MiniMax y envía a Anthropic]
"Anthropic, tengo esta pregunta sobre el plan: [pregunta]. Por favor responde y actualiza el archivo @docs/plans/oauth2-authentication.md con la clarificación."
```

**Acciones de Anthropic:**
1. Responde la pregunta
2. Actualiza el archivo de plan con la clarificación

**Notificación a MiniMax:**
```
El plan fue actualizado con las clarificaciones. Por favor relee el archivo y continúa identificando gaps si los hay.
```

**Iteración:** MiniMax relee el plan actualizado y continúa hasta que no hay más gaps.

**Resultado:** Plan completo y validado con todas las clarificaciones incorporadas.

---

### Sesión 3 - Implementación (MiniMax 2.1)

**Prompt al modelo:**
```
Implementa la feature de OAuth2 según el plan en @docs/plans/oauth2-authentication.md.
invoca superpowers:executing-plans para ejecutar la implementación.
```

**Acciones ejecutadas:**
1. MiniMax lee el archivo de plan
2. Opcional: invoca skill: `superpowers:brainstorming` para aclarar dudas
3. Invoca skill: `superpowers:executing-plans` para ejecutar
4. Ejecuta los TODOs del plan en orden
5. Usa skills específicos según el stack (cuando estén disponibles)
6. Actualiza el archivo de plan marcando TODOs completados
7. Hace commits frecuentes en git

**Resultado:** Feature implementada, funcional y documentada.

## Beneficios del Flujo

1. **Calidad de planificación**: Anthropic (modelo más capable) se dedica a pensar y diseñar
2. **Detección temprana de gaps**: MiniMax revisa críticamente antes de implementar
3. **Costo-efectividad**: MiniMax es más económico para implementación
4. **Iteración controlada**: El ping-pong asegura que no falte nada
5. **Documentación automática**: El plan se convierte en documentación viva

## Consideraciones

- El flujo aplica a features de cualquier tamaño, aunque para tareas triviales el proceso puede simplificarse
- La fase de clarificación es crucial para evitar rework durante implementación
- Mantener el archivo de plan actualizado durante la implementación
