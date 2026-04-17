// ─── Tabela de taxas por maquininha ──────────────────────────────────────────
// Configurável direto no código. Futuramente pode vir de um painel admin.

export type TaxaEntry = {
  modalidade: string;       // ex: "Débito", "Crédito 1x"
  percentual: number;       // ex: 1.99
};

export type Maquininha = {
  id: string;
  nome: string;
  taxas: TaxaEntry[];       // index 0 = débito, 1 = crédito 1x, 2 = crédito 2x, ...
};

// Taxas aproximadas — abril 2026
export const MAQUININHAS: Maquininha[] = [
  {
    id: "ton",
    nome: "Ton (Stone)",
    taxas: [
      { modalidade: "Débito",     percentual: 1.45 },
      { modalidade: "Crédito 1x", percentual: 3.15 },
      { modalidade: "Crédito 2x", percentual: 4.90 },
      { modalidade: "Crédito 3x", percentual: 5.90 },
      { modalidade: "Crédito 4x", percentual: 6.90 },
      { modalidade: "Crédito 5x", percentual: 7.90 },
      { modalidade: "Crédito 6x", percentual: 8.90 },
    ],
  },
  {
    id: "infinitepay",
    nome: "InfinitePay",
    taxas: [
      { modalidade: "Débito",     percentual: 1.37 },
      { modalidade: "Crédito 1x", percentual: 2.69 },
      { modalidade: "Crédito 2x", percentual: 4.45 },
      { modalidade: "Crédito 3x", percentual: 5.45 },
      { modalidade: "Crédito 4x", percentual: 6.45 },
      { modalidade: "Crédito 5x", percentual: 7.45 },
      { modalidade: "Crédito 6x", percentual: 8.45 },
    ],
  },
  {
    id: "mercadopago",
    nome: "Mercado Pago",
    taxas: [
      { modalidade: "Débito",     percentual: 1.99 },
      { modalidade: "Crédito 1x", percentual: 4.74 },
      { modalidade: "Crédito 2x", percentual: 5.89 },
      { modalidade: "Crédito 3x", percentual: 6.89 },
      { modalidade: "Crédito 4x", percentual: 7.89 },
      { modalidade: "Crédito 5x", percentual: 8.89 },
      { modalidade: "Crédito 6x", percentual: 9.89 },
    ],
  },
  {
    id: "pagbank",
    nome: "PagBank",
    taxas: [
      { modalidade: "Débito",     percentual: 1.69 },
      { modalidade: "Crédito 1x", percentual: 3.80 },
      { modalidade: "Crédito 2x", percentual: 5.19 },
      { modalidade: "Crédito 3x", percentual: 6.19 },
      { modalidade: "Crédito 4x", percentual: 7.19 },
      { modalidade: "Crédito 5x", percentual: 8.19 },
      { modalidade: "Crédito 6x", percentual: 9.19 },
    ],
  },
];

/**
 * Busca a taxa para uma maquininha + número de parcelas.
 * Parcelas = 0 significa débito.
 * Retorna o percentual ou null se não encontrar.
 */
export function getTaxa(maquininhaId: string, parcelas: number): number | null {
  const maq = MAQUININHAS.find((m) => m.id === maquininhaId);
  if (!maq) return null;

  if (parcelas === 0) {
    // débito
    return maq.taxas[0]?.percentual ?? null;
  }

  // crédito Nx — index 0 é débito, 1 é crédito 1x, etc.
  const entry = maq.taxas[parcelas];
  return entry?.percentual ?? null;
}

/**
 * Calcula valor líquido previsto dado valor bruto e taxa percentual.
 */
export function calcLiquido(valorBruto: number, taxaPercentual: number): number {
  return Math.round((valorBruto * (1 - taxaPercentual / 100)) * 100) / 100;
}
