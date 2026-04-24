// ─── Exportação para contador ────────────────────────────────────────────────
// CSV (para Excel/sistema contábil) + helpers de resumo financeiro mensal.

import type { Lancamento } from "@/types/financeiro";

const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
};

function csvEscape(val: string | number | undefined | null): string {
  const s = String(val ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isoToBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function brl(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function filtrarPorMes(lancamentos: Lancamento[], mes: number, ano: number): Lancamento[] {
  const prefixo = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  return lancamentos
    .filter((l) => l.data.startsWith(prefixo))
    .sort((a, b) => a.data.localeCompare(b.data));
}

// ─── CSV ────────────────────────────────────────────────────────────────────
export function gerarCSV(lancamentos: Lancamento[]): string {
  const header = [
    "Data",
    "Tipo",
    "Descrição",
    "Categoria",
    "Forma de Pagamento",
    "Parcelas",
    "Valor Bruto (R$)",
    "Taxa (%)",
    "Taxa (R$)",
    "Valor Líquido (R$)",
    "Observação",
  ];

  const linhas = lancamentos.map((l) => {
    const bruto = l.valor;
    const taxaPct = l.dadosCartao?.taxaPercentual ?? 0;
    const liquido = l.dadosCartao?.valorLiquidoPrevisto ?? l.valor;
    const taxaValor = Math.max(0, bruto - liquido);

    return [
      isoToBR(l.data),
      l.tipo === "entrada" ? "Entrada" : "Saída",
      l.descricao,
      l.categoria ?? "",
      l.formaPagamento ? FORMA_LABEL[l.formaPagamento] : "",
      l.dadosCartao?.parcelas ? `${l.dadosCartao.parcelas}x` : "",
      brl(bruto),
      taxaPct ? brl(taxaPct) : "",
      taxaValor > 0 ? brl(taxaValor) : "",
      brl(liquido),
      l.observacao ?? "",
    ]
      .map(csvEscape)
      .join(";");
  });

  // BOM UTF-8 + separador ";" (Excel pt-BR abre direto, acentos preservados)
  return "﻿" + [header.join(";"), ...linhas].join("\r\n");
}

// ─── Download helper ────────────────────────────────────────────────────────
export function baixarArquivo(conteudo: string, nome: string, mime: string): void {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Resumo para relatório ──────────────────────────────────────────────────
export interface EntradaPorMetodo {
  metodo: string;
  bruto: number;
  taxa: number;
  liquido: number;
  quantidade: number;
}

export interface SaidaPorCategoria {
  categoria: string;
  valor: number;
  quantidade: number;
}

export interface ResumoContador {
  totalBruto: number;
  totalEntradas: number; // líquido
  totalSaidas: number;
  totalTaxas: number;
  saldo: number; // líquido - saídas
  quantidadeEntradas: number;
  quantidadeSaidas: number;
  entradasPorMetodo: EntradaPorMetodo[];
  saidasPorCategoria: SaidaPorCategoria[];
}

export function calcularResumo(lancamentos: Lancamento[]): ResumoContador {
  const entradas = lancamentos.filter((l) => l.tipo === "entrada");
  const saidas = lancamentos.filter((l) => l.tipo === "saida");

  const totalBruto = entradas.reduce((acc, l) => acc + l.valor, 0);
  const totalEntradas = entradas.reduce(
    (acc, l) => acc + (l.dadosCartao?.valorLiquidoPrevisto ?? l.valor),
    0,
  );
  const totalSaidas = saidas.reduce((acc, l) => acc + l.valor, 0);
  const totalTaxas = totalBruto - totalEntradas;

  const metodoMap: Record<string, EntradaPorMetodo> = {};
  for (const l of entradas) {
    const metodo = l.formaPagamento ? FORMA_LABEL[l.formaPagamento] : "Não informado";
    if (!metodoMap[metodo]) {
      metodoMap[metodo] = { metodo, bruto: 0, taxa: 0, liquido: 0, quantidade: 0 };
    }
    const liquido = l.dadosCartao?.valorLiquidoPrevisto ?? l.valor;
    metodoMap[metodo].bruto += l.valor;
    metodoMap[metodo].liquido += liquido;
    metodoMap[metodo].taxa += Math.max(0, l.valor - liquido);
    metodoMap[metodo].quantidade += 1;
  }

  const catMap: Record<string, SaidaPorCategoria> = {};
  for (const l of saidas) {
    const categoria = l.categoria ?? "Outros";
    if (!catMap[categoria]) {
      catMap[categoria] = { categoria, valor: 0, quantidade: 0 };
    }
    catMap[categoria].valor += l.valor;
    catMap[categoria].quantidade += 1;
  }

  return {
    totalBruto,
    totalEntradas,
    totalSaidas,
    totalTaxas,
    saldo: totalEntradas - totalSaidas,
    quantidadeEntradas: entradas.length,
    quantidadeSaidas: saidas.length,
    entradasPorMetodo: Object.values(metodoMap).sort((a, b) => b.liquido - a.liquido),
    saidasPorCategoria: Object.values(catMap).sort((a, b) => b.valor - a.valor),
  };
}

export const MESES_LONGOS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function nomeArquivoCSV(mes: number, ano: number): string {
  const mm = String(mes + 1).padStart(2, "0");
  return `financeiro-${ano}-${mm}.csv`;
}

export { isoToBR, FORMA_LABEL };
