export function textoErrorApi(error) {
  const r = error?.response;
  if (!r) {
    return "No llega el servidor (¿corriste python app.py en la carpeta backend, puerto 5000?)";
  }
  const d = r.data;
  if (typeof d === "string") return d;
  return d?.mensaje || d?.msg || `Error ${r.status}`;
}
