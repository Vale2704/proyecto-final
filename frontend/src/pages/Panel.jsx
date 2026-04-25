import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Panel() {
  const { usuario, rol } = useAuth();

  return (
    <div className="tarjeta">
      <h2>Bienvenido, {usuario}</h2>
      <p>
        Tu rol es <strong>{rol}</strong>. Desde aquí puedes ir a cada parte del sistema usando el menú de arriba.
      </p>
      <p style={{ fontSize: "0.95rem", color: "#4a4033", lineHeight: 1.5 }}>
        <strong>Cómo cargar datos y que se guarden solos:</strong> con el backend (<code>python app.py</code>) y la web
        (<code>npm run dev</code>) encendidos, entra en cada sección y rellena el formulario. Pulsa{" "}
        <strong>Agregar</strong>, <strong>Actualizar</strong> o <strong>Registrar préstamo</strong> según la pantalla:
        todo se guarda en MySQL en ese momento y queda hasta que tú lo borres o edites. Orden recomendado: primero{" "}
        <Link to="/libros">Libros</Link>, luego <Link to="/clientes">Clientes</Link>, después{" "}
        <Link to="/prestamos">Préstamos</Link>.
      </p>
      <ul>
        <li>
          <Link to="/libros">Libros</Link> — dar de alta, editar o quitar libros del catálogo.
        </li>
        <li>
          <Link to="/clientes">Clientes</Link> — personas que pueden pedir préstamos.
        </li>
        <li>
          <Link to="/prestamos">Préstamos</Link> — prestar libros y marcar devoluciones.
        </li>
        {rol === "administrador" && (
          <li>
            <Link to="/reportes">Reportes</Link> — ver historial y buscar por ISBN, título o nombre.
          </li>
        )}
      </ul>
    </div>
  );
}
