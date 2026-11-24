# Configuración, no valores fijos en código

Aplica a todo el código nuevo o modificado y a la planeación de cada pendiente.

## Principio

Evitar los valores fijos que el negocio o el ambiente puedan cambiar. Ejemplos de lo que **no** va escrito en el código:

- Montos, porcentajes, tolerancias, límites, plazos y días.
- Fechas de vigencia o de corte.
- Listas de sucursales, usuarios, marcas, proveedores o tipos habilitados/excluidos.
- Banderas para activar o desactivar una función.
- URLs de servicios, correos destinatarios, nombres de columnas o de hojas de un archivo del usuario, credenciales y tokens.

Puede quedarse en código lo técnico que no cambia por decisión de negocio: nombres de canales IPC, formatos internos, estados que el código ya modela como tipo.

## Dónde va cada cosa

El arquitecto lo decide caso por caso y lo justifica en el plan:

| Qué es | Dónde vive |
|---|---|
| Lo que cambia **quien usa la app** (preferencias, carpetas, umbrales) | Archivo de ajustes en `app.getPath('userData')`, con una pantalla de Ajustes para mantenerlo |
| Lo que cambia **quien instala o administra** (URL del servicio, ambiente) | `.env` leído en main en tiempo de ejecución (`.env.example` versionado, sin valores) |
| **Secretos** | `.env` o `safeStorage`; nunca en el código, el renderer, los logs ni los mensajes de error |
| Catálogos y reglas con estructura (varios campos, vigencias) | La base de datos o el archivo de datos de la app, con su carga inicial repetible |

## Reglas

- Se lee en un solo lugar (`src/main/servicios/configuracion.ts`) y se referencia con **nombres**, no con literales repartidos por el código.
- El plan define qué pasa si la configuración falta: si es **obligatoria**, un error claro que diga qué configurar (sin exponer valores); si es **opcional**, un valor por defecto documentado.
- **Código existente:** no se mueven valores fijos que el pendiente no toca. Si una tarea pasa por uno, va como recomendación aparte en el plan.
- Si en un caso concreto el valor fijo es lo correcto (p. ej. un cálculo legal que no debe cambiar sin desarrollo), se dice explícitamente en el plan con la razón; no se fija en silencio.
- Toda configuración nueva se documenta en `docs/DescripcionTecnica.md`: dónde vive, descripción, valor inicial y quién la mantiene.
