import api from "./client.js";
import { textoErrorApi } from "./error.js";

export async function cargarLista({
  setMsg,
  setLista,
  url,
  mensajeSinDatos = "Respuesta sin datos.",
  setCargando,
}) {
  setMsg("");
  setCargando?.(true);
  try {
    const { data } = await api.get(url);
    if (data.ok) {
      setLista(data.datos || []);
      return true;
    }
    setLista([]);
    setMsg(data.mensaje || mensajeSinDatos);
    return false;
  } catch (error) {
    setLista([]);
    setMsg(textoErrorApi(error));
    return false;
  } finally {
    setCargando?.(false);
  }
}

export async function ejecutarAccion({ setMsg, accion }) {
  setMsg("");
  try {
    await accion();
    return true;
  } catch (error) {
    setMsg(textoErrorApi(error));
    return false;
  }
}
