"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DAY_NAMES, MONTH_NAMES, fmtISO } from "@/lib/agenda-config";

export function MiniCalendar({
  selected,
  onSelect,
  datesWithApts,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  datesWithApts?: Set<string>;
}) {
  const [viewing, setViewing] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = viewing.getFullYear(), month = viewing.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayISO = fmtISO(new Date()), selISO = fmtISO(selected);

  return (
    <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewing(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-high transition-colors text-on-surface-variant"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold font-display text-on-surface">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => setViewing(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-high transition-colors text-on-surface-variant"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d => <span key={d} className="text-center text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const d = new Date(year, month, day), df = fmtISO(d);
          const isToday = df === todayISO, isSel = df === selISO;
          const hasApt = datesWithApts?.has(df) ?? false;
          return (
            <button
              key={day}
              onClick={() => onSelect(d)}
              className={`relative w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium font-body transition-all ${isSel ? "gradient-primary text-on-primary font-bold" : ""} ${isToday && !isSel ? "ring-2 ring-primary text-primary font-bold" : ""} ${!isSel && !isToday ? "text-on-surface-variant hover:bg-surface-high hover:text-on-surface" : ""}`}
            >
              {day}
              {hasApt && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSel ? "bg-on-primary" : "bg-primary"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
