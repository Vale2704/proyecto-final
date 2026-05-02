import { useEffect, useState } from "react";
import api from "../api/client.js";
import { textoErrorApi } from "../api/error.js";
import { ejecutarAccion } from "../api/request.js";

function fechaLocalParaInput(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Prestamos() {
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [libros, setLibros] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [libroId, setLibroId] = useState("");
  const [fechaDev, setFechaDev] = useState("");
  const [msg, setMsg] = useState("");

  async function cargarTodo() {
    setMsg("");
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get("/api/prestamos"),
        api.get("/api/clientes"),
        api.get("/api/libros"),
      ]);
      if (r1.data.ok) setLista(r1.data.datos || []);
      if (r2.data.ok) setClientes(r2.data.datos || []);
      if (r3.data.ok) setLibros(r3.data.datos || []);
    } catch (error) {
      setMsg(textoErrorApi(error));
    }
  }

  useEffect(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 14);
    setFechaDev(fechaLocalParaInput(manana.toISOString()));
    cargarTodo();
  }, []);

  async function crear(e) {
    e.preventDefault();
    const ok = await ejecutarAccion({
      setMsg,
      accion: () =>
        api.post("/api/prestamos", {
          cliente_id: Number(clienteId),
          libro_id: Number(libroId),
          fecha_devolucion_esperada: fechaDev,
        }),
    });
    if (ok) {
      setMsg("Préstamo registrado.");
      await cargarTodo();
    }
  }

  async function devolver(id) {
    const ok = await ejecutarAccion({
      setMsg,
      accion: () => api.post(`/api/prestamos/${id}/devolver`),
    });
    if (ok) {
      setMsg("Devolución registrada.");
      await cargarTodo();
    }
  }

  return (
    <div>
      <div className="tarjeta" style={{ marginBottom: "1rem" }}>
        <h2>Nuevo préstamo</h2>
        <form className="grid-form" style={{ maxWidth: "480px" }} onSubmit={crear}>
          <label>
            Cliente
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">— elegir —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} — {c.numero_identificacion}
                </option>
              ))}
            </select>
          </label>
          <label>
            Libro
            <select value={libroId} onChange={(e) => setLibroId(e.target.value)} required>
              <option value="">— elegir —</option>
              {libros.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.titulo} (disp. {l.cantidad_disponible}) — {l.isbn}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha devolución esperada
            <input type="date" value={fechaDev} onChange={(e) => setFechaDev(e.target.value)} required />
          </label>
          <button type="submit" className="btn">
            Registrar préstamo
          </button>
        </form>
        {msg ? <p className={msg.includes("No ") || msg.includes("Error") ? "msg-error" : "msg-ok"}>{msg}</p> : null}
      </div>

      <div className="tarjeta">
        <h2>Préstamos</h2>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha préstamo</th>
                <th>Cliente</th>
                <th>Libro</th>
                <th>Devolución esperada</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td>{p.fecha_prestamo ? p.fecha_prestamo.slice(0, 10) : ""}</td>
                  <td>{p.cliente ? `${p.cliente.nombre} ${p.cliente.apellido}` : ""}</td>
                  <td>{p.libro ? p.libro.titulo : ""}</td>
                  <td>{p.fecha_devolucion_esperada ? String(p.fecha_devolucion_esperada).slice(0, 10) : ""}</td>
                  <td>{p.estado}</td>
                  <td>
                    {p.estado === "activo" ? (
                      <button type="button" className="btn btn-sec" onClick={() => devolver(p.id)}>
                        Marcar devuelto
                      </button>
                    ) : (
                      <span style={{ color: "#555" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
