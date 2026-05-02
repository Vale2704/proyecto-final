export default function EstadoCarga({ etiqueta = "Cargando…", centrado = false }) {
  const cls = centrado ? "estado-carga estado-carga-centro" : "estado-carga";
  return (
    <div className={cls} role="status" aria-live="polite" aria-busy="true">
      <span className="estado-carga-spinner" aria-hidden />
      <span>{etiqueta}</span>
    </div>
  );
}
