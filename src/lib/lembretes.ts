// ─── Lembretes automáticos — regras configuráveis de WhatsApp ────────────────
// Cada regra define QUANDO disparar (X horas/dias antes/depois do atendimento)
// e a MENSAGEM enviada. O envio é manual (1 clique no WhatsApp) — as regras
// determinam o que aparece como pendente no painel do dashboard.

const REGRAS_KEY = "crm_lembretes_regras_v1";

export const LEMBRETES_EVENT = "crm_lembretes_updated";

export type LembreteUnidade = "horas" | "dias";
export type LembreteQuando = "antes" | "depois";

export interface RegraLembrete {
  id: string;
  nome: string;
  ativo: boolean;
  quantidade: number;
  unidade: LembreteUnidade;
  quando: LembreteQuando;
  mensagem: string;
}

// ─── Mensagens padrão ────────────────────────────────────────────────────────
const MSG_DIA_ANTES = `Olá, {cliente}! 💖

Passando para lembrar do seu atendimento amanhã:

📅 {data} às {hora}
✨ {procedimento}

Qualquer coisa, é só me chamar por aqui!

— {clinica}`;

const MSG_HORAS_ANTES = `🔔 Olá, {cliente}!

Seu atendimento é daqui a pouco:

📅 Hoje às {hora}
✨ {procedimento}

Te esperamos! 💕

— {clinica}`;

// ─── Regras padrão (seed na primeira carga) ──────────────────────────────────
export const REGRAS_PADRAO: RegraLembrete[] = [
  {
    id: "seed-dia-antes",
    nome: "1 dia antes",
    ativo: true,
    quantidade: 1,
    unidade: "dias",
    quando: "antes",
    mensagem: MSG_DIA_ANTES,
  },
  {
    id: "seed-horas-antes",
    nome: "Lembrete final",
    ativo: true,
    quantidade: 2,
    unidade: "horas",
    quando: "antes",
    mensagem: MSG_HORAS_ANTES,
  },
];

// ─── Persistência ────────────────────────────────────────────────────────────
export function getRegras(): RegraLembrete[] {
  if (typeof window === "undefined") return REGRAS_PADRAO;
  const raw = localStorage.getItem(REGRAS_KEY);
  if (!raw) return REGRAS_PADRAO;
  try {
    const parsed = JSON.parse(raw) as RegraLembrete[];
    return Array.isArray(parsed) ? parsed : REGRAS_PADRAO;
  } catch {
    return REGRAS_PADRAO;
  }
}

export function salvarRegras(regras: RegraLembrete[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGRAS_KEY, JSON.stringify(regras));
  window.dispatchEvent(new Event(LEMBRETES_EVENT));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Offset em minutos entre o horário do atendimento e o momento de enviar.
// Positivo = enviar ANTES do atendimento; negativo = enviar DEPOIS.
export function offsetMinutos(regra: RegraLembrete): number {
  const base =
    regra.unidade === "dias" ? regra.quantidade * 1440 : regra.quantidade * 60;
  return regra.quando === "antes" ? base : -base;
}

export function descricaoQuando(regra: RegraLembrete): string {
  const plural = regra.quantidade !== 1;
  const u =
    regra.unidade === "dias"
      ? plural
        ? "dias"
        : "dia"
      : plural
        ? "horas"
        : "hora";
  return `${regra.quantidade} ${u} ${regra.quando}`;
}

export function novaRegra(): RegraLembrete {
  return {
    id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: "Novo lembrete",
    ativo: true,
    quantidade: 1,
    unidade: "horas",
    quando: "antes",
    mensagem: MSG_HORAS_ANTES,
  };
}
