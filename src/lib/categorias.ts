// ─── Categorias de procedimentos ────────────────────────────────────────────
// Lista separada pra manter ordem e permitir categorias sem procedimentos.

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

export function getCategorias(): string[] {
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

function salvar(lista: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event(EVENT));
}

export function adicionarCategoria(nome: string): string[] {
  const trimmed = nome.trim();
  if (!trimmed) return getCategorias();
  const lista = getCategorias();
  if (lista.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return lista;
  const atualizada = [...lista, trimmed];
  salvar(atualizada);
  return atualizada;
}

export function removerCategoria(nome: string): string[] {
  const lista = getCategorias().filter((c) => c !== nome);
  salvar(lista);
  return lista;
}

export function renomearCategoria(antiga: string, nova: string): string[] {
  const lista = getCategorias().map((c) => (c === antiga ? nova : c));
  salvar(lista);
  return lista;
}
