// ─── Template de confirmação por WhatsApp ────────────────────────────────────
// Template editável pela profissional. Variáveis marcadas com {chaves} são
// substituídas no momento do envio.

const TEMPLATE_KEY = "crm_whatsapp_template";
const EVENT = "crm_whatsapp_template_updated";

export const TEMPLATE_PADRAO = `Olá, {cliente}! 💖

Seu agendamento está confirmado:

📅 {data} às {hora}
✨ {procedimento}
⏱ {duracao} min

Qualquer coisa, é só me chamar por aqui. Até breve!

— {clinica}`;

export interface VariavelDisponivel {
  key: string;
  label: string;
  exemplo: string;
}

export const VARIAVEIS: VariavelDisponivel[] = [
  { key: "{cliente}", label: "Nome da cliente", exemplo: "Marina" },
  { key: "{data}", label: "Data", exemplo: "25/04/2026" },
  { key: "{hora}", label: "Horário", exemplo: "14:30" },
  { key: "{procedimento}", label: "Procedimento", exemplo: "Limpeza de Pele" },
  { key: "{duracao}", label: "Duração (min)", exemplo: "60" },
  { key: "{profissional}", label: "Profissional", exemplo: "Dra. Helena" },
  { key: "{clinica}", label: "Nome da clínica", exemplo: "Gabelia Beauty Studio" },
];

export function getTemplateConfirmacao(): string {
  if (typeof window === "undefined") return TEMPLATE_PADRAO;
  return localStorage.getItem(TEMPLATE_KEY) ?? TEMPLATE_PADRAO;
}

export function salvarTemplate(template: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATE_KEY, template);
  window.dispatchEvent(new Event(EVENT));
}

export function resetarTemplate(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TEMPLATE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export interface ContextoMensagem {
  cliente: string;
  dataISO: string;
  horaInicio: number;
  minutoInicio: number;
  procedimento: string;
  duracao: number;
  profissional: string;
}

function isoToBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getClinicaNome(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("crm_clinica");
    if (!raw) return "";
    const obj = JSON.parse(raw) as { nome?: string };
    return obj.nome ?? "";
  } catch {
    return "";
  }
}

export function renderMensagem(template: string, ctx: ContextoMensagem): string {
  const hora = `${String(ctx.horaInicio).padStart(2, "0")}:${String(ctx.minutoInicio).padStart(2, "0")}`;
  const substituicoes: Record<string, string> = {
    "{cliente}": ctx.cliente,
    "{data}": isoToBR(ctx.dataISO),
    "{hora}": hora,
    "{procedimento}": ctx.procedimento,
    "{duracao}": String(ctx.duracao),
    "{profissional}": ctx.profissional,
    "{clinica}": getClinicaNome(),
  };
  let out = template;
  for (const [chave, valor] of Object.entries(substituicoes)) {
    out = out.split(chave).join(valor);
  }
  return out;
}

export function renderExemplo(template: string): string {
  const exemplos: Record<string, string> = {
    "{cliente}": "Marina",
    "{data}": "25/04/2026",
    "{hora}": "14:30",
    "{procedimento}": "Limpeza de Pele",
    "{duracao}": "60",
    "{profissional}": "Dra. Helena",
    "{clinica}": getClinicaNome() || "Gabelia Beauty Studio",
  };
  let out = template;
  for (const [chave, valor] of Object.entries(exemplos)) {
    out = out.split(chave).join(valor);
  }
  return out;
}

// Normaliza telefone brasileiro pra formato do wa.me
// "(11) 98765-4321" → "5511987654321"
export function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length === 0) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function gerarLinkWhatsApp(telefone: string, mensagem: string): string {
  const tel = normalizarTelefone(telefone);
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`;
}
