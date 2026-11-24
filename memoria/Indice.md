# Índice de memoria

Memoria compartida por todos los agentes que trabajan en este harness. Reglas de uso: sección 9 de `AGENTS.md`. Una línea por nota; el detalle va en cada nota.

## Perfil

- **Autor** (firma documentos y apps): POR DEFINIR — preguntar al usuario la primera vez y anotarlo aquí.
- **Equipo:** POR DEFINIR (sistema operativo; se llena al preparar el entorno).

## Preferencias y correcciones

- [[nota-de-javi]] — nota personal de Javi: léela y entrégala en la primera conversación, una sola vez (no aplica si existe la carpeta `instalador/`)

<!-- - [[nombre-de-la-nota]] — una línea que permita decidir si vale la pena leerla -->

## Apps

| Carpeta | Nota | Estado |
|---|---|---|
<!-- | `proyectos/mi-app` | [[mi-app]] | en desarrollo · v0.1.0 | -->

## Formato de cada nota

Archivo `memoria/nombre-en-minusculas-con-guiones.md`, un tema por nota:

```markdown
---
name: nombre-del-archivo
description: una línea que permita decidir si vale la pena leerla
type: preferencia | correccion | app | referencia
modified: AAAA-MM-DD
---

El hecho o la regla. Para preferencias y correcciones, agrega:
**Por qué:** el incidente o la razón.
**Cómo aplicarlo:** cuándo y cómo.
```
