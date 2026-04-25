import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await login(usuario.trim(), clave);
      if (data.ok) nav("/panel");
      else setError(data.mensaje || "No se pudo entrar");
    } catch (err) {
      const msg = err.response?.data?.mensaje || "Error de conexión con el servidor";
      setError(msg);
    }
  }

  return (
    <div className="login-page">
      <div className="tarjeta login-caja">
        <h2>Entrar</h2>
        <p style={{ textAlign: "center", fontSize: "0.95rem" }}>
          Cuentas creadas al iniciar el servidor: <strong>admin</strong> / admin123 o <strong>gestor</strong> / gestor123
        </p>
        <form className="grid-form" onSubmit={enviar} style={{ margin: "0 auto" }}>
          <label>
            Usuario
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="msg-error">{error}</p> : null}
          <button type="submit" className="btn">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
