import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

_backend_dir = Path(__file__).resolve().parent

load_dotenv(_backend_dir / ".env", override=True)


def armar_database_uri():
    directa = (os.environ.get("DATABASE_URL") or "").strip()
    if directa:
        return directa

    usuario = os.environ.get("MYSQL_USER", "root")
    clave = (os.environ.get("MYSQL_PASSWORD") or "").strip()
    if not clave:
        clave = "12345"
    host = os.environ.get("MYSQL_HOST", "127.0.0.1")
    puerto = os.environ.get("MYSQL_PORT", "3306")
    nombre_bd = os.environ.get("MYSQL_DATABASE", "buenaventura")

    clave_cod = quote_plus(clave) if clave is not None else ""
    return f"mysql+pymysql://{usuario}:{clave_cod}@{host}:{puerto}/{nombre_bd}"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "buenaventura-clave-secreta-cambiar-en-produccion")
    SQLALCHEMY_DATABASE_URI = armar_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "jwt-buenaventura-cambiar-en-produccion-minimo-32-caracteres",
    )
    JWT_ACCESS_TOKEN_EXPIRES = False
