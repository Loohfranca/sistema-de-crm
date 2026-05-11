// ─── Módulo Financeiro — isolado do core do sistema ──────────────────────────
// Nenhum módulo principal (agenda, dashboard, atendimentos) deve importar deste arquivo.
// Apenas componentes dentro de src/components/financeiro/ e src/app/financeiro/ devem usá-lo.

import type { Agendamento } from "./store";
import { addLog } from "./logs";

// ─── Types ───────────────────────────────────────────────────────────────────
export type PaymentMethod = "dinheiro" | "debito" | "credito" | "pix" | null;

export interface Parcela {
  numero: number;
  valor: number;
  vencimento: string; // dd/mm/yyyy
  pago: boolean;
}

export interface Pagamento {
  metodo: PaymentMethod;
  total: number;            // valor bruto cobrado
  taxa?: number;            // percentual da taxa (ex: 3.99)
  taxaValor?: number;       // valor da taxa em R$
  liquido?: number;         // valor líquido recebido
  parcelas?: Parcela[];     // apenas se método = "credito"
  numeroParcelas?: number;
  dataPagamento?: string;   // dd/mm/yyyy (pagamento à vista)
}

export interface ParcelaMes {
  mes: string;
  valor: number;
}

// ─── Lançamentos financeiros ─────────────────────────────────────────────────
import type { Lancamento } from "@/types/financeiro";
export type { Lancamento };

const LANCAMENTOS_KEY = "crm_lancamentos_v2";

export function getLancamentos(): Lancamento[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LANCAMENTOS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Lancamento[];
  } catch {
    return [];
  }
}

export function salvarLancamentos(dados: Lancamento[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANCAMENTOS_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event("crm_lancamentos_updated"));
}

export function adicionarLancamento(lancamento: Omit<Lancamento, "id">): Lancamento[] {
  const lista = getLancamentos();
  const novo: Lancamento = { ...lancamento, id: `l${Date.now()}` };
  const atualizada = [novo, ...lista];
  salvarLancamentos(atualizada);
  addLog({
    usuario: "Administrador",
    acao: "Criou",
    entidade: "financeiro",
    descricao: `Lançou ${novo.tipo === "entrada" ? "entrada" : "saída"}: ${novo.descricao} (${formatBRL(novo.valor)})`,
  });
  return atualizada;
}

export function editarLancamento(lancamento: Lancamento): Lancamento[] {
  const lista = getLancamentos();
  const atualizada = lista.map((l) => (l.id === lancamento.id ? lancamento : l));
  salvarLancamentos(atualizada);
  addLog({
    usuario: "Administrador",
    acao: "Editou",
    entidade: "financeiro",
    descricao: `Editou lançamento: ${lancamento.descricao}`,
  });
  return atualizada;
}

export function removerLancamento(id: string): Lancamento[] {
  const lista = getLancamentos();
  const alvo = lista.find((l) => l.id === id);
  const atualizada = lista.filter((l) => l.id !== id);
  salvarLancamentos(atualizada);
  if (alvo) {
    addLog({
      usuario: "Administrador",
      acao: "Excluiu",
      entidade: "financeiro",
      descricao: `Removeu lançamento: ${alvo.descricao}`,
    });
  }
  return atualizada;
}

// ─── Taxas PagSeguro (aproximadas) ───────────────────────────────────────────
export const TAXAS_METODO: Record<string, number> = {
  dinheiro: 0,
  pix:      0.99,
  debito:   1.99,
};

export const TAXA_CREDITO_PARCELAS: Record<number, number> = {
  1: 3.99,  2: 4.49,  3: 4.99,
  4: 5.49,  5: 5.49,  6: 5.49,
  7: 6.49,  8: 6.49,  9: 6.49,
  10: 6.49, 11: 6.49, 12: 6.49,
};

// ─── Formatação ─────────────────────────────────────────────────────────────
export function isoParaBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Cálculos ────────────────────────────────────────────────────────────────
export function calcTaxa(valor: number, taxaPct: number): number {
  return Math.round(valor * (taxaPct / 100) * 100) / 100;
}

export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatVenc(isoBase: string, mesesAFrente: number): string {
  const d = new Date(isoBase + "T12:00:00");
  d.setMonth(d.getMonth() + mesesAFrente);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ─── Operações de pagamento ──────────────────────────────────────────────────
export function registrarPagamento(
  id: number,
  pagamento: Pagamento,
  getAgendamentos: () => Agendamento[],
  salvarAgendamentos: (dados: Agendamento[]) => void,
): Agendamento[] {
  const lista = getAgendamentos();
  const nova = lista.map((a) =>
    a.id === id
      ? { ...a, status: "recebido" as unknown as Agendamento["status"], pagamento: pagamento as unknown as Agendamento["pagamento"] }
      : a
  );
  salvarAgendamentos(nova);
  return nova;
}

// ─── Cast helper — o core armazena pagamento como Record opaco ───────────────
function asPagamento(raw: Record<string, unknown> | null): Pagamento | null {
  return raw as Pagamento | null;
}

// ─── Helpers de cálculo financeiro ───────────────────────────────────────────
export function calcularRecebido(lista: Agendamento[]): number {
  return lista.reduce((acc, a) => {
    const pag = asPagamento(a.pagamento);
    if (!pag) return acc;
    if (pag.metodo === "credito" && pag.parcelas) {
      const pagas = pag.parcelas.filter((p) => p.pago).length;
      const total = pag.parcelas.length;
      const liq = pag.liquido ?? pag.total;
      return acc + (pagas / total) * liq;
    }
    return acc + (pag.liquido ?? pag.total);
  }, 0);
}

export function calcularAReceber(lista: Agendamento[]): number {
  return lista.reduce((acc, a) => {
    const pag = asPagamento(a.pagamento);
    if (!pag || pag.metodo !== "credito") return acc;
    const pendentes = (pag.parcelas ?? []).filter((p) => !p.pago).length;
    const total = pag.parcelas?.length ?? 1;
    const liq = pag.liquido ?? pag.total;
    return acc + (pendentes / total) * liq;
  }, 0);
}

export function parcelasAReceberPorMes(lista: Agendamento[]): ParcelaMes[] {
  const map: Record<string, number> = {};
  const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  for (const a of lista) {
    const pag = asPagamento(a.pagamento);
    if (!pag || pag.metodo !== "credito") continue;
    for (const p of pag.parcelas ?? []) {
      if (p.pago) continue;
      const [, mm, yyyy] = p.vencimento.split("/");
      const label = `${MESES[parseInt(mm) - 1]}/${yyyy.slice(2)}`;
      map[label] = (map[label] ?? 0) + p.valor;
    }
  }

  return Object.entries(map)
    .sort(([a], [b]) => {
      const [ma, ya] = a.split("/");
      const [mb, yb] = b.split("/");
      return (parseInt(ya) * 12 + MESES.indexOf(ma)) -
             (parseInt(yb) * 12 + MESES.indexOf(mb));
    })
    .map(([mes, valor]) => ({ mes, valor }));
}
