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
export const colorMap = {
  rose: { bg: "bg-primary-container/80", border: "border-l-primary", text: "text-on-primary-container", dot: "bg-primary", strip: "bg-primary-container border-l-primary" },
  gold: { bg: "bg-secondary-container/80", border: "border-l-secondary", text: "text-on-secondary-container", dot: "bg-secondary", strip: "bg-secondary-container border-l-secondary" },
  teal: { bg: "bg-tertiary-container/80", border: "border-l-tertiary", text: "text-on-tertiary-container", dot: "bg-tertiary", strip: "bg-tertiary-container border-l-tertiary" },
};

export const statusConfig: Record<StatusApt, { label: string; icon: React.ElementType; cls: string }> = {
  agendado: { label: "Agendado", icon: CalendarDays, cls: "bg-primary-fixed text-on-primary-container" },
  realizado: { label: "Realizado", icon: Check, cls: "bg-secondary-fixed text-on-secondary-container" },
  cancelado: { label: "Cancelado", icon: AlertCircle, cls: "bg-error-container text-on-error-container" },
};
