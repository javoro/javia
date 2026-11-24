---
name: nuevo-pendiente
description: Flujo obligatorio para trabajar cualquier pendiente, requerimiento, bug o app nueva - entendimiento con preguntas, plan con el rol arquitecto y aprobación del usuario, desarrollo con el rol desarrollador (nivel de modelo según complejidad), revisión, compuerta de verificación, pruebas con el rol qa sobre la app real, documentación con el rol documentador y, si el usuario lo acepta, manual de usuario e instalador. La sesión principal actúa como PM. Úsala SIEMPRE que el usuario pida algo nuevo, antes de leer código o empezar a implementar.
---

# Flujo de trabajo de un pendiente nuevo

La **sesión principal es el PM**: entiende la solicitud con el usuario, coordina a los roles, revisa lo que entregan y decide con el usuario. El PM no implementa las tareas del plan; las delega.

| Rol | Archivo | Nivel de modelo |
|-----|---------|-----------------|
| PM | sesión principal | alto |
| Arquitecto | `.agents/roles/arquitecto.md` | alto |
| Desarrollo | `.agents/roles/desarrollador.md` | por encargo: económico `mecánica` · medio `normal` · alto `compleja` |
| Revisión | `.agents/roles/revisor.md` | el de la sesión |
| QA | `.agents/roles/qa.md` | medio |
| Documentación | `.agents/roles/documentador.md` | medio |

Cómo se lanza un rol y qué modelo es cada nivel en tu proveedor: sección "Roles" de `AGENTS.md`. Si tu herramienta no tiene subagentes, adopta cada rol tú mismo, en orden, leyendo su archivo al entrar a la fase y **sin saltarte los puntos de aprobación**.

**El usuario puede no ser programador.** Pregunta y reporta en lenguaje llano, sin jerga; cuando haya que elegir, da opciones con una recomendada y su consecuencia práctica. Nunca le pidas editar código, correr comandos ni leer un error: eso lo haces tú.

## Fase 0 — Cotejar el esquema (al iniciar el pendiente)

Verificar, antes de cualquier otra cosa:

- El entorno está listo: `node scripts/preparar-entorno.mjs` termina en "Entorno listo". Si no, seguir la skill `preparar-entorno`.
- Existen los cinco roles en `.agents/roles/`.
- La app existe en `proyectos/{app}/` y `npm run verificar` pasa ahí. Si la app es nueva, se crea en la Fase 2 con la skill `nuevo-proyecto-electron`.
- Leer `memoria/Indice.md` y la nota de la app, si existe.

Si algo falta, decirlo al usuario y acordar cómo seguir; no improvisar un esquema distinto.

## Fase 1 — Entender la solicitud (PM + usuario)

Hacer **todas las preguntas necesarias** hasta no tener dudas (agrupadas, máximo 4 por tanda; con la herramienta de preguntas de tu entorno si existe, si no en el chat). No avanzar a la Fase 2 con huecos. Cubrir como mínimo:

1. **App**: nombre (carpeta en `proyectos/`, minúsculas con guiones) y si es nueva o continúa una existente. Si existe documentación, leerla antes de preguntar lo que ya responde.
2. **Objetivo y alcance**: qué problema resuelve, para quién, qué incluye y qué queda fuera.
3. **Recorrido**: qué hace la persona paso a paso, qué pantallas ve y qué obtiene al final.
4. **Reglas de negocio**, validaciones y casos especiales.
5. **Datos**: qué archivos, bases de datos o servicios externos intervienen. Pedir **un ejemplo real** de cada archivo (un Excel, un PDF) y dónde vendrán las credenciales; nunca planear sobre un formato supuesto.
6. **Criterios de aceptación**: cómo sabrá el usuario que quedó bien.
7. **Entrega**: en qué sistema operativo se usará, quién la instalará y si deberá actualizarse sola.
8. **Diseño** (si hay pantallas): si existe una referencia, marca o app que le guste; si no hay `DESIGN.md`, se define con la skill `impeccable` en la Fase 2.

## Fase 2 — Plan (rol `arquitecto`)

1. Si la app es nueva: crearla con la skill `nuevo-proyecto-electron` y preguntar si se crea su documentación inicial (regla de `documentar-proyecto`).
2. Lanzar `arquitecto` con el encargo completo: respuestas de la Fase 1, app, documentación previa, archivos de ejemplo y restricciones.
3. El arquitecto entrega `proyectos/{app}/docs/PlanDeTrabajo.md` con tareas, complejidad, paralelismo, datos/configuración, casos de prueba y dudas abiertas.
4. El PM **revisa el plan** (que lo verificado sea real y que el alcance coincida con lo pedido), resuelve las dudas abiertas con el usuario y le presenta un resumen en lenguaje llano: qué va a poder hacer, qué no, y qué se le va a pedir.
5. **No se desarrolla nada sin la aprobación explícita del usuario al plan.** Si pide cambios, volver al arquitecto con ellos.

## Fase 3 — Desarrollo (rol `desarrollador`)

1. Por cada tarea o grupo de tareas, lanzar `desarrollador` con el nivel de modelo que marca la complejidad del plan.
2. El encargo va completo: número de tarea, qué hacer, archivos, criterios de aceptación y qué NO tocar. Un encargo vago obliga a redescubrir el contexto.
3. Tareas marcadas como paralelas (sin archivos en común) se lanzan en paralelo; las dependientes, en orden. En paralelo, cada uno corre solo sus pruebas.
4. El PM **revisa el resultado** (archivos tocados, que no haya cambios fuera del alcance, verificaciones reportadas). No confiar a ciegas en el reporte de un rol, sobre todo del nivel económico.

## Fase 4 — Revisión (rol `revisor`)

- `revisor` sobre todo lo modificado. Si hubo cambios de interfaz, además `impeccable audit` sobre las pantallas tocadas.
- Los hallazgos válidos regresan a `desarrollador`; repetir hasta que queden limpios.

## Fase 5 — Compuerta de verificación (PM)

1. El PM corre la suite completa en `proyectos/{app}/`: `npm run verificar` (tipos, pruebas unitarias y compilación). Debe terminar sin errores; se reporta la salida real, no un "debería pasar".
2. Si el pendiente incluye migraciones o scripts de datos: se aplican **solo** sobre datos de prueba. Nunca sobre datos reales o de producción; eso lo hace el usuario o se le pide confirmación explícita, con respaldo previo.
3. Sin compuerta en verde, el QA no arranca.

## Fase 6 — Pruebas (rol `qa`)

1. Lanzar `qa` con la app, la ruta del PlanDeTrabajo, los datos de ejemplo y la confirmación de la Fase 5.
2. El QA prueba la app real con Playwright para Electron (`npm run e2e`), guarda capturas en `docs/capturas/` y documenta resultados y hallazgos en `docs/PlanDePruebas.md`.
3. Hallazgos → el PM los valida y, si proceden, regresan a `desarrollador` (Fase 3) → revisión → compuerta → nueva ronda de QA. Repetir hasta cerrarlos o hasta que el usuario acepte los pendientes.
4. Al cerrar QA, **mostrar la app al usuario**: abrirla (`npm run dev`) o enseñarle las capturas, y pedirle que confirme que es lo que esperaba.

## Fase 7 — Documentación (rol `documentador`)

Lanzar `documentador` con la app, la lista real de archivos cambiados y las rutas del PlanDeTrabajo y PlanDePruebas. Actualiza `DescripcionTecnica.md` y `ReglasDeNegocio.md` y registra la app en `memoria/`. El PM revisa que refleje lo implementado.

## Fase 8 — Manual de usuario (previa pregunta)

1. Con la documentación revisada, **preguntar al usuario** si desea crear o actualizar el manual de usuario. Si dice que no, se anota y se sigue.
2. Si acepta, lanzar `documentador` con el encargo del manual (`docs/ManualDeUsuario.md`), las reglas de negocio y las capturas de QA.
3. El PM lo lee completo antes de darlo por bueno: debe entenderse sin saber de programación.

## Fase 9 — Instalador (previa pregunta)

**Preguntar al usuario** si desea generar el instalador ahora. Si acepta, seguir la skill `empaquetar-app`, **instalarlo y abrir la app instalada** antes de entregarlo (lo que funciona en desarrollo puede fallar empaquetado).

## Fase 10 — Cierre (PM)

Resumen al usuario, en lenguaje llano: qué puede hacer ahora la app, resultado de QA (hallazgos abiertos si hay), documentos actualizados, manual e instalador (rutas, o que decidió no hacerlos) y qué fases se saltaron. Actualizar la nota de la app en `memoria/`. Ofrecer guardar el avance en git (`commit`); **nunca** hacer commit ni push sin que el usuario lo pida.

## Excepciones

- Una consulta o cambio trivial (1–3 acciones, sin datos ni lógica de negocio) no necesita el flujo completo: el PM lo propone al usuario y, si acepta, lo resuelve directo y corre `npm run verificar`.
- Si el usuario pide saltar una fase, se respeta y se deja anotado en el cierre.
