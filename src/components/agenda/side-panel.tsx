"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Check, CalendarDays, Clock, Stethoscope, User, RotateCcw } from "lucide-react";
import { colorMap, statusConfig, timeStr, endTime } from "@/lib/agenda-config";
import type { Agendamento, StatusApt } from "@/lib/store";
import {
  backdropTransition,
  backdropVariants,
  sidePanelTransition,
  sidePanelVariants,
} from "@/lib/motion";

export function SidePanel({ apt, onClose, onStatusChange }: {
  apt: Agendamento;
  onClose: () => void;
  onStatusChange: (id: number, s: StatusApt, retorno?: string) => void;
}) {
  const c = colorMap[apt.cor], sc = statusConfig[apt.status], StatusIcon = sc.icon;
  const dateStr = new Date(apt.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [mostrarRetorno, setMostrarRetorno] = useState(false);
  const [dataRetorno, setDataRetorno] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleRealizar() {
    onStatusChange(apt.id, "realizado", dataRetorno || undefined);
    onClose();
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/10"
        onClick={onClose}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={backdropTransition}
      />
      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] bg-surface-lowest flex flex-col"
        style={{ boxShadow: "-12px 0 48px rgba(27,28,28,0.12)" }}
        variants={sidePanelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={sidePanelTransition}
      >
        {/* Header strip */}
        <div className={`${c.strip} border-l-4 px-6 py-5 flex items-start justify-between shrink-0`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
              <span className={`text-xl font-bold font-display ${c.text}`}>{apt.avatar}</span>
            </div>
            <div>
              <h2 className={`text-xl font-bold font-display ${c.text}`}>{apt.cliente}</h2>
              {apt.telefone && <p className={`text-xs font-body opacity-70 ${c.text}`}>{apt.telefone}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
            <X className={`w-4 h-4 ${c.text}`} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${sc.cls}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-semibold font-body">{sc.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: CalendarDays, label: "Data", value: dateStr, span: true },
              { icon: Clock, label: "Horário", value: `${timeStr(apt.horaInicio, apt.minutoInicio)} – ${endTime(apt)} (${apt.duracao}min)`, span: false },
              { icon: Stethoscope, label: "Procedimento", value: apt.procedimento, span: true },
              { icon: User, label: "Profissional", value: apt.profissional, span: false },
            ].map(({ icon: Icon, label, value, span }) => (
              <div key={label} className={`bg-surface-low rounded-2xl p-4 ${span ? "col-span-2" : ""}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">{label}</span>
                </div>
                <p className="text-sm font-semibold text-on-surface font-body capitalize">{value}</p>
              </div>
            ))}
          </div>

          {apt.observacoes && (
            <div className="bg-surface-low rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body mb-2">Observações</p>
              <p className="text-sm text-on-surface font-body">{apt.observacoes}</p>
            </div>
          )}

          {apt.status === "realizado" && apt.retorno && (
            <div className="bg-secondary-fixed/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-on-secondary-container" />
                <span className="text-[10px] uppercase tracking-widest text-on-secondary-container font-body">Retorno Previsto</span>
              </div>
              <p className="text-sm font-semibold text-on-secondary-container font-body">
                {new Date(apt.retorno + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 space-y-3 border-t border-outline-variant/20 shrink-0">
          {apt.status === "agendado" && !mostrarRetorno && (
            <button onClick={() => setMostrarRetorno(true)} className="w-full py-3 rounded-2xl bg-secondary-fixed text-on-secondary-container text-sm font-semibold font-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Check className="w-4 h-4" />Marcar como Realizado
            </button>
          )}

          {apt.status === "agendado" && mostrarRetorno && (
            <div className="space-y-3">
              <div className="bg-surface-low rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-on-surface font-body">Data de Retorno (opcional)</span>
                </div>
                <input
                  type="date"
                  value={dataRetorno}
                  onChange={(e) => setDataRetorno(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <p className="text-[10px] text-on-surface-variant font-body mt-2">
                  Deixe em branco se não houver retorno previsto
                </p>
              </div>
              <button onClick={handleRealizar} className="w-full py-3 rounded-2xl gradient-primary text-on-primary text-sm font-semibold font-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Check className="w-4 h-4" />Finalizar Atendimento
              </button>
              <button onClick={() => setMostrarRetorno(false)} className="w-full py-2 rounded-2xl text-on-surface-variant text-xs font-body hover:bg-surface-high transition-colors">
                Voltar
              </button>
            </div>
          )}

          {apt.status !== "cancelado" && (
            <button onClick={() => { onStatusChange(apt.id, "cancelado"); onClose(); }} className="w-full py-2.5 rounded-2xl bg-error-container/60 text-on-error-container text-sm font-semibold font-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <X className="w-4 h-4" />Cancelar Agendamento
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
