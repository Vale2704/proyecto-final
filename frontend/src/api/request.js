import api from "./client.js";
import { textoErrorApi } from "./error.js";

export async function cargarLista({
  setMsg,
  setLista,
  url,
  mensajeSinDatos = "Respuesta sin datos.",
}) {
  setMsg("");
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
  }
}

export async function ejecutarAccion({
  setMsg,
  accion,
  mensajeError = "Ocurrió un error.",
}) {
  setMsg("");
  try {
    await accion();
    return true;
  } catch (error) {
    setMsg(error.response?.data?.mensaje || mensajeError || textoErrorApi(error));
    return false;
  }
}
