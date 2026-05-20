// ─── Gestão — financeiro automático ──────────────────────────────────────────
// Receitas são lidas automaticamente das baixas dos atendimentos (recebimentos).
// Despesas são lançadas à mão. Lib isolada — não depende do módulo financeiro
// antigo (src/lib/financeiro.ts).

import type { Agendamento } from "./store";

const DESPESAS_KEY = "crm_despesas_v1";
export const GESTAO_EVENT = "crm_despesas_updated";

// ─── Despesas ────────────────────────────────────────────────────────────────
export type CategoriaDespesa =
  | "salario"
  | "aluguel"
  | "produtos"
  | "marketing"
  | "outro";

export interface Despesa {
  id: string;
  valor: number;
  categoria: CategoriaDespesa;
  descricao: string;
  data: string; // YYYY-MM-DD
}

export const CATEGORIAS: { id: CategoriaDespesa; label: string; cor: string }[] =
  [
    { id: "salario", label: "Salário", cor: "#b9657f" },
    { id: "aluguel", label: "Aluguel", cor: "#c89b3c" },
    { id: "produtos", label: "Produtos", cor: "#5a8a7d" },
    { id: "marketing", label: "Marketing", cor: "#8a6fb0" },
    { id: "outro", label: "Outro", cor: "#9a8478" },
  ];

export function categoriaInfo(id: CategoriaDespesa) {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[4];
}

export function getDespesas(): Despesa[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DESPESAS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Despesa[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function salvarDespesas(dados: Despesa[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DESPESAS_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event(GESTAO_EVENT));
}

export function adicionarDespesa(d: Omit<Despesa, "id">): Despesa[] {
  const lista = getDespesas();
  const nova: Despesa = { ...d, id: `d${Date.now()}` };
  const atualizada = [nova, ...lista];
  salvarDespesas(atualizada);
  return atualizada;
}

export function excluirDespesa(id: string): Despesa[] {
  const atualizada = getDespesas().filter((d) => d.id !== id);
  salvarDespesas(atualizada);
  return atualizada;
}

// ─── Receitas (derivadas das baixas dos atendimentos) ────────────────────────
export type FormaPagamento = "pix" | "dinheiro" | "cartao";

export interface Receita {
  valor: number;
  forma: FormaPagamento;
  data: string; // YYYY-MM-DD
  cliente: string;
  servico: string;
  agendamentoId: number;
}

export const FORMAS: { id: FormaPagamento; label: string; cor: string }[] = [
  { id: "pix", label: "Pix", cor: "#5a8a7d" },
  { id: "dinheiro", label: "Dinheiro", cor: "#c89b3c" },
  { id: "cartao", label: "Cartão", cor: "#b9657f" },
];

export function formaInfo(id: FormaPagamento) {
  return FORMAS.find((f) => f.id === id) ?? FORMAS[0];
}

// Lê todos os recebimentos lançados nas baixas dos atendimentos
export function coletarReceitas(agendamentos: Agendamento[]): Receita[] {
  const out: Receita[] = [];
  for (const a of agendamentos) {
    if (!a.pagamento) continue;
    const p = a.pagamento as Record<string, unknown>;
    if (!Array.isArray(p.recebimentos)) continue;
    for (const r of p.recebimentos as {
      valor: number;
      forma: FormaPagamento;
      data: string;
    }[]) {
      out.push({
        valor: Number(r.valor) || 0,
        forma: r.forma ?? "pix",
        data: r.data,
        cliente: a.cliente,
        servico: a.procedimento,
        agendamentoId: a.id,
      });
    }
  }
  return out;
}

// ─── Períodos ────────────────────────────────────────────────────────────────
export type Periodo = "mes" | "mes-passado" | "3meses" | "ano";

export const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "mes", label: "Este mês" },
  { id: "mes-passado", label: "Mês passado" },
  { id: "3meses", label: "Últimos 3 meses" },
  { id: "ano", label: "Este ano" },
];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Intervalo [inicio, fim] em ISO para o período escolhido
export function rangePeriodo(p: Periodo): { inicio: string; fim: string } {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  if (p === "mes") {
    return { inicio: iso(new Date(ano, mes, 1)), fim: iso(new Date(ano, mes + 1, 0)) };
  }
  if (p === "mes-passado") {
    return {
      inicio: iso(new Date(ano, mes - 1, 1)),
      fim: iso(new Date(ano, mes, 0)),
    };
  }
  if (p === "3meses") {
    return { inicio: iso(new Date(ano, mes - 2, 1)), fim: iso(new Date(ano, mes + 1, 0)) };
  }
  // ano
  return { inicio: iso(new Date(ano, 0, 1)), fim: iso(new Date(ano, 11, 31)) };
}

export function noPeriodo(dataISO: string, p: Periodo): boolean {
  const { inicio, fim } = rangePeriodo(p);
  return dataISO >= inicio && dataISO <= fim;
}

// Últimos N meses (para os gráficos) — mais antigo primeiro
export function mesesRecentes(
  n: number,
): { ano: number; mes: number; label: string }[] {
  const MESES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const hoje = new Date();
  const out: { ano: number; mes: number; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    out.push({ ano: d.getFullYear(), mes: d.getMonth(), label: MESES[d.getMonth()] });
  }
  return out;
}

export function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
