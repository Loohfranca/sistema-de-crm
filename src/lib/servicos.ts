import type { Servico } from "@/types/servico";

const STORAGE_KEY = "crm_servicos_v1";

const SERVICOS_PADRAO: Servico[] = [
  { id: "s1", nome: "Limpeza de Pele Profissional", preco: 350, duracao: 60 },
  { id: "s2", nome: "Aplicação de Botox — Frontal e Glabela", preco: 1500, duracao: 45 },
  { id: "s3", nome: "Preenchimento Labial com Ácido Hialurônico", preco: 2200, duracao: 30 },
  { id: "s4", nome: "Peeling Químico — Ácido Mandélico", preco: 450, duracao: 40 },
];

export function getServicos(): Servico[] {
  if (typeof window === "undefined") return SERVICOS_PADRAO;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SERVICOS_PADRAO));
    return SERVICOS_PADRAO;
  }
  try {
    return JSON.parse(raw) as Servico[];
  } catch {
    return SERVICOS_PADRAO;
  }
}

export function salvarServicos(dados: Servico[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event("crm_servicos_updated"));
}

export function adicionarServico(servico: Omit<Servico, "id">): Servico[] {
  const lista = getServicos();
  const novo: Servico = { ...servico, id: `s${Date.now()}` };
  const atualizada = [...lista, novo];
  salvarServicos(atualizada);
  return atualizada;
}

export function editarServico(servico: Servico): Servico[] {
  const lista = getServicos();
  const atualizada = lista.map((s) => (s.id === servico.id ? servico : s));
  salvarServicos(atualizada);
  return atualizada;
}

export function removerServico(id: string): Servico[] {
  const lista = getServicos();
  const atualizada = lista.filter((s) => s.id !== id);
  salvarServicos(atualizada);
  return atualizada;
}
