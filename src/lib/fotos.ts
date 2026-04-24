// ─── Prontuário fotográfico — IndexedDB ─────────────────────────────────────
// localStorage não aguenta blobs; IndexedDB aguenta gigabytes.
// Cada FotoRegistro tem 0/1/2 blobs (antes, depois).

import type { FotoRegistro } from "@/types/foto";

const DB_NAME = "gabelia-crm";
const DB_VERSION = 1;
const STORE = "fotos";
const EVENT = "crm_fotos_updated";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("clienteId", "clienteId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listarFotos(clienteId: string): Promise<FotoRegistro[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("clienteId");
    const req = idx.getAll(clienteId);
    req.onsuccess = () => {
      const arr = (req.result as FotoRegistro[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(arr);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function salvarFoto(foto: FotoRegistro): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(foto);
    tx.oncomplete = () => {
      window.dispatchEvent(new Event(EVENT));
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function removerFoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => {
      window.dispatchEvent(new Event(EVENT));
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Redimensiona para max 1600px no maior lado, JPEG qualidade 0.85.
// Foto de 12MP vira ~250kB sem perda visual perceptível.
export async function redimensionarImagem(file: File, maxSize = 1600): Promise<Blob> {
  const img = await createImageBitmap(file);
  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = width > height ? maxSize / width : maxSize / height;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context indisponível");
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar blob"))),
      "image/jpeg",
      0.85,
    );
  });
}
