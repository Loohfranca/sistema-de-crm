"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, CalendarDays, Calendar } from "lucide-react";
import Link from "next/link";
import {
  getAgendamentos, atualizarStatus,
  type Agendamento, type StatusApt,
} from "@/lib/store";
import {
  getWeekDates, fmtISO, timeStr, colorMap,
  DAY_NAMES, DAY_NAMES_FULL, MONTH_NAMES, HOURS, CELL_H,
} from "@/lib/agenda-config";
import { statusConfig } from "@/lib/agenda-config";
import { MiniCalendar } from "@/components/agenda/mini-calendar";
import { EventCard } from "@/components/agenda/event-card";
import { SidePanel } from "@/components/agenda/side-panel";

export default function AgendaPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [panelApt, setPanelApt] = useState<Agendamento | null>(null);
  const [view, setView] = useState<"week" | "day" | "month">("week");

  const carregar = useCallback(() => setAgendamentos(getAgendamentos()), []);
  useEffect(() => {
    carregar();
    window.addEventListener("crm_agenda_updated", carregar);
    return () => window.removeEventListener("crm_agenda_updated", carregar);
  }, [carregar]);

  // No mobile, abre direto em visão "dia" (uma coluna, mais legível).
  // Só ajusta no primeiro mount — se a usuária trocar manualmente, respeita.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 768px)").matches) {
      setView("day");
    }
  }, []);

  // Set of dates that have appointments (for mini-calendar dots)
  const datesWithApts = useMemo(
    () => new Set(agendamentos.map((a) => a.data)),
    [agendamentos]
  );

  const weekDates = getWeekDates(selectedDate);
  const goWeek = (dir: -1 | 1) => { const n = new Date(selectedDate); n.setDate(n.getDate() + dir * 7); setSelectedDate(n); };
  const goMonth = (dir: -1 | 1) => {
    const n = new Date(selectedDate);
    n.setMonth(n.getMonth() + dir);
    setSelectedDate(n);
  };
  const goNav = (dir: -1 | 1) => {
    if (view === "month") goMonth(dir);
    else if (view === "day") { const n = new Date(selectedDate); n.setDate(n.getDate() + dir); setSelectedDate(n); }
    else goWeek(dir);
  };
  const goToday = () => setSelectedDate(new Date());
  const dayViewDates = view === "day" ? [selectedDate] : weekDates;
  const nowTop = (today.getHours() - 8) * CELL_H + (today.getMinutes() / 60) * CELL_H;
  const showNowLine = today.getHours() >= 8 && today.getHours() <= 20;

  const wStart = weekDates[0], wEnd = weekDates[6];
  const weekLabel = wStart.getMonth() === wEnd.getMonth()
    ? `${wStart.getDate()}–${wEnd.getDate()} de ${MONTH_NAMES[wStart.getMonth()]} ${wStart.getFullYear()}`
    : `${wStart.getDate()} ${MONTH_NAMES[wStart.getMonth()].slice(0, 3)} – ${wEnd.getDate()} ${MONTH_NAMES[wEnd.getMonth()].slice(0, 3)} ${wEnd.getFullYear()}`;

  const navLabel = view === "month"
    ? `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    : view === "day"
      ? `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
      : weekLabel;

  const weekApts = agendamentos.filter(a => weekDates.some(d => fmtISO(d) === a.data));
  const todayApts = agendamentos.filter(a => a.data === fmtISO(today));

  // ── Month view data ────────────────────────────────────────────────────────
  const monthYear = selectedDate.getFullYear();
  const monthIdx = selectedDate.getMonth();
  const monthStartOffset = (new Date(monthYear, monthIdx, 1).getDay() + 6) % 7;
  const monthDaysCount = new Date(monthYear, monthIdx + 1, 0).getDate();
  const monthCells = [
    ...Array(monthStartOffset).fill(null),
    ...Array.from({ length: monthDaysCount }, (_, i) => i + 1),
  ];
  // Pad trailing to fill last row
  const trailing = (7 - (monthCells.length % 7)) % 7;
  const monthCellsFull = [...monthCells, ...Array(trailing).fill(null)];

  function handleStatusChange(id: number, status: StatusApt, retorno?: string) {
    const nova = atualizarStatus(id, status, retorno);
    setAgendamentos(nova);
    setPanelApt(prev => prev?.id === id ? nova.find(a => a.id === id) ?? null : prev);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-6rem)]">
      {/* Left panel — escondido no mobile */}
      <div className="hidden lg:block w-72 shrink-0 space-y-5 overflow-y-auto pb-4">
        <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} datesWithApts={datesWithApts} />

        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-body">Esta semana</h3>
          <div className="space-y-3">
            {[
              { label: "Total de atendimentos", value: weekApts.length.toString() },
              { label: "Realizados", value: weekApts.filter(a => a.status === "realizado").length.toString() },
              { label: "Cancelados", value: weekApts.filter(a => a.status === "cancelado").length.toString() },
              { label: "Hoje", value: todayApts.length.toString(), sub: "agendamentos" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-body">{label}</span>
                <span className="text-sm font-bold font-display text-on-surface">
                  {value}{sub && <span className="text-[10px] font-normal text-on-surface-variant ml-1">{sub}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-body">Agenda de hoje</h3>
          {todayApts.length === 0
            ? <p className="text-xs text-outline font-body">Sem atendimentos hoje</p>
            : todayApts.sort((a, b) => a.horaInicio - b.horaInicio || a.minutoInicio - b.minutoInicio).map(a => {
              const c = colorMap[a.cor];
              return (
                <button key={a.id} onClick={() => setPanelApt(a)} className={`flex items-center gap-3 w-full text-left p-3 rounded-2xl ${c.bg} hover:opacity-90 transition-opacity`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold font-body truncate ${c.text}`}>{a.cliente}</p>
                    <p className={`text-[10px] opacity-70 font-body ${c.text}`}>{timeStr(a.horaInicio, a.minutoInicio)} · {a.procedimento}</p>
                  </div>
                </button>
              );
            })
          }
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-5">
          <div className="flex items-center gap-3">
            <button onClick={goToday} className="px-4 py-2 rounded-full bg-surface-highest text-on-surface text-sm font-semibold font-body hover:bg-surface-high transition-colors">Hoje</button>
            <div className="flex items-center gap-1">
              <button onClick={() => goNav(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-high transition-colors text-on-surface-variant"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => goNav(1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-high transition-colors text-on-surface-variant"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <span className="text-base md:text-lg font-bold font-display text-on-surface truncate">{navLabel}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
            <div className="flex bg-surface-highest rounded-2xl p-1 gap-1 shrink-0">
              {(([["week", LayoutGrid, "Semana"], ["day", CalendarDays, "Dia"], ["month", Calendar, "Mês"]] as const)).map(([v, Icon, label]) => (
                <button key={v} onClick={() => setView(v)} className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold font-body transition-all ${view === v ? "bg-surface-lowest text-on-surface shadow-ambient" : "text-on-surface-variant hover:text-on-surface"}`}>
                  <Icon className="w-4 h-4" /><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <Link href="/atendimentos/novo" className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity shrink-0">
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Agendar</span>
            </Link>
          </div>
        </div>

        {/* ── Month View ── */}
        {view === "month" ? (
          <div className="flex-1 bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden flex flex-col">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/30">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-on-surface-variant font-body uppercase tracking-widest">{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
              {monthCellsFull.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="border-t border-r border-outline-variant/10" />;
                const d = new Date(monthYear, monthIdx, day);
                const df = fmtISO(d);
                const isToday = df === fmtISO(today);
                const isSel = df === fmtISO(selectedDate);
                const dayApts = agendamentos.filter(a => a.data === df);
                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedDate(d); setView("day"); }}
                    className={`border-t border-r border-outline-variant/10 p-1.5 text-left flex flex-col hover:bg-surface-low transition-colors ${isToday ? "bg-primary/5" : ""}`}
                  >
                    <span className={`text-xs font-body self-end w-6 h-6 flex items-center justify-center rounded-full ${
                      isSel ? "gradient-primary text-on-primary font-bold"
                        : isToday ? "ring-2 ring-primary text-primary font-bold"
                          : "text-on-surface-variant"
                    }`}>
                      {day}
                    </span>
                    {dayApts.length > 0 && (
                      <div className="mt-1 space-y-0.5 overflow-hidden flex-1 min-h-0">
                        {dayApts.slice(0, 3).map(apt => {
                          const c = colorMap[apt.cor];
                          return (
                            <div
                              key={apt.id}
                              className={`${c.bg} rounded px-1.5 py-0.5 truncate`}
                              onClick={(e) => { e.stopPropagation(); setPanelApt(apt); }}
                            >
                              <span className={`text-[10px] font-semibold font-body ${c.text}`}>
                                {timeStr(apt.horaInicio, apt.minutoInicio)} {apt.cliente.split(" ")[0]}
                              </span>
                            </div>
                          );
                        })}
                        {dayApts.length > 3 && (
                          <span className="text-[9px] text-on-surface-variant font-body pl-1">+{dayApts.length - 3} mais</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Day / Week Grid ── */
          <div className="flex-1 bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden flex flex-col">
            <div className="flex border-b border-outline-variant/30">
              <div className="w-16 shrink-0" />
              {dayViewDates.map((d, i) => {
                const isToday = fmtISO(d) === fmtISO(today);
                const dayName = view === "week" ? DAY_NAMES[i] : DAY_NAMES_FULL[d.getDay() === 0 ? 6 : d.getDay() - 1];
                const dayHasApt = datesWithApts.has(fmtISO(d));
                return (
                  <button key={fmtISO(d)} onClick={() => { setSelectedDate(d); setView("day"); }} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${!isToday ? "hover:bg-surface-low" : ""}`}>
                    <span className={`text-xs font-semibold font-body uppercase tracking-widest ${isToday ? "text-primary" : "text-on-surface-variant"}`}>{dayName}</span>
                    <span className={`relative w-9 h-9 flex items-center justify-center rounded-full text-base font-bold font-display ${isToday ? "gradient-primary text-on-primary" : "text-on-surface hover:bg-surface-high"}`}>
                      {d.getDate()}
                      {dayHasApt && !isToday && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex relative" style={{ height: `${HOURS.length * CELL_H}px` }}>
                <div className="w-16 shrink-0 relative">
                  {HOURS.map(h => (
                    <div key={h} className="absolute right-3 text-[11px] text-on-surface-variant font-body" style={{ top: `${(h - 8) * CELL_H - 7}px` }}>
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {dayViewDates.map(d => {
                  const dayApts = agendamentos.filter(a => a.data === fmtISO(d));
                  const isToday = fmtISO(d) === fmtISO(today);
                  return (
                    <div key={fmtISO(d)} className={`flex-1 relative border-l border-outline-variant/20 ${isToday ? "bg-primary/5" : ""}`} style={{ height: `${HOURS.length * CELL_H}px` }}>
                      {HOURS.map(h => (
                        <div key={h} className="absolute left-0 right-0 border-t border-outline-variant/20" style={{ top: `${(h - 8) * CELL_H}px` }} />
                      ))}
                      {isToday && showNowLine && (
                        <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${nowTop}px` }}>
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 -ml-1.5" />
                          <div className="flex-1 h-[2px] bg-primary" />
                        </div>
                      )}
                      {dayApts.map(apt => (
                        <EventCard key={apt.id} apt={apt} onClick={() => setPanelApt(apt)} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {panelApt && (
          <SidePanel
            apt={panelApt}
            onClose={() => setPanelApt(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
