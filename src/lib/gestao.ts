// ─── Gestão — financeiro automático ──────────────────────────────────────────
// Receitas são lidas automaticamente das baixas dos atendimentos (recebimentos).
// Despesas são lançadas à mão. Categorias de despesa e formas de pagamento são
// editáveis pela usuária (aba Registros). Lib isolada — não depende do módulo
// financeiro antigo (src/lib/financeiro.ts).

import type { Agendamento } from "./store";

const DESPESAS_KEY = "crm_despesas_v1";
const CATEGORIAS_KEY = "crm_categorias_despesa_v1";
const FORMAS_KEY = "crm_formas_pagamento_v1";
export const GESTAO_EVENT = "crm_gestao_updated";

// ─── Item editável (categoria ou forma de pagamento) ─────────────────────────
export interface ItemRegistro {
  id: string;
  label: string;
  cor: string;
}

// Paleta de cores disponível para os itens dos Registros
export const PALETA_CORES = [
  "#b9657f", "#c89b3c", "#5a8a7d", "#8a6fb0", "#c17e6a",
  "#6a9b8f", "#9a8478", "#cf8aa6", "#d4a857", "#7d9bc1",
];

const CATEGORIAS_SEED: ItemRegistro[] = [
  { id: "salario", label: "Salário", cor: "#b9657f" },
  { id: "comissao", label: "Comissão", cor: "#cf8aa6" },
  { id: "aluguel", label: "Aluguel", cor: "#c89b3c" },
  { id: "contas-fixas", label: "Contas Fixas", cor: "#d4a857" },
  { id: "produtos", label: "Produtos", cor: "#5a8a7d" },
  { id: "sistema", label: "Sistema", cor: "#6a9b8f" },
  { id: "prestadores", label: "Prestadores de Serviço", cor: "#8a6fb0" },
  { id: "marketing", label: "Marketing", cor: "#7d9bc1" },
  { id: "outro", label: "Outros", cor: "#9a8478" },
];

const FORMAS_SEED: ItemRegistro[] = [
  { id: "pix", label: "Pix", cor: "#5a8a7d" },
  { id: "dinheiro", label: "Dinheiro", cor: "#c89b3c" },
  { id: "cartao", label: "Cartão", cor: "#b9657f" },
];

// ─── Persistência genérica de listas editáveis ───────────────────────────────
function lerLista(key: string, seed: ItemRegistro[]): ItemRegistro[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  if (raw === null) return seed;
  try {
    const parsed = JSON.parse(raw) as ItemRegistro[];
    return Array.isArray(parsed) ? parsed : seed;
  } catch {
    return seed;
  }
}

function salvarLista(key: string, lista: ItemRegistro[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(lista));
  window.dispatchEvent(new Event(GESTAO_EVENT));
}

function novoId(label: string): string {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}-${Date.now().toString(36)}`;
}

// ─── Categorias de despesa ───────────────────────────────────────────────────
export function getCategorias(): ItemRegistro[] {
  return lerLista(CATEGORIAS_KEY, CATEGORIAS_SEED);
}

export function adicionarCategoria(label: string, cor: string): ItemRegistro[] {
  const lista = [...getCategorias(), { id: novoId(label), label, cor }];
  salvarLista(CATEGORIAS_KEY, lista);
  return lista;
}

export function editarCategoria(
  id: string,
  label: string,
  cor: string,
): ItemRegistro[] {
  const lista = getCategorias().map((c) =>
    c.id === id ? { ...c, label, cor } : c,
  );
  salvarLista(CATEGORIAS_KEY, lista);
  return lista;
}

export function removerCategoria(id: string): ItemRegistro[] {
  const lista = getCategorias().filter((c) => c.id !== id);
  salvarLista(CATEGORIAS_KEY, lista);
  return lista;
}

export function categoriaInfo(id: string): ItemRegistro {
  return (
    getCategorias().find((c) => c.id === id) ?? {
      id,
      label: "Categoria removida",
      cor: "#9a8478",
    }
  );
}

// ─── Formas de pagamento ─────────────────────────────────────────────────────
export function getFormas(): ItemRegistro[] {
  return lerLista(FORMAS_KEY, FORMAS_SEED);
}

export function adicionarForma(label: string, cor: string): ItemRegistro[] {
  const lista = [...getFormas(), { id: novoId(label), label, cor }];
  salvarLista(FORMAS_KEY, lista);
  return lista;
}

export function editarForma(
  id: string,
  label: string,
  cor: string,
): ItemRegistro[] {
  const lista = getFormas().map((f) => (f.id === id ? { ...f, label, cor } : f));
  salvarLista(FORMAS_KEY, lista);
  return lista;
}

export function removerForma(id: string): ItemRegistro[] {
  const lista = getFormas().filter((f) => f.id !== id);
  salvarLista(FORMAS_KEY, lista);
  return lista;
}

export function formaInfo(id: string): ItemRegistro {
  return (
    getFormas().find((f) => f.id === id) ?? {
      id,
      label: "Forma removida",
      cor: "#9a8478",
    }
  );
}

// ─── Despesas ────────────────────────────────────────────────────────────────
export interface Despesa {
  id: string;
  valor: number;
  categoria: string; // id de ItemRegistro
  descricao: string;
  data: string; // YYYY-MM-DD
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
  const lista = [{ ...d, id: `d${Date.now()}` }, ...getDespesas()];
  salvarDespesas(lista);
  return lista;
}

export function excluirDespesa(id: string): Despesa[] {
  const lista = getDespesas().filter((d) => d.id !== id);
  salvarDespesas(lista);
  return lista;
}

// ─── Receitas (derivadas das baixas dos atendimentos) ────────────────────────
export interface Receita {
  valor: number;
  forma: string; // id de ItemRegistro
  data: string; // YYYY-MM-DD
  cliente: string;
  servico: string;
  agendamentoId: number;
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
      forma: string;
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

export function rangePeriodo(p: Periodo): { inicio: string; fim: string } {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  if (p === "mes") {
    return { inicio: iso(new Date(ano, mes, 1)), fim: iso(new Date(ano, mes + 1, 0)) };
  }
  if (p === "mes-passado") {
    return { inicio: iso(new Date(ano, mes - 1, 1)), fim: iso(new Date(ano, mes, 0)) };
  }
  if (p === "3meses") {
    return { inicio: iso(new Date(ano, mes - 2, 1)), fim: iso(new Date(ano, mes + 1, 0)) };
  }
  return { inicio: iso(new Date(ano, 0, 1)), fim: iso(new Date(ano, 11, 31)) };
}

export function noPeriodo(dataISO: string, p: Periodo): boolean {
  const { inicio, fim } = rangePeriodo(p);
  return dataISO >= inicio && dataISO <= fim;
}

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
