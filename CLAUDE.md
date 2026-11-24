# CLAUDE.md

La especificación de este espacio de trabajo es `AGENTS.md`, común a todos los agentes:

@AGENTS.md

Particular de Claude Code:

- Los roles de `.agents/roles/` se lanzan como subagentes (herramienta Agent); al `desarrollador` se le pasa `model` según la complejidad de la tarea: `haiku` mecánica, `sonnet` normal, `opus` compleja.
- Las preguntas al usuario se hacen con AskUserQuestion, agrupadas (máximo 4 por llamada).
- Si `.claude/agents`, `.claude/rules` o `.claude/skills` no existen, corre `node scripts/preparar-entorno.mjs`.
