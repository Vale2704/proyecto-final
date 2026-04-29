import os
import time

from flask import Flask, Response, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

from config import Config
from extensions import db, jwt
import models  
from api import bp as api_bp
from models import UsuarioSistema


def esperar_bd(uri, intentos=40):
    ultimo_error = None
    for _ in range(intentos):
        try:
            motor = create_engine(uri)
            with motor.connect() as cx:
                cx.execute(text("SELECT 1"))
            return True, None
        except Exception as exc:
            ultimo_error = exc
            time.sleep(1.5)
    return False, ultimo_error


def poblar_si_vacio():
    """Solo crea admin y gestor si no hay usuarios del sistema."""
    if UsuarioSistema.query.first():
        return
    db.session.add(
        UsuarioSistema(
            usuario="admin",
            clave_hash=generate_password_hash("admin123"),
            rol="administrador",
        )
    )
    db.session.add(
        UsuarioSistema(
            usuario="gestor",
            clave_hash=generate_password_hash("gestor123"),
            rol="gestor",
        )
    )
    db.session.commit()


def crear_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    jwt.init_app(app)
    app.register_blueprint(api_bp)

    @app.get("/")
    def raiz():
        raw = request.host or "127.0.0.1:5000"
        if raw.startswith("["):
            host = raw[1 : raw.index("]")]
        else:
            host = raw.rsplit(":", 1)[0] if ":" in raw else raw
        url_app = f"http://{host}:5173/"
        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Biblioteca BuenaVentura</title>
</head>
<body style="font-family: system-ui, sans-serif; padding: 1.5rem; max-width: 36rem;">
  <h1 style="font-weight:600;">Estás en la API (puerto 5000)</h1>
  <p>La interfaz con React está en el <strong>puerto 5173</strong>. Redirigiendo…</p>
  <p>Si no te lleva solo, abre: <a href="{url_app}">{url_app}</a></p>
  <p style="color:#555;font-size:0.95rem;">En otra terminal: <code>cd frontend</code> y <code>npm run dev</code></p>
  <script>location.replace("{url_app}");</script>
</body>
</html>"""
        return Response(html, mimetype="text/html; charset=utf-8")

    @app.get("/favicon.ico")
    def favicon():
        return Response(status=204)

    with app.app_context():
        uri = app.config["SQLALCHEMY_DATABASE_URI"]
        ok, err = esperar_bd(uri)
        if not ok:
            detalle = str(err) if err else "sin detalle"
            ayuda = (
                "No se pudo conectar a MySQL.\n"
                f"Detalle tecnico: {detalle}\n\n"
                "Pasos rapidos:\n"
                "1) En Workbench, crea la base si no existe: CREATE DATABASE buenaventura;\n"
                "2) Copia backend/.env.example a backend/.env y pon MYSQL_PASSWORD con la misma clave de root que usas en Workbench.\n"
                "3) Revisa MYSQL_PORT (3306 en MySQL80 local) y que el servicio MySQL80 este iniciado en Windows.\n"
            )
            raise RuntimeError(ayuda)
        db.create_all()
        poblar_si_vacio()
        print("[BuenaVentura] API lista. Los libros, clientes y prestamos los cargas tú desde la web.")

    return app


app = crear_app()

if __name__ == "__main__":
    puerto = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=puerto, debug=os.environ.get("FLASK_DEBUG") == "1")
