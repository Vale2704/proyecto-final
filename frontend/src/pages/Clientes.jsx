import { useEffect, useState } from "react";
import api from "../api/client.js";
import { textoErrorApi } from "../api/error.js";

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
    setMsg("");
    try {
      const { data } = await api.get("/api/clientes");
      if (data.ok) setLista(data.datos || []);
      else setMsg(data.mensaje || "Respuesta sin datos.");
    } catch (e) {
      setLista([]);
      setMsg(textoErrorApi(e));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (editando) {
        await api.put(`/api/clientes/${editando}`, form);
      } else {
        await api.post("/api/clientes", form);
      }
      setForm(vacio);
      setEditando(null);
      await cargar();
      setMsg("Guardado bien.");
    } catch (err) {
      setMsg(err.response?.data?.mensaje || "Error al guardar");
    }
  }

  function editar(row) {
    setEditando(row.id);
    setForm({ ...row });
  }

  async function borrar(id) {
    if (!window.confirm("¿Borrar este cliente?")) return;
    setMsg("");
    try {
      await api.delete(`/api/clientes/${id}`);
      await cargar();
      setMsg("Borrado.");
    } catch (err) {
      setMsg(err.response?.data?.mensaje || "No se pudo borrar");
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
