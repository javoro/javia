---
paths:
  - "proyectos/**/src/renderer/**"
---

# Interfaz: React, Tailwind y shadcn/ui

## De dónde sale el diseño

- Cada app tiene en su raíz `PRODUCT.md` (para quién es y qué tono lleva) y `DESIGN.md` (colores, tipografía, espaciado, componentes). Los crea y mantiene la skill **`impeccable`**. Si no existen, se crean antes de la primera pantalla; una pantalla nueva no se diseña "a ojo".
- Antes de construir una pantalla: `impeccable shape`. Al terminarla: `impeccable polish` (y `audit` antes de entregar).
- Los colores, radios y tipografía viven como variables en `src/renderer/src/estilos.css`. En los componentes se usan las clases de token (`bg-background`, `text-muted-foreground`, `border-border`), **nunca** valores sueltos (`#3b82f6`, `text-[13px]`).

## Componentes

- Primero lo que ya existe en `src/renderer/src/components/`. Después, shadcn/ui: `npx shadcn@latest add <componente>` (queda en `components/ui/`, es código propio y se puede ajustar). Solo si no existe ahí se escribe uno nuevo.
- Lo que `shadcn add` instala (`cn`, `radix-ui`, ...) queda en `dependencies`; muévelo con `npm install -D <paquetes>`: las librerías del renderer van en `devDependencies` (Vite las mete en el compilado) y así no engordan el instalador.
- Iconos: `lucide-react`. Clases condicionales: `cn()` del paquete `cn`, igual que los componentes de shadcn.
- Un componente por archivo, en `PascalCase.tsx`; funciones y variables en español salvo los identificadores de librerías.
- El renderer habla con el sistema **solo** por `window.api` (ver `electron.md`). Sin `fetch` con tokens, sin acceso a disco.

## Toda pantalla cubre

- **Vacío** (qué hacer para empezar), **cargando** (con avance si tarda más de un par de segundos), **error** (qué pasó y qué puede hacer la persona) y **éxito**.
- Acciones destructivas o lentas piden confirmación y se pueden cancelar.
- Uso completo con teclado, foco visible, controles con etiqueta (`<label>` o `aria-label`), contraste suficiente. Respeta `prefers-reduced-motion`.
- La ventana se puede redimensionar: probar en el tamaño mínimo definido en `src/main/index.ts`.
- Textos en español, en el lenguaje de quien usa la app; ningún mensaje técnico crudo (`ENOENT`, `undefined`) llega a pantalla.
- Los elementos que QA necesita localizar llevan `data-testid` cuando no tienen un rol o texto estable.

## Estado

- Estado local con `useState`/`useReducer`; se sube solo cuando dos pantallas lo comparten. No agregar una librería de estado, de formularios o de rutas sin que el plan lo justifique.
- Una tabla o lista larga no crece en vivo fila por fila mientras se procesa: se muestran contadores y el detalle al final.
