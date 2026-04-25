import { useEffect, useState } from "react";
import api from "../api/client.js";
import { textoErrorApi } from "../api/error.js";

const vacio = {
  titulo: "",
  autor: "",
  editorial: "",
  anio_publicacion: new Date().getFullYear(),
  isbn: "",
  cantidad_disponible: 1,
};

export default function Libros() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [msg, setMsg] = useState("");

  async function cargar() {
    setMsg("");
    try {
      const { data } = await api.get("/api/libros");
      if (data.ok) setLista(data.datos || []);
      else setMsg(data.mensaje || "El servidor respondió sin datos.");
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
        await api.put(`/api/libros/${editando}`, form);
      } else {
        await api.post("/api/libros", form);
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
    setForm({
      titulo: row.titulo,
      autor: row.autor,
      editorial: row.editorial,
      anio_publicacion: row.anio_publicacion,
      isbn: row.isbn,
      cantidad_disponible: row.cantidad_disponible,
    });
  }

  async function borrar(id) {
    if (!window.confirm("¿Seguro que quieres borrar este libro?")) return;
    setMsg("");
    try {
      await api.delete(`/api/libros/${id}`);
      await cargar();
      setMsg("Listo, borrado.");
    } catch (err) {
      setMsg(err.response?.data?.mensaje || "No se pudo borrar");
    }
  }

  function cancelarEdicion() {
    setEditando(null);
    setForm(vacio);
  }

  return (
    <div>
      <div className="tarjeta" style={{ marginBottom: "1rem" }}>
        <h2>{editando ? "Editar libro" : "Nuevo libro"}</h2>
        <form className="grid-form" style={{ maxWidth: "520px" }} onSubmit={guardar}>
          <label>
            Título
            <input value={form.titulo} onChange={(e) => cambiar("titulo", e.target.value)} required />
          </label>
          <label>
            Autor
            <input value={form.autor} onChange={(e) => cambiar("autor", e.target.value)} required />
          </label>
          <label>
            Editorial
            <input value={form.editorial} onChange={(e) => cambiar("editorial", e.target.value)} required />
          </label>
          <label>
            Año
            <input
              type="number"
              value={form.anio_publicacion}
              onChange={(e) => cambiar("anio_publicacion", Number(e.target.value))}
              required
            />
          </label>
          <label>
            ISBN
            <input value={form.isbn} onChange={(e) => cambiar("isbn", e.target.value)} required />
          </label>
          <label>
            Cantidad disponible
            <input
              type="number"
              min={0}
              value={form.cantidad_disponible}
              onChange={(e) => cambiar("cantidad_disponible", Number(e.target.value))}
              required
            />
          </label>
          <div className="fila-acciones">
            <button type="submit" className="btn">
              {editando ? "Actualizar" : "Agregar"}
            </button>
            {editando ? (
              <button type="button" className="btn btn-sec" onClick={cancelarEdicion}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
        {msg ? <p className={msg.includes("Error") || msg.includes("No") ? "msg-error" : "msg-ok"}>{msg}</p> : null}
      </div>

      <div className="tarjeta">
        <h2>Listado</h2>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>ISBN</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((row) => (
                <tr key={row.id}>
                  <td>{row.titulo}</td>
                  <td>{row.autor}</td>
                  <td>{row.isbn}</td>
                  <td>{row.cantidad_disponible}</td>
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
