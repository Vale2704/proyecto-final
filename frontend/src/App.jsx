import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Panel from "./pages/Panel.jsx";
import Libros from "./pages/Libros.jsx";
import Clientes from "./pages/Clientes.jsx";
import Prestamos from "./pages/Prestamos.jsx";
import Reportes from "./pages/Reportes.jsx";
import UsuariosSistema from "./pages/UsuariosSistema.jsx";

function Layout({ children }) {
  const { usuario, rol, logout } = useAuth();
  const loc = useLocation();
  const linkClass = (path) => (loc.pathname === path ? "activo" : "");

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Biblioteca BuenaVentura</h1>
        <nav>
          <Link className={linkClass("/panel")} to="/panel">
            Inicio
          </Link>
          <Link className={linkClass("/libros")} to="/libros">
            Libros
          </Link>
          <Link className={linkClass("/clientes")} to="/clientes">
            Clientes
          </Link>
          <Link className={linkClass("/prestamos")} to="/prestamos">
            Préstamos
          </Link>
          {rol === "administrador" && (
            <>
              <Link className={linkClass("/reportes")} to="/reportes">
                Reportes
              </Link>
              <Link className={linkClass("/usuarios")} to="/usuarios">
                Usuarios sistema
              </Link>
            </>
          )}
        </nav>
        <div className="user">
          {usuario} ({rol}){" "}
          <button type="button" className="btn btn-sec" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main className="contenido">{children}</main>
    </div>
  );
}

function Privado({ children }) {
  const { listo } = useAuth();
  if (!listo) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function SoloAdmin({ children }) {
  const { listo, rol } = useAuth();
  if (!listo) return <Navigate to="/" replace />;
  if (rol !== "administrador") return <Navigate to="/panel" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { listo } = useAuth();

  return (
    <Routes>
      <Route path="/" element={listo ? <Navigate to="/panel" replace /> : <Login />} />
      <Route
        path="/panel"
        element={
          <Privado>
            <Panel />
          </Privado>
        }
      />
      <Route
        path="/libros"
        element={
          <Privado>
            <Libros />
          </Privado>
        }
      />
      <Route
        path="/clientes"
        element={
          <Privado>
            <Clientes />
          </Privado>
        }
      />
      <Route
        path="/prestamos"
        element={
          <Privado>
            <Prestamos />
          </Privado>
        }
      />
      <Route
        path="/reportes"
        element={
          <SoloAdmin>
            <Reportes />
          </SoloAdmin>
        }
      />
      <Route
        path="/usuarios"
        element={
          <SoloAdmin>
            <UsuariosSistema />
          </SoloAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
