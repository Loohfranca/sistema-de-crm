// ─── Shared Store — fonte única de verdade para Agenda + Atendimentos ─────────
// Tipos financeiros (Pagamento, Parcela, taxas) foram movidos para src/lib/financeiro.ts

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

// ─── Dados iniciais ──────────────────────────────────────────────────────────
function buildDadosIniciais(): Agendamento[] {
  const hoje = new Date();
  function isoDate(offset: number) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  return [
    {
      id: 1,
      cliente: "Marina Silva",
      avatar: "MS",
      procedimento: "Limpeza de Pele Profissional",
      data: isoDate(-3),
      horaInicio: 9, minutoInicio: 30, duracao: 60,
      profissional: "Dra. Helena",
      valor: 350,
      telefone: "(11) 98765-4321",
      observacoes: "Pele sensível — usar produtos hipoalergênicos.",
      retorno: isoDate(25),
      cor: "gold",
      status: "realizado",
      pagamento: null,
    },
    {
      id: 2,
      cliente: "Camila Rodrigues",
      avatar: "CR",
      procedimento: "Aplicação de Botox — Testa e Glabela",
      data: isoDate(-3),
      horaInicio: 10, minutoInicio: 0, duracao: 45,
      profissional: "Dra. Helena",
      valor: 1500,
      telefone: "(11) 91234-5678",
      cor: "rose",
      status: "realizado",
      pagamento: null,
    },
    {
      id: 3,
      cliente: "Fernanda Costa",
      avatar: "FC",
      procedimento: "Preenchimento Labial com Ácido Hialurônico",
      data: isoDate(0),
      horaInicio: 11, minutoInicio: 0, duracao: 30,
      profissional: "Dra. Helena",
      valor: 1200,
      telefone: "(21) 99876-5432",
      cor: "teal",
      status: "agendado",
      pagamento: null,
    },
    {
      id: 4,
      cliente: "Ana Beatriz",
      avatar: "AB",
      procedimento: "Peeling Químico — Ácido Mandélico",
      data: isoDate(1),
      horaInicio: 14, minutoInicio: 0, duracao: 40,
      profissional: "Dra. Helena",
      valor: 450,
      telefone: "(21) 98765-1234",
      cor: "rose",
      status: "agendado",
      pagamento: null,
    },
  ];
}

// ─── Persistência ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "crm_agenda_v5";

export function getAgendamentos(): Agendamento[] {
  if (typeof window === "undefined") return buildDadosIniciais();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const dados = buildDadosIniciais();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    return dados;
  }
  try {
    return JSON.parse(raw) as Agendamento[];
  } catch {
    return buildDadosIniciais();
  }
}

export function salvarAgendamentos(dados: Agendamento[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event("crm_agenda_updated"));
}

export function atualizarStatus(id: number, status: StatusApt, retorno?: string): Agendamento[] {
  const lista = getAgendamentos();
  const nova = lista.map((a) =>
    a.id === id ? { ...a, status, ...(retorno ? { retorno } : {}) } : a
  );
  salvarAgendamentos(nova);
  return nova;
}

// ─── Helpers genéricos ───────────────────────────────────────────────────────

export function isoParaBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
