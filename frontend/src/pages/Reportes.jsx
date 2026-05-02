import { useEffect, useState } from "react";
import api from "../api/client.js";
import { textoErrorApi } from "../api/error.js";
import { ejecutarAccion } from "../api/request.js";

export default function Reportes() {
  const [q, setQ] = useState("");
  const [libroId, setLibroId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [libros, setLibros] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filas, setFilas] = useState([]);
  const [msg, setMsg] = useState("");

  async function cargarListas() {
    try {
      const [r1, r2] = await Promise.all([api.get("/api/libros"), api.get("/api/clientes")]);
      if (r1.data.ok) setLibros(r1.data.datos || []);
      if (r2.data.ok) setClientes(r2.data.datos || []);
    } catch (error) {
      setMsg(textoErrorApi(error));
    }
  }

  async function buscar(e) {
    e.preventDefault();
    const ok = await ejecutarAccion({
      setMsg,
      accion: async () => {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (libroId) params.set("libro_id", libroId);
        if (clienteId) params.set("cliente_id", clienteId);
        const url = `/api/reportes${params.toString() ? `?${params.toString()}` : ""}`;
        const { data } = await api.get(url);
        if (data.ok) setFilas(data.datos);
      },
    });
    if (!ok) setFilas([]);
  }

  useEffect(() => {
    let cancel = false;
    async function ini() {
      await cargarListas();
      try {
        const r = await api.get("/api/reportes");
        if (!cancel && r.data.ok) setFilas(r.data.datos || []);
      } catch (error) {
        if (!cancel) setMsg(textoErrorApi(error));
      }
    }
    ini();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div>
      <div className="tarjeta" style={{ marginBottom: "1rem" }}>
        <h2>Reportes de préstamos</h2>
        <p>Solo administrador. Puedes buscar por texto (ISBN, título o nombre de usuario) y filtrar por libro o cliente.</p>
        <form onSubmit={buscar} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
          <label>
            Buscar (ISBN, título, nombre)
            <input value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: "200px" }} />
          </label>
          <label>
            Libro
            <select value={libroId} onChange={(e) => setLibroId(e.target.value)} style={{ minWidth: "180px" }}>
              <option value="">Todos</option>
              {libros.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.titulo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cliente
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ minWidth: "200px" }}>
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn">
            Ver
          </button>
        </form>
        {msg ? <p className="msg-error">{msg}</p> : null}
      </div>

      <div className="tarjeta">
        <h2>Resultado</h2>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha préstamo</th>
                <th>Usuario</th>
                <th>Libro</th>
                <th>ISBN</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((row) => (
                <tr key={row.id}>
                  <td>{row.fecha_prestamo ? row.fecha_prestamo.slice(0, 10) : ""}</td>
                  <td>{row.usuario_nombre}</td>
                  <td>{row.libro_titulo}</td>
                  <td>{row.libro_isbn}</td>
                  <td>{row.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filas.length === 0 ? <p style={{ color: "#666" }}>No hay préstamos registrados todavía.</p> : null}
      </div>
    </div>
  );
}
