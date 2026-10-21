// Borradores del registro asistido, guardados en el celular del gestor (IndexedDB). Sirven para
// registrar sin señal: se envían cuando vuelve la conexión. Solo viven en este dispositivo.

export type Borrador = {
  id: string; // también será el id del perfil: reintentar el envío no crea duplicados
  creadoEn: string;
  nombre: string;
  ubicacion: string;
  oficio: string;
  celular: string;
  visibilidad: "reservado" | "visible";
  historiaTexto: string;
  historiaAudio: Blob | null;
  foto: Blob | null;
  autorizacionMedio: "firma" | "audio";
  autorizacion: Blob | null;
  estado: "pendiente" | "enviando" | "error";
  error?: string;
};

const BASE = "plataforma-senior";
const TABLA = "registros";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(TABLA, { keyPath: "id" });
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
}

async function operar<T>(modo: IDBTransactionMode, fn: (tabla: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolver, rechazar) => {
    const pedido = fn(db.transaction(TABLA, modo).objectStore(TABLA));
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
}

export const guardarBorrador = (b: Borrador) => operar("readwrite", (t) => t.put(b));
export const borrarBorrador = (id: string) => operar("readwrite", (t) => t.delete(id));
export const listarBorradores = async () =>
  ((await operar("readonly", (t) => t.getAll())) as Borrador[]).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
