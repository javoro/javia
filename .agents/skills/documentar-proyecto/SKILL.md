---
name: documentar-proyecto
description: Crea y mantiene la documentación técnica y de reglas de negocio de cada app en su carpeta docs. Úsala al iniciar una app nueva y SIEMPRE al finalizar cualquier cambio técnico o de reglas de negocio, para dejar la documentación actualizada.
---

# Documentación obligatoria de proyectos

Al trabajar en cualquier app es **obligatorio** documentar tanto la descripción técnica como las reglas de negocio. Toda la documentación de una app vive en su carpeta `docs/`.

## Estructura por app

```
proyectos/{app}/docs/
├── PlanDeTrabajo.md        (rol arquitecto; una sección por pendiente)
├── PlanDePruebas.md        (rol qa; una ronda por ejecución)
├── DescripcionTecnica.md   (rol documentador)
├── ReglasDeNegocio.md      (rol documentador)
├── ManualDeUsuario.md      (opcional; rol documentador)
└── capturas/               (evidencia de QA: NN-caso-descripcion.png)
```

`PRODUCT.md` y `DESIGN.md` van en la raíz de la app y los mantiene la skill `impeccable`.

## Reglas de creación y mantenimiento (OBLIGATORIAS)

1. **Al iniciar una app nueva**, preguntar al usuario si desea crear la estructura y una primera versión de cada archivo. Solo crearlos cuando acepte.
2. **Los archivos se actualizan SIEMPRE que haya cambios técnicos o de reglas de negocio**, antes de dar por terminada la tarea. No es opcional ni se pospone.
3. **Nunca dejar una app sin documentación.** Si se detecta que no existe, sugerir crearla.
4. Aplica a todo tipo de cambio: módulos nuevos, correcciones, cambios de validación, de interfaz o de dependencias.
5. Se documenta lo que **realmente quedó** en el código (verificado leyéndolo), no lo que decía el plan.
6. Sobre un archivo existente se agregan secciones y se edita puntualmente; no se reescribe ni se borra lo anterior.
7. Fechas reales (consultar al sistema; formato DD/MM/AAAA), nunca un marcador sin llenar. Autor: el registrado en `memoria/Indice.md`.
8. Nunca escribir contraseñas, tokens ni cadenas de conexión: se anota dónde viven (nombre de la variable), no su valor.

## Formato de `DescripcionTecnica.md`

```markdown
# Descripción Técnica — {Nombre de la app}

> **Propósito:** qué hace la app y para quién, en dos líneas.

**Autor:** {autor}
**Fecha inicio:** DD/MM/AAAA
**Stack:** Electron + React + TypeScript (versiones en package.json)

---

## Módulo N — Nombre del módulo

### Qué se hizo
Descripción de lo implementado.

### Archivos creados/modificados
| Archivo | Cambio |
|---------|--------|
| `src/main/servicios/archivo.ts` | Descripción del cambio |

### Canales IPC
| Canal | Recibe | Devuelve |
|-------|--------|----------|
| `modulo:accion` | ... | ... |

### Datos y configuración
| Qué | Dónde vive | Valor inicial | Quién lo mantiene |
|-----|-----------|---------------|-------------------|

### Reglas de negocio aplicadas
- Regla 1

### Decisiones y trampas
Qué se intentó y no funcionó, y por qué quedó así (para no repetirlo).
```

## Formato de `ReglasDeNegocio.md`

```markdown
# Reglas de Negocio — {Nombre de la app}

> **Propósito:** documenta las reglas implementadas, en lenguaje de negocio. Sirve de base para QA, el manual y quien reciba la app.

**Autor:** {autor}
**Fecha inicio:** DD/MM/AAAA

---

## Módulo N — Nombre del módulo

| # | Regla | Descripción |
|---|-------|-------------|
| 1 | Nombre de la regla | Descripción funcional (no técnica) del comportamiento. |
```
