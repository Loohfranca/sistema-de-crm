// ─── Sistema de Logs de Atividade ─────────────────────────────────────────────

export type LogAcao = "Criou" | "Editou" | "Excluiu" | "Desativou" | "Ativou";
export type LogEntidade =
  | "agendamento"
  | "atendimento"
  | "cliente"
  | "profissional"
  | "servico"
  | "categoria"
  | "usuario"
  | "configuracao"
  | "estoque"
  | "financeiro";

export interface LogEntry {
  id: number;
  dataHora: string; // ISO string
  usuario: string;
  acao: LogAcao;
  entidade: LogEntidade;
  descricao: string;
}

const STORAGE_KEY = "crm_logs_v1";
const EVENT = "crm_logs_updated";

const MAX_LOGS = 500;

let cache: LogEntry[] | null = null;
const SERVER_EMPTY: LogEntry[] = [];

function readStorage(): LogEntry[] {
  if (typeof window === "undefined") return SERVER_EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

export function getLogs(): LogEntry[] {
  if (typeof window === "undefined") return SERVER_EMPTY;
  if (cache === null) cache = readStorage();
  return cache;
}

export function addLog(entry: Omit<LogEntry, "id" | "dataHora">): void {
  if (typeof window === "undefined") return;
  const logs = [...getLogs()];
  const newLog: LogEntry = {
    ...entry,
    id: logs.length > 0 ? Math.max(...logs.map((l) => l.id)) + 1 : 1,
    dataHora: new Date().toISOString(),
  };
  logs.unshift(newLog);
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  cache = logs;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeLogs(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function getLogsServerSnapshot(): LogEntry[] {
  return SERVER_EMPTY;
}

export function clearLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export const LOGS_EVENT = EVENT;
