import type { ResultadoNovedades } from '../../shared/tipos.ts';

type Disponibles = Extract<ResultadoNovedades, { ok: true }>;

const contar = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** Qué hay nuevo en GitHub para la carpeta elegida y para qué sirve. */
export default function Novedades({ datos, destino }: { datos: Disponibles; destino: string }) {
  const { nuevos, actualizados, respaldados, retirados } = datos.cambios;
  const detalle: [string, string[]][] = [
    ['Nuevos', nuevos],
    ['Se actualizan', actualizados],
    ['Se respaldan y se actualizan', respaldados],
    ['Se retiran', retirados],
  ];
  const total = detalle.reduce((suma, [, rutas]) => suma + rutas.length, 0);

  return (
    <section className="flex-1 overflow-y-auto px-10 pb-4" aria-labelledby="titulo-novedades">
      <h2 id="titulo-novedades" className="text-xl font-semibold">
        Hay novedades de JavIA
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {datos.instalada ? `Tienes la versión ${datos.instalada}; ya está la ${datos.version}.` : `Ya está la versión ${datos.version}.`} Tu memoria y tus
        proyectos no se tocan.
      </p>
      <p className="mt-2 truncate font-mono text-xs text-muted-foreground" title={destino}>
        {destino}
      </p>

      {datos.novedades.map(({ version, fecha, cambios }) => (
        <div key={version} className="mt-5">
          <h3 className="text-sm font-semibold">
            Versión {version} <span className="font-normal text-muted-foreground">· {fecha}</span>
          </h3>
          <ul className="mt-2 space-y-2">
            {cambios.map(({ que, paraQue }) => (
              <li key={que} className="rounded-md border border-border bg-card px-3 py-2.5 text-sm">
                <span className="block font-medium">{que}</span>
                <span className="mt-0.5 block text-muted-foreground">
                  <span className="font-medium">Para qué sirve:</span> {paraQue}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {respaldados.length > 0 && (
        <p className="mt-5 rounded-md border border-border bg-muted px-3 py-2 text-sm">
          {contar(respaldados.length, 'archivo que cambiaste se guardará', 'archivos que cambiaste se guardarán')} en una carpeta de respaldo antes de poner la
          versión nueva.
        </p>
      )}

      {total > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Ver {contar(total, 'archivo que cambia', 'archivos que cambian')}
          </summary>
          {detalle.map(
            ([titulo, rutas]) =>
              rutas.length > 0 && (
                <div key={titulo} className="mt-2">
                  <p className="font-medium">{titulo}</p>
                  <ul className="mt-1 font-mono text-xs break-all text-muted-foreground">
                    {rutas.map((ruta) => (
                      <li key={ruta}>{ruta}</li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </details>
      )}
    </section>
  );
}
