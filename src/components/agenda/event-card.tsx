"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { colorMap, statusConfig, timeStr, endTime, CELL_H } from "@/lib/agenda-config";
import type { Agendamento } from "@/lib/store";
import { EASE_OUT_EXPO } from "@/lib/motion";

function HoverTooltip({ apt }: { apt: Agendamento }) {
  const c = colorMap[apt.cor], sc = statusConfig[apt.status], StatusIcon = sc.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
      style={{ position: "absolute", left: "calc(100% + 10px)", top: 0, zIndex: 50, width: 220, pointerEvents: "none" }}
    >
      <div style={{ position: "absolute", left: -6, top: 16, width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "6px solid white", filter: "drop-shadow(-1px 0 1px rgba(0,0,0,0.06))" }} />
      <div className="bg-surface-lowest rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(27,28,28,0.14)" }}>
        <div className={`${c.bg} ${c.border} border-l-4 px-4 py-3 flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/50">
            <span className={`text-sm font-bold font-display ${c.text}`}>{apt.avatar}</span>
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold font-display truncate ${c.text}`}>{apt.cliente}</p>
            <p className={`text-[10px] opacity-75 font-body truncate ${c.text}`}>{apt.procedimento}</p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2">
          {[["Horário", `${timeStr(apt.horaInicio, apt.minutoInicio)} – ${endTime(apt)}`], ["Duração", `${apt.duracao} min`]].map(([l, v]) => (
            <div key={l} className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body w-14 shrink-0">{l}</span>
              <span className="text-xs font-semibold font-body text-on-surface">{v}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body w-14 shrink-0">Status</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body ${sc.cls}`}><StatusIcon className="w-3 h-3" />{sc.label}</span>
          </div>
        </div>
        <div className="px-4 pb-3"><p className="text-[9px] text-outline font-body">Clique para ver detalhes</p></div>
      </div>
    </motion.div>
  );
}

export function EventCard({ apt, onClick }: { apt: Agendamento; onClick: () => void }) {
  const c = colorMap[apt.cor];
  const top = (apt.horaInicio - 8) * CELL_H + (apt.minutoInicio / 60) * CELL_H;
  const height = Math.max((apt.duracao / 60) * CELL_H - 4, 28);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div style={{ position: "absolute", top: `${top}px`, height: `${height}px`, left: 4, right: 4, zIndex: hovered ? 40 : 10 }}
      onMouseEnter={() => { timer.current = setTimeout(() => setHovered(true), 180); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setHovered(false); }}>
      <button onClick={onClick} className={`w-full h-full rounded-xl border-l-[3px] ${c.bg} ${c.border} ${c.text} px-2 py-1 text-left overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all`}>
        <p className="text-[11px] font-semibold font-body truncate leading-tight">{apt.cliente}</p>
        {height > 36 && <p className="text-[10px] opacity-75 font-body truncate leading-tight">{apt.procedimento}</p>}
        {height > 52 && <p className="text-[10px] opacity-60 font-body">{timeStr(apt.horaInicio, apt.minutoInicio)} · {apt.duracao}min</p>}
      </button>
      {hovered && <HoverTooltip apt={apt} />}
    </div>
  );
}
