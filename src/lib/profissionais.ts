// ─── Sistema de Profissionais ────────────────────────────────────────────────

export type DiaSemana = "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb" | "Dom";

export interface Profissional {
  id: number;
  nome: string;
  avatar: string; // initials
  especialidade: string;
  diasAtendimento: DiaSemana[];
  ativo: boolean;
  cor: string; // hex color for avatar bg
}

const STORAGE_KEY = "crm_profissionais_v1";
const EVENT = "crm_profissionais_updated";

const CORES_AVATAR = [
  "#db6e2d", "#815252", "#2d6073", "#059669", "#6b4f2a",
  "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2",
];

let cache: Profissional[] | null = null;
const EMPTY: Profissional[] = [];

function readStorage(): Profissional[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY;
  try {
    return JSON.parse(raw) as Profissional[];
  } catch {
    return EMPTY;
  }
}

export function getProfissionais(): Profissional[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache === null) cache = readStorage();
  return cache;
}

export function salvarProfissionais(dados: Profissional[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  cache = dados;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeProfissionais(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function getProfissionaisServerSnapshot(): Profissional[] {
  return EMPTY;
}

export function addProfissional(
  p: Omit<Profissional, "id" | "avatar" | "ativo" | "cor">
): Profissional {
  const lista = getProfissionais();
  const iniciais = p.nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const corIndex = lista.length % CORES_AVATAR.length;
  const novo: Profissional = {
    ...p,
    id: lista.length > 0 ? Math.max(...lista.map((x) => x.id)) + 1 : 1,
    avatar: iniciais || "P",
    ativo: true,
    cor: CORES_AVATAR[corIndex],
  };
  lista.push(novo);
  salvarProfissionais(lista);
  return novo;
}

export function toggleProfissionalAtivo(id: number): void {
  const lista = getProfissionais().map((p) =>
    p.id === id ? { ...p, ativo: !p.ativo } : p
  );
  salvarProfissionais(lista);
}

export function removeProfissional(id: number): void {
  const lista = getProfissionais().filter((p) => p.id !== id);
  salvarProfissionais(lista);
}

export function updateProfissional(id: number, patch: Partial<Omit<Profissional, "id">>): void {
  const lista = getProfissionais().map((p) =>
    p.id === id ? { ...p, ...patch } : p
  );
  salvarProfissionais(lista);
}

export const PROFISSIONAIS_EVENT = EVENT;
