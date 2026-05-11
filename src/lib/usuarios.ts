// ─── Sistema de Usuários ─────────────────────────────────────────────────────

export type CargoUsuario = "Administrador" | "Usuário" | "Gerente";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: CargoUsuario;
  avatar: string; // initials
  cadastradoEm: string; // ISO date "YYYY-MM-DD"
  ativo: boolean;
}

const STORAGE_KEY = "crm_usuarios_v1";
const EVENT = "crm_usuarios_updated";

function buildInitialUsuarios(): Usuario[] {
  const hoje = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 1,
      nome: "Administrador",
      email: "admin@studio.com",
      cargo: "Administrador",
      avatar: "AD",
      cadastradoEm: hoje,
      ativo: true,
    },
  ];
}

let cache: Usuario[] | null = null;
const SERVER_EMPTY: Usuario[] = [];

function readStorage(): Usuario[] {
  if (typeof window === "undefined") return SERVER_EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const dados = buildInitialUsuarios();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    return dados;
  }
  try {
    return JSON.parse(raw) as Usuario[];
  } catch {
    return buildInitialUsuarios();
  }
}

export function getUsuarios(): Usuario[] {
  if (typeof window === "undefined") return SERVER_EMPTY;
  if (cache === null) cache = readStorage();
  return cache;
}

export function salvarUsuarios(dados: Usuario[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  cache = dados;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeUsuarios(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function getUsuariosServerSnapshot(): Usuario[] {
  return SERVER_EMPTY;
}

export function addUsuario(u: Omit<Usuario, "id" | "avatar" | "cadastradoEm" | "ativo">): Usuario {
  const lista = getUsuarios();
  const iniciais = u.nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const novo: Usuario = {
    ...u,
    id: lista.length > 0 ? Math.max(...lista.map((x) => x.id)) + 1 : 1,
    avatar: iniciais || "U",
    cadastradoEm: new Date().toISOString().slice(0, 10),
    ativo: true,
  };
  lista.push(novo);
  salvarUsuarios(lista);
  return novo;
}

export function removeUsuario(id: number): void {
  const lista = getUsuarios().filter((u) => u.id !== id);
  salvarUsuarios(lista);
}

export function toggleUsuarioAtivo(id: number): void {
  const lista = getUsuarios().map((u) =>
    u.id === id ? { ...u, ativo: !u.ativo } : u
  );
  salvarUsuarios(lista);
}

export const USUARIOS_EVENT = EVENT;
