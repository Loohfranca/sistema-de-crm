// ─── Shared Store — fonte única de verdade para Agenda + Atendimentos ─────────
// Tipos financeiros (Pagamento, Parcela, taxas) foram movidos para src/lib/financeiro.ts

import { consumirMateriais } from "./estoque";
import { addLog } from "./logs";

export type StatusApt = "agendado" | "realizado" | "cancelado";

export interface Agendamento {
  id: number;
  cliente: string;
  avatar: string;
  procedimento: string;
  data: string;         // "YYYY-MM-DD" — padrão ISO para a Agenda
  horaInicio: number;   // ex: 9
  minutoInicio: number; // ex: 30
  duracao: number;      // minutos
  profissional: string;
  valor: number;        // número em R$
  telefone?: string;
  observacoes?: string;
  retorno?: string;   // "YYYY-MM-DD" — data prevista para retorno
  cor: "rose" | "gold" | "teal";
  status: StatusApt;
  // pagamento é gerenciado pelo módulo financeiro — o core só persiste o dado
  pagamento: Record<string, unknown> | null;
}

// ─── Persistência ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "crm_agenda_v6";

export function getAgendamentos(): Agendamento[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Agendamento[];
  } catch {
    return [];
  }
}

export function salvarAgendamentos(dados: Agendamento[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event("crm_agenda_updated"));
}

export function atualizarAgendamento(id: number, patch: Partial<Omit<Agendamento, "id">>): Agendamento[] {
  const lista = getAgendamentos();
  const alvo = lista.find((a) => a.id === id);
  const atualizada = lista.map((a) => (a.id === id ? { ...a, ...patch } : a));
  salvarAgendamentos(atualizada);
  if (alvo) {
    addLog({
      usuario: "Administrador",
      acao: "Editou",
      entidade: "agendamento",
      descricao: `Editou agendamento de ${alvo.cliente} (${alvo.procedimento})`,
    });
  }
  return atualizada;
}

export function removerAgendamento(id: number): Agendamento[] {
  const lista = getAgendamentos();
  const alvo = lista.find((a) => a.id === id);
  const atualizada = lista.filter((a) => a.id !== id);
  salvarAgendamentos(atualizada);
  if (alvo) {
    addLog({
      usuario: "Administrador",
      acao: "Excluiu",
      entidade: "agendamento",
      descricao: `Removeu agendamento de ${alvo.cliente} (${alvo.procedimento})`,
    });
  }
  return atualizada;
}

export function atualizarStatus(id: number, status: StatusApt, retorno?: string): Agendamento[] {
  const lista = getAgendamentos();
  const anterior = lista.find((a) => a.id === id);
  const nova = lista.map((a) =>
    a.id === id ? { ...a, status, ...(retorno ? { retorno } : {}) } : a
  );
  salvarAgendamentos(nova);

  // Consumo de estoque ao transitar para "realizado"
  if (anterior && anterior.status !== "realizado" && status === "realizado") {
    consumirMateriais(anterior.procedimento);
  }

  if (anterior && anterior.status !== status) {
    const mapAcao = {
      realizado: { acao: "Editou" as const, verbo: "concluiu" },
      cancelado: { acao: "Editou" as const, verbo: "cancelou" },
      agendado: { acao: "Editou" as const, verbo: "reabriu" },
    };
    const m = mapAcao[status];
    addLog({
      usuario: "Administrador",
      acao: m.acao,
      entidade: status === "realizado" ? "atendimento" : "agendamento",
      descricao: `${m.verbo[0].toUpperCase() + m.verbo.slice(1)} atendimento de ${anterior.cliente}`,
    });
  }

  return nova;
}

// ─── Helpers genéricos ───────────────────────────────────────────────────────

export function isoParaBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
