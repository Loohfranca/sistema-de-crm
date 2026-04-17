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

const STORAGE_KEY = "crm_clientes_v1";

const CLIENTES_PADRAO: Cliente[] = [
  { id: "1", name: "Isabella Cavalcanti", email: "isabella@email.com", phone: "(11) 99876-5432", tier: "diamond", birthDate: "1992-03-15", address: "Rua das Flores, 123 - São Paulo, SP", allergies: ["Látex", "Sulfonamidas"], preferences: ["Horários pela manhã", "Aromaterapia de lavanda"], lastVisit: "15/04/2026", procedures: 34, avatar: "IC", status: "active" },
  { id: "2", name: "Marina Silva", email: "marina.silva@email.com", phone: "(11) 98765-4321", tier: "gold", birthDate: "1990-07-22", address: "", allergies: [], preferences: [], lastVisit: "10/04/2026", procedures: 18, avatar: "MS", status: "active" },
  { id: "3", name: "Camila Rodrigues", email: "camila.r@email.com", phone: "(11) 97654-3210", tier: "diamond", birthDate: "1988-11-05", address: "", allergies: ["Dipirona"], preferences: ["Música ambiente suave"], lastVisit: "08/04/2026", procedures: 42, avatar: "CR", status: "active" },
  { id: "4", name: "Fernanda Costa", email: "fernanda.c@email.com", phone: "(11) 96543-2109", tier: "silver", birthDate: "1995-01-10", address: "", allergies: [], preferences: [], lastVisit: "01/04/2026", procedures: 8, avatar: "FC", status: "active" },
  { id: "5", name: "Ana Beatriz Oliveira", email: "ana.bea@email.com", phone: "(11) 95432-1098", tier: "gold", birthDate: "1993-04-18", address: "", allergies: [], preferences: ["Horários à tarde"], lastVisit: "28/03/2026", procedures: 15, avatar: "AB", status: "inactive" },
  { id: "6", name: "Juliana Almeida", email: "juliana.a@email.com", phone: "(11) 94321-0987", tier: "silver", birthDate: "1997-09-30", address: "", allergies: [], preferences: [], lastVisit: "20/03/2026", procedures: 4, avatar: "JA", status: "active" },
  { id: "7", name: "Patrícia Mendes", email: "patricia.m@email.com", phone: "(11) 93210-9876", tier: "gold", birthDate: "1991-06-12", address: "", allergies: [], preferences: [], lastVisit: "05/04/2026", procedures: 22, avatar: "PM", status: "active" },
  { id: "8", name: "Renata Lopes", email: "renata.l@email.com", phone: "(11) 92109-8765", tier: "diamond", birthDate: "1989-12-25", address: "", allergies: ["Ácido Salicílico"], preferences: ["Procedimentos suaves"], lastVisit: "09/04/2026", procedures: 56, avatar: "RL", status: "active" },
];

export function getClientes(): Cliente[] {
  if (typeof window === "undefined") return CLIENTES_PADRAO;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CLIENTES_PADRAO));
    return CLIENTES_PADRAO;
  }
  try {
    return JSON.parse(raw) as Cliente[];
  } catch {
    return CLIENTES_PADRAO;
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
  return atualizada;
}
