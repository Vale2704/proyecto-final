import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario"));
  const [rol, setRol] = useState(() => localStorage.getItem("rol"));

  const login = async (u, clave) => {
    const { data } = await api.post("/api/auth/login", { usuario: u, clave });
    if (data.ok) {
      setToken(data.token);
      setUsuario(data.usuario);
      setRol(data.rol);
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", data.usuario);
      localStorage.setItem("rol", data.rol);
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setRol(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
  };

  const value = useMemo(
    () => ({
      token,
      usuario,
      rol,
      login,
      logout,
      listo: !!token,
    }),
    [token, usuario, rol]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera del proveedor");
  return ctx;
}
