import { useEffect, useState } from 'react';
import type { Estado, IdProveedor, Resultado, ResultadoActualizar, ResultadoNovedades } from '../../shared/tipos.ts';
import Novedades from './Novedades.tsx';

type Exito = Extract<Resultado, { ok: true }> & { asistentes: string[] };

const BOTON =
  'rounded-md px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const PRIMARIO = `${BOTON} bg-primary text-primary-foreground hover:bg-primary/90`;
const ENLACE = 'rounded-sm font-medium text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring';
const SECUNDARIO = `${BOTON} border border-border bg-card hover:bg-muted`;

export default function App() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [elegidos, setElegidos] = useState<Set<IdProveedor>>(new Set());
  const [instalando, setInstalando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState<Exito | null>(null);
  const [novedades, setNovedades] = useState<ResultadoNovedades | null>(null); // null: consultando GitHub
  const [ahoraNo, setAhoraNo] = useState(false);
  const [actualizado, setActualizado] = useState<Extract<ResultadoActualizar, { ok: true }> | null>(null);

  // Al llegar a una carpeta se premarcan los asistentes detectados en el equipo que aún le faltan.
  function recibir(nuevo: Estado): void {
    setEstado(nuevo);
    setElegidos(new Set(nuevo.proveedores.filter((p) => p.enEquipo && !p.enDestino).map((p) => p.id)));
    setError('');
    setExito(null);
    setActualizado(null);
    setAhoraNo(false);
    void buscarNovedades();
  }

  async function buscarNovedades(): Promise<void> {
    setNovedades(null);
    setNovedades(await window.api.novedades());
  }

  useEffect(() => {
    void window.api.estado().then(recibir);
  }, []);

  if (!estado) return <main className="h-screen bg-background" aria-busy="true" />;

  function alternar(id: IdProveedor): void {
    const siguiente = new Set(elegidos);
    if (!siguiente.delete(id)) siguiente.add(id);
    setElegidos(siguiente);
  }

  async function instalar(): Promise<void> {
    setInstalando(true);
    setError('');
    const resultado = await window.api.instalar([...elegidos]);
    setInstalando(false);
    if (!resultado.ok) return setError(resultado.error);
    const asistentes = estado!.proveedores.filter((p) => elegidos.has(p.id)).map((p) => p.nombre);
    setExito({ ...resultado, asistentes });
  }

  async function actualizar(): Promise<void> {
    setInstalando(true);
    setError('');
    const resultado = await window.api.actualizar();
    setInstalando(false);
    if (resultado.ok) setActualizado(resultado);
    else setError(resultado.error);
  }

  const disponibles = !exito && !ahoraNo && novedades?.ok && novedades.hayNovedades ? novedades : null;
  // Con JavIA ya instalado se espera la respuesta, para que las novedades no aparezcan a media selección.
  const buscando = !exito && novedades === null && estado.yaTieneJavia;
  const faltaAlguno = estado.proveedores.some((p) => !p.enDestino);

  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      <header className="px-10 pt-9 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Jav<span className="text-primary">IA</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La forma de trabajar de Javi, lista para tu asistente de inteligencia artificial.
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status" data-testid="estado-github">
          {novedades === null
            ? 'Buscando novedades en GitHub…'
            : !novedades.ok
              ? novedades.error
              : novedades.instalada === novedades.version
                ? `Al día: versión ${novedades.version}.`
                : `Versión ${novedades.version} en GitHub.`}
          {novedades && !novedades.ok && (
            <button type="button" className={ENLACE} onClick={() => void buscarNovedades()}>
              Reintentar
            </button>
          )}
          {novedades?.ok && novedades.instaladorNuevo && (
            <button type="button" className={ENLACE} onClick={() => void window.api.abrirDescarga()}>
              Hay un instalador más reciente: descargar
            </button>
          )}
        </p>
      </header>

      {actualizado ? (
        <section className="flex-1 overflow-y-auto px-10" aria-live="polite">
          <h2 className="text-xl font-semibold">JavIA quedó en la versión {actualizado.version}</h2>
          <p className="mt-3 text-sm text-muted-foreground" data-testid="resumen-actualizacion">
            Archivos nuevos: {actualizado.cambios.nuevos.length} · actualizados:{' '}
            {actualizado.cambios.actualizados.length + actualizado.cambios.respaldados.length} · retirados: {actualizado.cambios.retirados.length}
          </p>
          {actualizado.respaldo && (
            <div className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">
              <p className="font-medium">Lo que habías cambiado quedó respaldado en:</p>
              <p className="mt-1 font-mono text-xs break-all">{actualizado.respaldo}</p>
            </div>
          )}
        </section>
      ) : buscando ? (
        <div className="flex-1" aria-busy="true" />
      ) : disponibles ? (
        <Novedades datos={disponibles} destino={estado.destino} />
      ) : exito ? (
        <section className="flex-1 overflow-y-auto px-10" aria-live="polite">
          <h2 className="text-xl font-semibold">Listo, tu carpeta quedó preparada</h2>
          <p className="mt-3 rounded-md border border-border bg-card px-3 py-2 font-mono text-sm break-all" data-testid="destino-final">
            {estado.destino}
          </p>
          <p className="mt-3 text-sm text-muted-foreground" data-testid="resumen">
            {exito.creados} archivos nuevos.
            {exito.iguales > 0 && ` ${exito.iguales} ya estaban y no se duplicaron.`}
          </p>
          {exito.distintos.length > 0 && (
            <div className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">
              <p className="font-medium">Estos archivos ya existían con otro contenido y no se tocaron:</p>
              <p className="mt-1 font-mono text-xs break-all">{exito.distintos.join(' · ')}</p>
            </div>
          )}

          <h3 className="mt-7 text-sm font-semibold">Qué sigue</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
            <li>Abre esa carpeta con {exito.asistentes.join(' o ')}.</li>
            <li>
              Escríbele: <span className="font-medium">«Lee AGENTS.md y prepara el entorno.»</span>
            </li>
            <li>Cuando te diga «Entorno listo», pídele tu primera app con tus palabras.</li>
          </ol>
        </section>
      ) : (
        <div className="flex-1 space-y-7 overflow-y-auto px-10 pb-4">
          <section aria-labelledby="titulo-carpeta">
            <h2 id="titulo-carpeta" className="text-sm font-semibold">
              1. ¿Dónde quieres tu carpeta de trabajo?
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <p className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-3 py-2 font-mono text-sm" title={estado.destino} data-testid="destino">
                {estado.destino}
              </p>
              <button type="button" className={SECUNDARIO} onClick={() => void window.api.elegirCarpeta().then(recibir)}>
                Cambiar carpeta
              </button>
            </div>
            {estado.yaTieneJavia && (
              <p className="mt-2 text-sm text-muted-foreground">
                Esta carpeta ya tiene JavIA. Solo se agrega lo que falte; lo que ya existe no se modifica.
              </p>
            )}
          </section>

          <fieldset>
            <legend className="text-sm font-semibold">2. ¿Qué asistente de IA usas?</legend>
            <p className="mt-1 text-sm text-muted-foreground">Puedes marcar más de uno.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {estado.proveedores.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                    p.enDestino ? 'opacity-60' : 'cursor-pointer hover:bg-muted has-checked:border-primary'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary outline-none"
                    checked={p.enDestino || elegidos.has(p.id)}
                    disabled={p.enDestino}
                    onChange={() => alternar(p.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{p.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.detalle}</span>
                    {(p.enDestino || p.enEquipo) && (
                      <span className="mt-1.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {p.enDestino ? 'Ya está en esta carpeta' : 'Detectado en este equipo'}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <footer className="flex items-center justify-between gap-4 border-t border-border px-10 py-5">
        {actualizado ? (
          <>
            <button type="button" className={SECUNDARIO} onClick={() => void window.api.abrirCarpeta()}>
              Abrir la carpeta
            </button>
            <button type="button" className={PRIMARIO} onClick={() => void window.api.estado().then(recibir)}>
              Continuar
            </button>
          </>
        ) : disponibles ? (
          <>
            <p className={`text-sm ${error ? 'text-destructive' : ''}`} role={error ? 'alert' : undefined}>
              {error || '¿Quieres descargarlas?'}
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                className={SECUNDARIO}
                disabled={instalando}
                onClick={() => {
                  setError('');
                  setAhoraNo(true);
                }}
              >
                Ahora no
              </button>
              <button type="button" className={PRIMARIO} disabled={instalando} onClick={() => void actualizar()}>
                {instalando ? 'Descargando…' : 'Descargar novedades'}
              </button>
            </div>
          </>
        ) : exito ? (
          <>
            <button type="button" className={SECUNDARIO} onClick={() => void window.api.estado().then(recibir)}>
              Agregar otro asistente
            </button>
            <button type="button" className={PRIMARIO} onClick={() => void window.api.abrirCarpeta()}>
              Abrir la carpeta
            </button>
          </>
        ) : (
          <>
            <p className={`text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`} role={error ? 'alert' : undefined}>
              {error ||
                (!faltaAlguno
                  ? 'Esta carpeta ya tiene todos los asistentes.'
                  : elegidos.size === 0
                    ? 'Marca al menos un asistente.'
                    : '')}
            </p>
            <button type="button" className={PRIMARIO} disabled={elegidos.size === 0 || instalando || buscando} onClick={() => void instalar()}>
              {instalando ? 'Instalando…' : 'Instalar'}
            </button>
          </>
        )}
      </footer>
    </main>
  );
}
