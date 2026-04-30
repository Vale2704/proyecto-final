import { useEffect, useState } from "react";
import api from "../api/client.js";
import { cargarLista, ejecutarAccion } from "../api/request.js";

export default function UsuariosSistema() {
  const [lista, setLista] = useState([]);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState("gestor");
  const [msg, setMsg] = useState("");

  async function cargar() {
    await cargarLista({
      setMsg,
      setLista,
      url: "/api/usuarios-sistema",
      mensajeSinDatos: "Sin datos.",
    });
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e) {
    e.preventDefault();
    const ok = await ejecutarAccion({
      setMsg,
      accion: () => api.post("/api/usuarios-sistema", { usuario: usuario.trim(), clave, rol }),
      mensajeError: "No se pudo crear",
    });
    if (ok) {
      setUsuario("");
      setClave("");
      setRol("gestor");
      await cargar();
      setMsg("Usuario creado.");
    }
  }

  return (
    <div>
      <div className="tarjeta" style={{ marginBottom: "1rem" }}>
        <h2>Crear usuario del sistema</h2>
        <p style={{ fontSize: "0.95rem" }}>Solo el administrador puede crear cuentas para gestores u otros administradores.</p>
        <form className="grid-form" style={{ maxWidth: "400px" }} onSubmit={crear}>
          <label>
            Usuario
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          </label>
          <label>
            Contraseña
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          </label>
          <label>
            Rol
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="gestor">gestor</option>
              <option value="administrador">administrador</option>
            </select>
          </label>
          <button type="submit" className="btn">
            Crear
          </button>
        </form>
        {msg ? <p className={msg.includes("No ") ? "msg-error" : "msg-ok"}>{msg}</p> : null}
      </div>

      <div className="tarjeta">
        <h2>Cuentas existentes</h2>
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td>{u.usuario}</td>
                  <td>{u.rol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
