from datetime import datetime
from extensions import db


class UsuarioSistema(db.Model):
    __tablename__ = "usuario_sistema"

    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(80), unique=True, nullable=False)
    clave_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False) 

    def to_dict(self):
        return {"id": self.id, "usuario": self.usuario, "rol": self.rol}


class Libro(db.Model):
    __tablename__ = "libro"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(255), nullable=False)
    autor = db.Column(db.String(255), nullable=False)
    editorial = db.Column(db.String(255), nullable=False)
    anio_publicacion = db.Column(db.Integer, nullable=False)
    isbn = db.Column(db.String(32), unique=True, nullable=False)
    cantidad_disponible = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "autor": self.autor,
            "editorial": self.editorial,
            "anio_publicacion": self.anio_publicacion,
            "isbn": self.isbn,
            "cantidad_disponible": self.cantidad_disponible,
        }


class Cliente(db.Model):
    __tablename__ = "cliente"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    apellido = db.Column(db.String(120), nullable=False)
    correo = db.Column(db.String(180), nullable=False)
    telefono = db.Column(db.String(40), nullable=False)
    numero_identificacion = db.Column(db.String(40), unique=True, nullable=False)

    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}".strip()

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "correo": self.correo,
            "telefono": self.telefono,
            "numero_identificacion": self.numero_identificacion,
        }


class Prestamo(db.Model):
    __tablename__ = "prestamo"

    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey("cliente.id"), nullable=False)
    libro_id = db.Column(db.Integer, db.ForeignKey("libro.id"), nullable=False)
    fecha_prestamo = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    fecha_devolucion_esperada = db.Column(db.Date, nullable=False)
    fecha_devolucion_real = db.Column(db.Date, nullable=True)
    estado = db.Column(db.String(20), nullable=False, default="activo") 

    cliente = db.relationship("Cliente", backref=db.backref("prestamos", lazy=True))
    libro = db.relationship("Libro", backref=db.backref("prestamos", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "cliente_id": self.cliente_id,
            "libro_id": self.libro_id,
            "fecha_prestamo": self.fecha_prestamo.isoformat() if self.fecha_prestamo else None,
            "fecha_devolucion_esperada": self.fecha_devolucion_esperada.isoformat()
            if self.fecha_devolucion_esperada
            else None,
            "fecha_devolucion_real": self.fecha_devolucion_real.isoformat()
            if self.fecha_devolucion_real
            else None,
            "estado": self.estado,
            "cliente": self.cliente.to_dict() if self.cliente else None,
            "libro": self.libro.to_dict() if self.libro else None,
        }
