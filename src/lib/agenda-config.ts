import { CalendarDays, Check, AlertCircle } from "lucide-react";
import type { Agendamento, StatusApt } from "./store";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getWeekDates(base: Date): Date[] {
  const day = base.getDay();
  const mon = new Date(base);
  mon.setDate(base.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d;
  });
}
export function fmtISO(d: Date) { return d.toISOString().slice(0, 10); }

export function timeStr(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
export function endTime(apt: Agendamento) {
  const totalMin = apt.minutoInicio + apt.duracao;
  return timeStr(apt.horaInicio + Math.floor(totalMin / 60), totalMin % 60);
}

export const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const DAY_NAMES_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
export const CELL_H = 64;

// ─── Color / Status configs ───────────────────────────────────────────────────
// Cores dos eventos são INDEPENDENTES do tema — mantêm variedade visual
// (rose / amarelo / azul) em qualquer paleta global.
export const colorMap = {
  rose: {
    bg: "bg-rose-100/80 dark:bg-rose-950/40",
    border: "border-l-rose-400 dark:border-l-rose-500",
    text: "text-rose-900 dark:text-rose-200",
    dot: "bg-rose-500",
    strip: "bg-rose-100 dark:bg-rose-950/40 border-l-rose-400",
  },
  gold: {
    bg: "bg-amber-100/80 dark:bg-amber-950/40",
    border: "border-l-amber-500 dark:border-l-amber-500",
    text: "text-amber-900 dark:text-amber-200",
    dot: "bg-amber-500",
    strip: "bg-amber-100 dark:bg-amber-950/40 border-l-amber-500",
  },
  teal: {
    bg: "bg-sky-100/80 dark:bg-sky-950/40",
    border: "border-l-sky-400 dark:border-l-sky-500",
    text: "text-sky-900 dark:text-sky-200",
    dot: "bg-sky-500",
    strip: "bg-sky-100 dark:bg-sky-950/40 border-l-sky-400",
  },
};

export const statusConfig: Record<StatusApt, { label: string; icon: React.ElementType; cls: string }> = {
  agendado: { label: "Agendado", icon: CalendarDays, cls: "bg-primary-fixed text-on-primary-container" },
  realizado: { label: "Realizado", icon: Check, cls: "bg-secondary-fixed text-on-secondary-container" },
  cancelado: { label: "Cancelado", icon: AlertCircle, cls: "bg-error-container text-on-error-container" },
};
