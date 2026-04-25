import { useEffect, useState } from "react";
import api from "../api/client.js";
import { textoErrorApi } from "../api/error.js";

export default function UsuariosSistema() {
  const [lista, setLista] = useState([]);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState("gestor");
  const [msg, setMsg] = useState("");

  async function cargar() {
    setMsg("");
    try {
      const { data } = await api.get("/api/usuarios-sistema");
      if (data.ok) setLista(data.datos || []);
      else setMsg(data.mensaje || "Sin datos.");
    } catch (e) {
      setLista([]);
      setMsg(textoErrorApi(e));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/usuarios-sistema", { usuario: usuario.trim(), clave, rol });
      setUsuario("");
      setClave("");
      setRol("gestor");
      await cargar();
      setMsg("Usuario creado.");
    } catch (err) {
      setMsg(err.response?.data?.mensaje || "No se pudo crear");
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
