1. Qué es este workflow, en una frase

Arquitectura de contexto por capas: mantener un “núcleo” pequeño siempre cargado (memoria del proyecto), y mover el resto a módulos (skills y subagentes) que se activan solo cuando hace falta, para bajar tokens y alucinaciones.

En el video lo plantean así: el archivo “cultural” del proyecto existe porque la codebase puede ser enorme y el agente necesita guía para no improvisar.

El Sistema de Skills que Cambio…

2. Problema que resuelve (WHY)
   Síntomas típicos

El agente “programa por intuición” y se inventa patrones.

Pide o usa demasiado contexto, suben tokens y errores.

Cambia cosas fuera de scope.

Causa raíz

No hay una “cultura ejecutable” del repo: rutas, convenciones, estilos, decisiones, límites. El agente no sabe qué es normal en ese código, entonces rellena huecos.

El antídoto

Memoria concisa (AgentMD/CLAUDE.md) con reglas y mapa.

Skills para reglas específicas (Next, Nest, commits, tests, etc.).

Subagentes para exploración y tareas paralelas sin ensuciar el hilo principal (vuelven con un resumen).

El Sistema de Skills que Cambio…

(Claude Code lo formaliza como subagents para preservar contexto, especializar y controlar costos).

3. Las piezas del sistema (qué es cada cosa)
   A) Memoria del proyecto (AgentMD / CLAUDE.md)

Un markdown pensado para agentes: cómo está organizado el repo, cómo se trabaja, qué no se toca, comandos, definiciones. En el video: “README es para humanos; AgentMD es para agentes”.

El Sistema de Skills que Cambio…

Regla crucial: corto.
El video recomienda ~250 líneas, 500 máximo; más grande suele empeorar por sobrecarga cognitiva del modelo.

El Sistema de Skills que Cambio…

En Claude Code, estos archivos de memoria se cargan automáticamente y se pueden modularizar con reglas en .claude/rules/\*.md.

B) Skills

“Mini-manuales” que se activan por intención: “crear endpoint”, “server actions”, “react component”, “write tests”, etc.

El video explica que cada skill tiene metadata (nombre/trigger/herramientas/scope) y contenido con convenciones y pasos.

El Sistema de Skills que Cambio…

Claude Code define las skills como markdown reutilizable; se aplican automáticamente cuando el pedido coincide con su propósito, y pueden incluir scripts/recursos.

C) Subagentes (orquestador + workers)

El orquestador delega exploración/ediciones masivas/escaneo de patrones a subagentes con contexto aislado, y recibe solo un resumen.

El Sistema de Skills que Cambio…

Claude Code lo presenta igual: sirven para preservar contexto, imponer restricciones, especializar y hasta rutar tareas a modelos más baratos/rápidos.

D) “Autoinvocación” (la pieza que hace que funcione)

El video es explícito: si no obligás la carga de skills (por reglas en el AgentMD root y por área), muchos modelos las tratan como sugerencia y el sistema se cae.

4. El principio de diseño: “Contexto mínimo viable + contexto bajo demanda”

Pensalo como una biblioteca:

Índice (root memory): dónde está todo + reglas globales.

Capítulos (memorias por área): UI/API/DB/Mobile… cada una con su cultura local.

Libros técnicos (skills): cómo hacer tareas concretas sin reinventar la rueda.

Investigadores (subagentes): exploran y vuelven con hallazgos.

El video incluso propone el patrón “agents root” en monorepos: un root que enruta hacia memorias por carpeta/feature.

5. Cómo aplicarlo a cualquier repo: implementación paso a paso
   Paso 1: Particionar el repo (si es grande)

Si el repo es pequeño, basta un solo archivo de memoria.
Si es mediano/grande o monorepo: root + memorias por área (UI/API/Auth/Mobile/etc.).

Criterios para separar:

Tecnologías distintas (Next vs Nest vs RN).

Reglas distintas (DB/migrations vs UI style).

Riesgo distinto (auth/pagos).

Paso 2: Escribir la memoria root (30–60 líneas “de acero”)

Contenido recomendado:

Mapa del repo (carpetas importantes).

Reglas no negociables:

“No inventes patrones. Busca uno existente primero.”

“No dependencias nuevas / no refactors masivos sin pedir permiso.”

Flujo estándar de trabajo (operación diaria):

explorar → cuestionario → plan → implementar → verificar

Routing de skills (tabla “si pasa X, usa skill Y”) para autoinvocar.

En Claude Code, la memoria del proyecto puede estar en ./CLAUDE.md o ./.claude/CLAUDE.md y se carga automáticamente.

Paso 3: Escribir memorias por área (50–150 líneas cada una)

Ejemplo de secciones:

“Cómo ubicamos componentes/screens/endpoints”

“Naming y estructura”

“Patrones obligatorios” (validaciones, errores, estado de UI, navegación)

“Comandos locales” (lint/test/build)

“Skills relevantes para esta área” (y cuándo dispararlas)

Paso 4: Inventariar tareas repetitivas → crear skills

Lista de tareas típicas que siempre te generan alucinaciones:

crear endpoint

modificar endpoint

nuevo componente UI

nueva screen mobile

nueva integración

escribir tests unitarios

commits convencionales

Cada una puede ser una skill, o agrupar 2–3 si comparten patrón.

Paso 5: Diseñar cada skill para “one-shot correcto”

El video remarca: ejemplos + templates + docs dentro de la skill aumentan mucho el acierto.

El Sistema de Skills que Cambio…

Claude Code también permite que una skill incluya scripts y recursos.

Estructura recomendada de una skill:

(A) Metadata

name

description (lo más importante: keywords que disparen bien)

(opcional) compat/licencia/metadata

(B) “Workflow”

“Primero encontrá 2–3 referencias en el repo”

“Luego preguntá X (si hay ambigüedad)”

“Proponé plan”

“Implementá copiando patrón”

“Verificá (lint/tests)”

(C) Reglas

Qué NO se permite (deps/refactors/arquitectura).

Qué sí es obligatorio (naming, ubicación, error style).

(D) Recursos

templates (snippets)

ejemplos reales (paths)

links a docs internas del repo

Paso 6: Crear subagentes “de oficio”

El video propone subagentes para exploración y tareas paralelas, sin ensuciar el main context.

El Sistema de Skills que Cambio…

Claude Code trae built-ins como Explore y Plan, y podés crear custom subagents con descripciones claras para delegación automática.

Subagentes típicos (sirven en casi cualquier repo):

Pattern Miner: busca implementaciones similares y devuelve un reporte con paths.

Impact Scoper: estima archivos afectados y riesgos, sin escribir código.

Style Auditor: revisa consistencia (naming/format/UI conventions).

Paso 7: Mantenimiento: “crear skill” + “sync”

El video muestra dos ideas potentes:

una skill para crear skills siguiendo template

otra para sincronizar referencias (scope → dónde se lista)

No es obligatorio automatizarlo desde el día 1, pero sí tener una regla:
cada skill nueva debe aparecer en el routing (root o área), si querés autoinvocación confiable.

El Sistema de Skills que Cambio…

6. “Runbook” operativo: cómo se usa en el día a día

Este es el flujo estándar recomendado (muy cercano al ejemplo del video, donde primero exploran, resumen, y recién después preguntan/implementan).

1. Recepción de tarea

“Necesito X” (endpoint, componente, screen, integración)

2. Delegación de exploración (subagente)

buscar patrones existentes

listar referencias (paths)

resumir “cómo se hace acá”

3. Cuestionario mínimo (solo si hay ambigüedad)

El objetivo es cerrar decisiones, no hacer terapia.

4. Plan de implementación

archivos a tocar

pasos

riesgos

“Definition of Done”

5. Implementación con skill específica

La skill dicta el método y las restricciones.

6. Verificación

lint/format/tests unitarios simples.

7. Entrega

resumen de cambios + checklist.

7. Cómo evitar que el sistema se rompa (pitfalls reales)
   Pitfall 1: Memoria enorme

“Más contexto” suele empeorar: el video lo dice explícito (250/500 líneas).

El Sistema de Skills que Cambio…

Solución: modularizar por área + skills.

Pitfall 2: Skills “bonitas” que nunca se activan

Si la descripción/trigger es genérica, no dispara.
Solución: routing explícito en la memoria (“si tarea contiene X, usa skill Y”) como recomienda el video.

Pitfall 3: Skills sin ejemplos

Sin ejemplos, el agente inventa.
Solución: meter paths reales, plantillas y referencias (video: “cuanto más ejemplo le des, mejor”).

El Sistema de Skills que Cambio…

Pitfall 4: No poner “gates” de seguridad

Vos dijiste que no querés deps nuevas ni refactors masivos. Eso tiene que vivir como “ley”, idealmente en:

memoria root (regla global)

y una skill “safety gate” que obligue a pedir confirmación.

Pitfall 5: Subagentes sin contrato de salida

Si no pedís un formato de salida, vuelven con novela.
Solución: exigir “Resumen + lista de archivos + recomendaciones”.

8. Plantillas genéricas (para cualquier herramienta)
   A) Plantilla de memoria root (AgentMD / CLAUDE.md)

# Project DNA (Root)

## Repo map

- Where is API:
- Where is Web:
- Where is Mobile:
- Where is DB/migrations:
- Where are shared libs:

## Non-negotiables

- Follow existing patterns. Do not invent architecture.
- No new dependencies, no major refactors, no architecture changes unless explicitly approved.
- Explore first (find similar code) before writing.

## Default workflow

1. Delegate exploration to a subagent (patterns + file paths).
2. Ask a short questionnaire if requirements are ambiguous.
3. Propose a plan (files, steps, risks).
4. Implement using the relevant skill.
5. Run lint/format + minimal unit tests.

## Skill routing (auto-invoke rules)

- "endpoint/controller/service/dto" -> API skill
- "component/page/ui" -> Web UI skill
- "screen/navigation/expo" -> Mobile skill
- "migration/model/schema" -> DB skill
- "commit" -> Conventional commits skill
- "new dependency/refactor/architecture" -> Safety gate skill

## B) Plantilla de skill (SKILL.md)

name: <skill-name>
description: Use when <keywords/tasks>. Goal: <outcome>.

---

# Purpose

What this skill enforces and why.

# Workflow

1. Find 2-3 similar implementations in the repo (paths).
2. Extract project patterns (naming, structure, validations, styles).
3. If ambiguous: ask the short questionnaire.
4. Propose plan.
5. Implement by mirroring patterns.
6. Verify (lint/tests).

# Rules (hard constraints)

- No new deps unless explicitly approved.
- No architectural changes unless explicitly approved.
- Keep diffs minimal.

# Templates / Examples

- Template snippets
- Real repo examples (paths)

C) Plantilla de subagente “Pattern Miner”

# Pattern Miner (Subagent)

Goal: Find existing patterns and references without writing code.

Output format:

- Summary (5-10 bullets)
- Relevant file paths (with short notes)
- Recommended pattern to follow
- Risks / gotchas

9. Nota “multi-tool” (porque el video lo menciona)

El video comenta que distintas herramientas esperan nombres distintos (AgentMD vs claude.md) y propone un script de setup + symlinks para compartir skills entre herramientas y evitar duplicar carpetas.

La idea general (tool-agnostic) es:

mantener una fuente única (skills + memorias)

tener “adaptadores” por herramienta (nombres/rutas/formatos)

automatizar instalación/sync para no hacerlo a mano

10. Checklist de “está bien aplicado” (sanity check)

Si lo implementás en un repo cualquiera, debería cumplirse:

La memoria root es corta y enruta a memorias por área (si aplica).

Cada tarea típica tiene una skill con:

triggers claros

ejemplos reales

reglas y DoD

El agente primero explora (subagente), vuelve con paths, y recién ahí implementa.

Hay “safety gates” para deps/arquitectura/refactors.

El sistema se mantiene: skill nueva → aparece en routing (manual o sync).
