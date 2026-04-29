from datetime import datetime, date

from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from sqlalchemy import func, or_
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import Cliente, Libro, Prestamo, UsuarioSistema

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/estado", methods=["GET"])
def estado_publico():
    """Para comprobar en el navegador si hay datos (sin login)."""
    return jsonify(
        ok=True,
        libros=Libro.query.count(),
        clientes=Cliente.query.count(),
        prestamos=Prestamo.query.count(),
        usuarios_sistema=UsuarioSistema.query.count(),
    )


def _rol():
    uid = get_jwt_identity()
    if not uid:
        return None
    u = db.session.get(UsuarioSistema, int(uid))
    return u.rol if u else None


def requiere_gestor_o_admin():
    r = _rol()
    if r not in ("gestor", "administrador"):
        return jsonify({"ok": False, "mensaje": "No autorizado"}), 403
    return None


def requiere_admin():
    r = _rol()
    if r != "administrador":
        return jsonify({"ok": False, "mensaje": "Solo administrador"}), 403
    return None


def correo_valido(valor):
    try:
        validate_email(valor, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


def validar_libro(data, libro_id=None):
    titulo = (data.get("titulo") or "").strip()
    autor = (data.get("autor") or "").strip()
    editorial = (data.get("editorial") or "").strip()
    isbn = (data.get("isbn") or "").strip()
    anio = data.get("anio_publicacion")
    cantidad = data.get("cantidad_disponible")

    if not titulo or not autor or not isbn:
        return None, (jsonify({"ok": False, "mensaje": "Título, autor e ISBN son obligatorios"}), 400)
    if not editorial:
        return None, (jsonify({"ok": False, "mensaje": "La editorial es obligatoria"}), 400)
    try:
        anio = int(anio)
    except (TypeError, ValueError):
        return None, (jsonify({"ok": False, "mensaje": "Año de publicación inválido"}), 400)
    try:
        cantidad = int(cantidad)
    except (TypeError, ValueError):
        return None, (jsonify({"ok": False, "mensaje": "Cantidad inválida"}), 400)
    if cantidad < 0:
        return None, (jsonify({"ok": False, "mensaje": "La cantidad no puede ser negativa"}), 400)

    if libro_id is None:
        if Libro.query.filter_by(isbn=isbn).first():
            return None, (jsonify({"ok": False, "mensaje": "Ya existe un libro con ese ISBN"}), 400)
    else:
        otro = Libro.query.filter(Libro.isbn == isbn, Libro.id != libro_id).first()
        if otro:
            return None, (jsonify({"ok": False, "mensaje": "Ya existe otro libro con ese ISBN"}), 400)

    return (
        {
            "titulo": titulo,
            "autor": autor,
            "editorial": editorial,
            "isbn": isbn,
            "anio_publicacion": anio,
            "cantidad_disponible": cantidad,
        },
        None,
    )


def validar_cliente(data, cliente_id=None):
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    correo = (data.get("correo") or "").strip()
    telefono = (data.get("telefono") or "").strip()
    nid = (data.get("numero_identificacion") or "").strip()

    if not nombre or not nid:
        return None, (jsonify({"ok": False, "mensaje": "Nombre e identificación son obligatorios"}), 400)
    if not apellido:
        return None, (jsonify({"ok": False, "mensaje": "El apellido es obligatorio"}), 400)
    if not correo_valido(correo):
        return None, (jsonify({"ok": False, "mensaje": "Correo con formato inválido"}), 400)
    if not telefono:
        return None, (jsonify({"ok": False, "mensaje": "El teléfono es obligatorio"}), 400)

    if cliente_id is None:
        if Cliente.query.filter_by(numero_identificacion=nid).first():
            return None, (jsonify({"ok": False, "mensaje": "Esa identificación ya está registrada"}), 400)
    else:
        otro = Cliente.query.filter(
            Cliente.numero_identificacion == nid, Cliente.id != cliente_id
        ).first()
        if otro:
            return None, (jsonify({"ok": False, "mensaje": "Esa identificación ya está en uso"}), 400)

    return (
        {
            "nombre": nombre,
            "apellido": apellido,
            "correo": correo,
            "telefono": telefono,
            "numero_identificacion": nid,
        },
        None,
    )


@bp.route("/auth/login", methods=["POST"])
def login():
    datos = request.get_json(silent=True) or {}
    usuario = (datos.get("usuario") or "").strip()
    clave = datos.get("clave") or ""
    if not usuario or not clave:
        return jsonify({"ok": False, "mensaje": "Usuario y clave son obligatorios"}), 400
    u = UsuarioSistema.query.filter_by(usuario=usuario).first()
    if not u or not check_password_hash(u.clave_hash, clave):
        return jsonify({"ok": False, "mensaje": "Datos incorrectos"}), 401
    token = create_access_token(identity=str(u.id))
    return jsonify(
        {
            "ok": True,
            "token": token,
            "usuario": u.usuario,
            "rol": u.rol,
        }
    )


@bp.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    u = db.session.get(UsuarioSistema, uid)
    if not u:
        return jsonify({"ok": False, "mensaje": "Usuario no existe"}), 404
    return jsonify({"ok": True, "usuario": u.usuario, "rol": u.rol})



@bp.route("/libros", methods=["GET"])
@jwt_required()
def listar_libros():
    err = requiere_gestor_o_admin()
    if err:
        return err
    lista = Libro.query.order_by(Libro.titulo).all()
    return jsonify({"ok": True, "datos": [x.to_dict() for x in lista]})


@bp.route("/libros", methods=["POST"])
@jwt_required()
def crear_libro():
    err = requiere_gestor_o_admin()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    payload, val_err = validar_libro(d)
    if val_err:
        return val_err
    libro = Libro(**payload)
    db.session.add(libro)
    db.session.commit()
    return jsonify({"ok": True, "datos": libro.to_dict()}), 201


@bp.route("/libros/<int:libro_id>", methods=["PUT"])
@jwt_required()
def actualizar_libro(libro_id):
    err = requiere_gestor_o_admin()
    if err:
        return err
    libro = db.session.get(Libro, libro_id)
    if not libro:
        return jsonify({"ok": False, "mensaje": "Libro no encontrado"}), 404
    d = request.get_json(silent=True) or {}
    payload, val_err = validar_libro(d, libro_id=libro_id)
    if val_err:
        return val_err
    libro.titulo = payload["titulo"]
    libro.autor = payload["autor"]
    libro.editorial = payload["editorial"]
    libro.anio_publicacion = payload["anio_publicacion"]
    libro.isbn = payload["isbn"]
    libro.cantidad_disponible = payload["cantidad_disponible"]
    db.session.commit()
    return jsonify({"ok": True, "datos": libro.to_dict()})


@bp.route("/libros/<int:libro_id>", methods=["DELETE"])
@jwt_required()
def borrar_libro(libro_id):
    err = requiere_gestor_o_admin()
    if err:
        return err
    libro = db.session.get(Libro, libro_id)
    if not libro:
        return jsonify({"ok": False, "mensaje": "Libro no encontrado"}), 404
    activos = Prestamo.query.filter_by(libro_id=libro_id, estado="activo").count()
    if activos > 0:
        return jsonify({"ok": False, "mensaje": "Hay préstamos activos de este libro"}), 400
    db.session.delete(libro)
    db.session.commit()
    return jsonify({"ok": True})


@bp.route("/clientes", methods=["GET"])
@jwt_required()
def listar_clientes():
    err = requiere_gestor_o_admin()
    if err:
        return err
    lista = Cliente.query.order_by(Cliente.apellido, Cliente.nombre).all()
    return jsonify({"ok": True, "datos": [x.to_dict() for x in lista]})


@bp.route("/clientes", methods=["POST"])
@jwt_required()
def crear_cliente():
    err = requiere_gestor_o_admin()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    payload, val_err = validar_cliente(d)
    if val_err:
        return val_err
    c = Cliente(**payload)
    db.session.add(c)
    db.session.commit()
    return jsonify({"ok": True, "datos": c.to_dict()}), 201


@bp.route("/clientes/<int:cliente_id>", methods=["PUT"])
@jwt_required()
def actualizar_cliente(cliente_id):
    err = requiere_gestor_o_admin()
    if err:
        return err
    c = db.session.get(Cliente, cliente_id)
    if not c:
        return jsonify({"ok": False, "mensaje": "Cliente no encontrado"}), 404
    d = request.get_json(silent=True) or {}
    payload, val_err = validar_cliente(d, cliente_id=cliente_id)
    if val_err:
        return val_err
    c.nombre = payload["nombre"]
    c.apellido = payload["apellido"]
    c.correo = payload["correo"]
    c.telefono = payload["telefono"]
    c.numero_identificacion = payload["numero_identificacion"]
    db.session.commit()
    return jsonify({"ok": True, "datos": c.to_dict()})


@bp.route("/clientes/<int:cliente_id>", methods=["DELETE"])
@jwt_required()
def borrar_cliente(cliente_id):
    err = requiere_gestor_o_admin()
    if err:
        return err
    c = db.session.get(Cliente, cliente_id)
    if not c:
        return jsonify({"ok": False, "mensaje": "Cliente no encontrado"}), 404
    activos = Prestamo.query.filter_by(cliente_id=cliente_id, estado="activo").count()
    if activos > 0:
        return jsonify({"ok": False, "mensaje": "El cliente tiene un préstamo activo"}), 400
    db.session.delete(c)
    db.session.commit()
    return jsonify({"ok": True})


def _parse_fecha(s):
    if not s:
        return None
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


@bp.route("/prestamos", methods=["GET"])
@jwt_required()
def listar_prestamos():
    err = requiere_gestor_o_admin()
    if err:
        return err
    q = Prestamo.query
    estado = request.args.get("estado")
    if estado in ("activo", "devuelto"):
        q = q.filter_by(estado=estado)
    lista = q.order_by(Prestamo.fecha_prestamo.desc()).all()
    for p in lista:
        _ = p.cliente
        _ = p.libro
    return jsonify({"ok": True, "datos": [x.to_dict() for x in lista]})


@bp.route("/prestamos", methods=["POST"])
@jwt_required()
def crear_prestamo():
    err = requiere_gestor_o_admin()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    cliente_id = d.get("cliente_id")
    libro_id = d.get("libro_id")
    fecha_dev_esperada = _parse_fecha(d.get("fecha_devolucion_esperada"))
    if not cliente_id or not libro_id:
        return jsonify({"ok": False, "mensaje": "Cliente y libro son obligatorios"}), 400
    if not fecha_dev_esperada:
        return jsonify({"ok": False, "mensaje": "Fecha de devolución esperada inválida"}), 400
    try:
        cliente_id = int(cliente_id)
        libro_id = int(libro_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "mensaje": "IDs inválidos"}), 400
    cliente = db.session.get(Cliente, cliente_id)
    libro = db.session.get(Libro, libro_id)
    if not cliente or not libro:
        return jsonify({"ok": False, "mensaje": "Cliente o libro no existe"}), 404
    if Prestamo.query.filter_by(cliente_id=cliente_id, estado="activo").first():
        return jsonify(
            {"ok": False, "mensaje": "Este usuario ya tiene un libro prestado (solo uno a la vez)"}
        ), 400
    if libro.cantidad_disponible < 1:
        return jsonify({"ok": False, "mensaje": "No hay ejemplares disponibles"}), 400
    hoy = date.today()
    mismo_dia = Prestamo.query.filter(
        Prestamo.libro_id == libro_id,
        Prestamo.estado == "activo",
        func.date(Prestamo.fecha_prestamo) == hoy,
    ).first()
    if mismo_dia:
        return jsonify(
            {"ok": False, "mensaje": "Este libro ya fue asignado a alguien hoy (mismo día)"}
        ), 400
    fecha_prestamo = datetime.utcnow()
    p = Prestamo(
        cliente_id=cliente_id,
        libro_id=libro_id,
        fecha_prestamo=fecha_prestamo,
        fecha_devolucion_esperada=fecha_dev_esperada,
        estado="activo",
    )
    libro.cantidad_disponible -= 1
    db.session.add(p)
    db.session.commit()
    _ = p.cliente
    _ = p.libro
    return jsonify({"ok": True, "datos": p.to_dict()}), 201


@bp.route("/prestamos/<int:prestamo_id>/devolver", methods=["POST"])
@jwt_required()
def devolver_prestamo(prestamo_id):
    err = requiere_gestor_o_admin()
    if err:
        return err
    p = db.session.get(Prestamo, prestamo_id)
    if not p:
        return jsonify({"ok": False, "mensaje": "Préstamo no encontrado"}), 404
    if p.estado != "activo":
        return jsonify({"ok": False, "mensaje": "Este préstamo ya estaba devuelto"}), 400
    libro = db.session.get(Libro, p.libro_id)
    if libro:
        libro.cantidad_disponible += 1
    p.estado = "devuelto"
    p.fecha_devolucion_real = date.today()
    db.session.commit()
    _ = p.cliente
    _ = p.libro
    return jsonify({"ok": True, "datos": p.to_dict()})



@bp.route("/reportes", methods=["GET"])
@jwt_required()
def reportes():
    err = requiere_admin()
    if err:
        return err
    buscar = (request.args.get("q") or "").strip()
    libro_id = request.args.get("libro_id", type=int)
    cliente_id = request.args.get("cliente_id", type=int)
    q = Prestamo.query
    if libro_id:
        q = q.filter(Prestamo.libro_id == libro_id)
    if cliente_id:
        q = q.filter(Prestamo.cliente_id == cliente_id)
    if buscar:
        like = f"%{buscar}%"
        q = q.join(Libro, Prestamo.libro_id == Libro.id).join(
            Cliente, Prestamo.cliente_id == Cliente.id
        )
        q = q.filter(
            or_(
                Libro.isbn.like(like),
                Libro.titulo.like(like),
                Cliente.nombre.like(like),
                Cliente.apellido.like(like),
                func.concat(Cliente.nombre, " ", Cliente.apellido).like(like),
            )
        )
    lista = q.order_by(Prestamo.fecha_prestamo.desc()).all()
    for p in lista:
        _ = p.cliente
        _ = p.libro
    salida = []
    for p in lista:
        salida.append(
            {
                "id": p.id,
                "fecha_prestamo": p.fecha_prestamo.isoformat() if p.fecha_prestamo else None,
                "fecha_devolucion_esperada": p.fecha_devolucion_esperada.isoformat()
                if p.fecha_devolucion_esperada
                else None,
                "fecha_devolucion_real": p.fecha_devolucion_real.isoformat()
                if p.fecha_devolucion_real
                else None,
                "estado": p.estado,
                "usuario_nombre": p.cliente.nombre_completo() if p.cliente else "",
                "libro_titulo": p.libro.titulo if p.libro else "",
                "libro_isbn": p.libro.isbn if p.libro else "",
            }
        )
    return jsonify({"ok": True, "datos": salida})


@bp.route("/reportes/por-libro/<int:libro_id>", methods=["GET"])
@jwt_required()
def reportes_por_libro(libro_id):
    err = requiere_admin()
    if err:
        return err
    lista = (
        Prestamo.query.filter_by(libro_id=libro_id).order_by(Prestamo.fecha_prestamo.desc()).all()
    )
    for p in lista:
        _ = p.cliente
        _ = p.libro
    return jsonify({"ok": True, "datos": [x.to_dict() for x in lista]})


@bp.route("/reportes/por-cliente/<int:cliente_id>", methods=["GET"])
@jwt_required()
def reportes_por_cliente(cliente_id):
    err = requiere_admin()
    if err:
        return err
    lista = (
        Prestamo.query.filter_by(cliente_id=cliente_id)
        .order_by(Prestamo.fecha_prestamo.desc())
        .all()
    )
    for p in lista:
        _ = p.cliente
        _ = p.libro
    return jsonify({"ok": True, "datos": [x.to_dict() for x in lista]})


@bp.route("/usuarios-sistema", methods=["GET"])
@jwt_required()
def listar_usuarios_sistema():
    err = requiere_admin()
    if err:
        return err
    lista = UsuarioSistema.query.order_by(UsuarioSistema.usuario).all()
    return jsonify({"ok": True, "datos": [x.to_dict() for x in lista]})


@bp.route("/usuarios-sistema", methods=["POST"])
@jwt_required()
def crear_usuario_sistema():
    err = requiere_admin()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    usuario = (d.get("usuario") or "").strip()
    clave = d.get("clave") or ""
    rol = (d.get("rol") or "").strip()
    if not usuario or not clave:
        return jsonify({"ok": False, "mensaje": "Usuario y clave obligatorios"}), 400
    if rol not in ("gestor", "administrador"):
        return jsonify({"ok": False, "mensaje": "Rol debe ser gestor o administrador"}), 400
    if UsuarioSistema.query.filter_by(usuario=usuario).first():
        return jsonify({"ok": False, "mensaje": "Ese usuario ya existe"}), 400
    u = UsuarioSistema(
        usuario=usuario,
        clave_hash=generate_password_hash(clave),
        rol=rol,
    )
    db.session.add(u)
    db.session.commit()
    return jsonify({"ok": True, "datos": u.to_dict()}), 201
