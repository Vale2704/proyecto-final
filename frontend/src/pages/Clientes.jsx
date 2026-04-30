import { useEffect, useState } from "react";
import api from "../api/client.js";
import { cargarLista, ejecutarAccion } from "../api/request.js";

const vacio = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  numero_identificacion: "",
};

export default function Clientes() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [msg, setMsg] = useState("");

  async function cargar() {
    await cargarLista({
      setMsg,
      setLista,
      url: "/api/clientes",
      mensajeSinDatos: "Respuesta sin datos.",
    });
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e) {
    e.preventDefault();
    const ok = await ejecutarAccion({
      setMsg,
      accion: () =>
        editando ? api.put(`/api/clientes/${editando}`, form) : api.post("/api/clientes", form),
      mensajeError: "Error al guardar",
    });
    if (ok) {
      setForm(vacio);
      setEditando(null);
      await cargar();
      setMsg("Guardado bien.");
    }
  }

  function editar(row) {
    setEditando(row.id);
    setForm({ ...row });
  }

  async function borrar(id) {
    if (!window.confirm("¿Borrar este cliente?")) return;
    const ok = await ejecutarAccion({
      setMsg,
      accion: () => api.delete(`/api/clientes/${id}`),
      mensajeError: "No se pudo borrar",
    });
    if (ok) {
      await cargar();
      setMsg("Borrado.");
    }
  }

  return (
    <div>
      <div className="tarjeta" style={{ marginBottom: "1rem" }}>
        <h2>{editando ? "Editar cliente" : "Nuevo cliente"}</h2>
        <form className="grid-form" style={{ maxWidth: "520px" }} onSubmit={guardar}>
          <label>
            Nombre
            <input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} required />
          </label>
          <label>
            Apellido
            <input value={form.apellido} onChange={(e) => cambiar("apellido", e.target.value)} required />
          </label>
          <label>
            Correo
            <input type="email" value={form.correo} onChange={(e) => cambiar("correo", e.target.value)} required />
          </label>
          <label>
            Teléfono
            <input value={form.telefono} onChange={(e) => cambiar("telefono", e.target.value)} required />
          </label>
          <label>
            Número de identificación
            <input
              value={form.numero_identificacion}
              onChange={(e) => cambiar("numero_identificacion", e.target.value)}
              required
            />
          </label>
          <div className="fila-acciones">
            <button type="submit" className="btn">
              {editando ? "Actualizar" : "Agregar"}
            </button>
            {editando ? (
              <button
                type="button"
                className="btn btn-sec"
                onClick={() => {
                  setEditando(null);
                  setForm(vacio);
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
        {msg ? <p className={msg.includes("Error") || msg.includes("No") ? "msg-error" : "msg-ok"}>{msg}</p> : null}
      </div>

      <div className="tarjeta">
        <h2>Personas registradas</h2>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Correo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.nombre} {row.apellido}
                  </td>
                  <td>{row.numero_identificacion}</td>
                  <td>{row.correo}</td>
                  <td>
                    <div className="fila-acciones">
                      <button type="button" className="btn btn-sec" onClick={() => editar(row)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-peligro" onClick={() => borrar(row.id)}>
                        Borrar
                      </button>
                    </div>
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
