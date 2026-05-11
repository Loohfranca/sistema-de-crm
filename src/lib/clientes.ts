import { addLog } from "./logs";

export interface Cliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  birthDate: string;
  address: string;
  allergies: string[];
  preferences: string[];
  lastVisit: string;
  procedures: number;
  avatar: string;
  status: string;
}

const STORAGE_KEY = "crm_clientes_v2";

export function getClientes(): Cliente[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Cliente[];
  } catch {
    return [];
  }
}

export function salvarClientes(dados: Cliente[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event("crm_clientes_updated"));
}

export function adicionarCliente(cliente: Omit<Cliente, "id">): Cliente[] {
  const lista = getClientes();
  const novo: Cliente = { ...cliente, id: `c${Date.now()}` };
  const atualizada = [novo, ...lista];
  salvarClientes(atualizada);
  addLog({
    usuario: "Administrador",
    acao: "Criou",
    entidade: "cliente",
    descricao: `Criou a cliente ${novo.name}`,
  });
  return atualizada;
}

export function atualizarCliente(id: string, patch: Partial<Omit<Cliente, "id">>): Cliente[] {
  const lista = getClientes();
  const alvo = lista.find((c) => c.id === id);
  const atualizada = lista.map((c) => (c.id === id ? { ...c, ...patch } : c));
  salvarClientes(atualizada);
  if (alvo) {
    addLog({
      usuario: "Administrador",
      acao: "Editou",
      entidade: "cliente",
      descricao: `Editou ficha de ${alvo.name}`,
    });
  }
  return atualizada;
}

export function excluirCliente(id: string): Cliente[] {
  const lista = getClientes();
  const alvo = lista.find((c) => c.id === id);
  const atualizada = lista.filter((c) => c.id !== id);
  salvarClientes(atualizada);
  if (alvo) {
    addLog({
      usuario: "Administrador",
      acao: "Excluiu",
      entidade: "cliente",
      descricao: `Excluiu a cliente ${alvo.name}`,
    });
  }
  return atualizada;
}

export function getClientePorId(id: string): Cliente | undefined {
  return getClientes().find((c) => c.id === id);
}

export function getClientePorNome(nome: string): Cliente | undefined {
  const alvo = nome.trim().toLowerCase();
  return getClientes().find((c) => c.name.trim().toLowerCase() === alvo);
}
