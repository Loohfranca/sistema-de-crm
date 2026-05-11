// ─── Categorias de procedimentos ────────────────────────────────────────────
// Lista separada pra manter ordem e permitir categorias sem procedimentos.

import { addLog } from "./logs";

const KEY = "crm_categorias_v1";
const EVENT = "crm_categorias_updated";

const PADRAO = [
  "Pele",
  "Injetáveis",
  "Peeling",
  "Sobrancelhas e cílios",
  "Depilação",
  "Cabelo e penteado",
  "Massagem",
  "Corporal",
];

let cache: string[] | null = null;
const SERVER_SNAPSHOT: string[] = PADRAO;

function readStorage(): string[] {
  if (typeof window === "undefined") return PADRAO;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(PADRAO));
    return PADRAO;
  }
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return PADRAO;
  }
}

export function getCategorias(): string[] {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  if (cache === null) cache = readStorage();
  return cache;
}

function salvar(lista: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lista));
  cache = lista;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCategorias(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function getCategoriasServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

export function adicionarCategoria(nome: string): string[] {
  const trimmed = nome.trim();
  if (!trimmed) return getCategorias();
  const lista = getCategorias();
  if (lista.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return lista;
  const atualizada = [...lista, trimmed];
  salvar(atualizada);
  addLog({ usuario: "Administrador", acao: "Criou", entidade: "categoria", descricao: `Criou categoria ${trimmed}` });
  return atualizada;
}

export function removerCategoria(nome: string): string[] {
  const lista = getCategorias().filter((c) => c !== nome);
  salvar(lista);
  addLog({ usuario: "Administrador", acao: "Excluiu", entidade: "categoria", descricao: `Removeu categoria ${nome}` });
  return lista;
}

export function renomearCategoria(antiga: string, nova: string): string[] {
  const lista = getCategorias().map((c) => (c === antiga ? nova : c));
  salvar(lista);
  addLog({ usuario: "Administrador", acao: "Editou", entidade: "categoria", descricao: `Renomeou categoria ${antiga} → ${nova}` });
  return lista;
}
