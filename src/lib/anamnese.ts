// ─── Anamnese — ficha de avaliação por cliente ───────────────────────────────
// Questionário de saúde/estética preenchido na ficha do cliente.
// Um registro por cliente, persistido em localStorage.

const STORAGE_KEY = "crm_anamneses_v1";

export const ANAMNESE_EVENT = "crm_anamnese_updated";

export type SimNao = "" | "sim" | "nao";
export type TipoPele = "" | "oleosa" | "seca" | "mista" | "normal" | "sensivel";

export interface Anamnese {
  gestante: SimNao;
  condicoes: string[];
  alergias: string;
  medicamentos: string;
  cirurgiasRecentes: string;
  fumante: SimNao;
  tipoPele: TipoPele;
  procedimentosAnteriores: string;
  usaFiltroSolar: SimNao;
  queixaPrincipal: string;
  observacoes: string;
  atualizadoEm: string; // ISO timestamp
}

// Condições de saúde relevantes para procedimentos estéticos
export const CONDICOES_SAUDE = [
  "Hipertensão",
  "Diabetes",
  "Problemas cardíacos",
  "Epilepsia",
  "Hipotireoidismo",
  "Tratamento oncológico",
  "Marca-passo",
  "Queloide / cicatrização ruim",
];

export const TIPOS_PELE: { value: TipoPele; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "oleosa", label: "Oleosa" },
  { value: "seca", label: "Seca" },
  { value: "mista", label: "Mista" },
  { value: "sensivel", label: "Sensível" },
];

export function anamneseVazia(): Anamnese {
  return {
    gestante: "",
    condicoes: [],
    alergias: "",
    medicamentos: "",
    cirurgiasRecentes: "",
    fumante: "",
    tipoPele: "",
    procedimentosAnteriores: "",
    usaFiltroSolar: "",
    queixaPrincipal: "",
    observacoes: "",
    atualizadoEm: "",
  };
}

function lerTodas(): Record<string, Anamnese> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, Anamnese>;
  } catch {
    return {};
  }
}

export function getAnamnese(clienteId: string): Anamnese | null {
  return lerTodas()[clienteId] ?? null;
}

export function getTodasAnamneses(): Record<string, Anamnese> {
  return lerTodas();
}

export function salvarAnamnese(clienteId: string, anamnese: Anamnese): void {
  if (typeof window === "undefined") return;
  const todas = lerTodas();
  todas[clienteId] = { ...anamnese, atualizadoEm: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
  window.dispatchEvent(new Event(ANAMNESE_EVENT));
}

export function excluirAnamnese(clienteId: string): void {
  if (typeof window === "undefined") return;
  const todas = lerTodas();
  delete todas[clienteId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
  window.dispatchEvent(new Event(ANAMNESE_EVENT));
}

// Sinaliza pontos de atenção para destacar na ficha (gestante, condições, fumante)
export function temAlertas(a: Anamnese): boolean {
  return a.gestante === "sim" || a.fumante === "sim" || a.condicoes.length > 0;
}
