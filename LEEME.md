# JavIA — cómo usar esta carpeta

Esta carpeta convierte a un asistente de programación con IA en un equipo de desarrollo completo para crear **programas de escritorio** (los que se instalan en la computadora, como un `.exe`). No necesitas saber programar: tú explicas qué necesitas y apruebas; el asistente planea, programa, prueba y te entrega el instalador.

## Lo que necesitas

1. Una computadora con Windows 10 u 11 (también funciona en Mac y Linux) y conexión a internet.
2. Un asistente de programación instalado y con sesión iniciada. Sirve cualquiera que pueda leer archivos y ejecutar comandos en tu equipo: Claude Code, Codex, Cursor u otro.

## La primera vez

1. Abre **esta carpeta** con tu asistente (no una carpeta de adentro).
2. Escríbele:

   > Lee AGENTS.md y prepara el entorno.

3. Te pedirá permiso para instalar las herramientas que falten (son gratuitas). Acepta. Cuando te diga **"Entorno listo"**, ya puedes pedir tu primera app.

## Para pedir una app o un cambio

Dile qué necesitas con tus palabras, como se lo explicarías a una persona:

> Quiero un programa donde arrastre un Excel de ventas y me devuelva un resumen por vendedor.

A partir de ahí pasa esto, siempre en el mismo orden:

1. **Te hace preguntas** hasta entender bien. Si te pide un archivo de ejemplo, dáselo: es lo que más ayuda.
2. **Te presenta un plan** en lenguaje sencillo. No empieza a programar hasta que lo apruebes. Si algo no es lo que querías, dilo aquí.
3. **Programa, revisa y prueba** por su cuenta. Puede tardar; no necesitas hacer nada.
4. **Te enseña el programa funcionando** y te pide confirmar que es lo que esperabas.
5. **Documenta** lo que hizo y te pregunta si quieres un **manual de usuario** y el **instalador**.

## Cuando haya novedades

Vuelve a abrir el instalador de JavIA. Te muestra qué hay nuevo y para qué sirve, y te pregunta si lo descargas. Tu carpeta `memoria` y tus `proyectos` no se tocan; si tú o tu asistente cambiaron alguna instrucción, se guarda una copia en `.javia-respaldo`. El instalador más reciente está siempre en [github.com/javoro/javia/releases/latest](https://github.com/javoro/javia/releases/latest).

## Consejos

- Si no entiendes algo que te dice, pídele: "explícamelo sin términos técnicos".
- Si te pregunta algo que no sabes, pídele su recomendación y el porqué.
- Para retomar otro día: "continuemos con la app *nombre*". Lo que ya se decidió queda guardado en la carpeta `memoria`.
- Para un ajuste: descríbelo igual que una app nueva ("en la app *nombre*, quiero que además...").
- Nunca le dictes contraseñas dentro de un mensaje largo ni dejes que las guarde en documentos; él te dirá dónde ponerlas de forma segura.
- Al instalar tu programa en otra computadora, Windows mostrará el aviso "Windows protegió su PC". Es normal en programas propios: **Más información → Ejecutar de todas formas**.

## Dónde queda cada cosa

| Carpeta | Qué hay |
|---|---|
| `proyectos/nombre-de-tu-app/` | Tu programa |
| `proyectos/nombre-de-tu-app/release/` | El instalador, cuando lo pidas |
| `proyectos/nombre-de-tu-app/docs/` | El plan, las pruebas con capturas, la documentación y el manual |
| `memoria/` | Lo que el asistente recuerda de una sesión a otra |

Lo demás (`AGENTS.md`, `.agents/`, `scripts/`) son las instrucciones del asistente. No hace falta abrirlas ni modificarlas.
