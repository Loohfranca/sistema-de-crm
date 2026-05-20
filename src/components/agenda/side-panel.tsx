"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Check, CalendarDays, Clock, Stethoscope, User, RotateCcw, CalendarClock, Pencil, Wallet } from "lucide-react";
import { colorMap, statusConfig, timeStr, endTime } from "@/lib/agenda-config";
import { remarcarAgendamento, type Agendamento, type StatusApt } from "@/lib/store";
import {
  backdropTransition,
  backdropVariants,
  sidePanelTransition,
  sidePanelVariants,
} from "@/lib/motion";

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Lê o valor recebido do pagamento (campo livre no Agendamento)
function infoPag(apt: Agendamento): {
  recebido: number;
  pago: "total" | "parcial" | "nenhum";
} {
  if (!apt.pagamento) return { recebido: 0, pago: "nenhum" };
  const p = apt.pagamento as Record<string, unknown>;
  let recebido = 0;
  if (Array.isArray(p.recebimentos)) {
    recebido = (p.recebimentos as { valor: number }[]).reduce(
      (s, r) => s + (Number(r.valor) || 0),
      0,
    );
  } else {
    recebido = Number(p.liquido ?? p.total ?? 0) || 0;
  }
  const pago =
    recebido <= 0 ? "nenhum" : recebido >= apt.valor ? "total" : "parcial";
  return { recebido, pago };
}

export function SidePanel({ apt, onClose, onStatusChange, onEditar }: {
  apt: Agendamento;
  onClose: () => void;
  onStatusChange: (id: number, s: StatusApt, retorno?: string) => void;
  onEditar: () => void;
}) {
  const c = colorMap[apt.cor], sc = statusConfig[apt.status], StatusIcon = sc.icon;
  const pag = infoPag(apt);
  const pagCfg = {
    total: { label: "Pago total", cls: "bg-secondary-container text-on-secondary-container" },
    parcial: { label: "Parcial", cls: "bg-tertiary-container text-on-tertiary-container" },
    nenhum: { label: "Não pago", cls: "bg-surface-high text-on-surface-variant" },
  }[pag.pago];
  const dateStr = new Date(apt.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [mostrarRetorno, setMostrarRetorno] = useState(false);
  const [dataRetorno, setDataRetorno] = useState("");
  const [mostrarRemarcar, setMostrarRemarcar] = useState(false);
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [motivoRemarcar, setMotivoRemarcar] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleRealizar() {
    onStatusChange(apt.id, "realizado", dataRetorno || undefined);
    onClose();
  }

  function handleRemarcar() {
    if (!novaData || !novaHora) return;
    const [h, m] = novaHora.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    remarcarAgendamento(apt.id, novaData, h, m, motivoRemarcar);
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
            <div className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-black/30 flex items-center justify-center shrink-0">
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

          {/* Pagamento */}
          <div className="bg-surface-low rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Pagamento</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface font-body">
                {brl(pag.recebido)}
                <span className="text-on-surface-variant font-medium"> / {brl(apt.valor)}</span>
              </p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold font-body ${pagCfg.cls}`}>
                {pagCfg.label}
              </span>
            </div>
          </div>

          {apt.observacoes && (
            <div className="bg-surface-low rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body mb-2">Observações</p>
              <p className="text-sm text-on-surface font-body">{apt.observacoes}</p>
            </div>
          )}

          {apt.remarcacoes && apt.remarcacoes.length > 0 && (
            <div className="bg-surface-low rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Remarcações ({apt.remarcacoes.length})</span>
              </div>
              {apt.remarcacoes.map((r, i) => (
                <div key={i} className="text-xs text-on-surface font-body border-l-2 border-primary/30 pl-3 py-1">
                  <p>
                    <span className="line-through text-on-surface-variant">{new Date(r.deData + "T12:00:00").toLocaleDateString("pt-BR")} {r.deHora}</span>
                    {" → "}
                    <span className="font-semibold">{new Date(r.paraData + "T12:00:00").toLocaleDateString("pt-BR")} {r.paraHora}</span>
                  </p>
                  {r.motivo && <p className="text-[11px] text-on-surface-variant mt-0.5">Motivo: {r.motivo}</p>}
                </div>
              ))}
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
          <button
            onClick={onEditar}
            className="w-full py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-semibold font-body flex items-center justify-center gap-2 hover:bg-surface-highest transition-colors"
          >
            <Pencil className="w-4 h-4" />Editar / Lançar pagamento
          </button>

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

          {apt.status === "agendado" && !mostrarRetorno && !mostrarRemarcar && (
            <button onClick={() => setMostrarRemarcar(true)} className="w-full py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-semibold font-body flex items-center justify-center gap-2 hover:bg-surface-highest transition-colors">
              <CalendarClock className="w-4 h-4" />Remarcar
            </button>
          )}

          {apt.status === "agendado" && mostrarRemarcar && (
            <div className="space-y-3">
              <div className="bg-surface-low rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-on-surface font-body">Remarcar agendamento</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <input
                    type="time"
                    value={novaHora}
                    onChange={(e) => setNovaHora(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <textarea
                  value={motivoRemarcar}
                  onChange={(e) => setMotivoRemarcar(e.target.value)}
                  rows={2}
                  placeholder="Motivo (opcional)"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
              <button
                onClick={handleRemarcar}
                disabled={!novaData || !novaHora}
                className="w-full py-3 rounded-2xl gradient-primary text-on-primary text-sm font-semibold font-body flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Check className="w-4 h-4" />Confirmar Remarcação
              </button>
              <button onClick={() => { setMostrarRemarcar(false); setNovaData(""); setNovaHora(""); setMotivoRemarcar(""); }} className="w-full py-2 rounded-2xl text-on-surface-variant text-xs font-body hover:bg-surface-high transition-colors">
                Voltar
              </button>
            </div>
          )}

          {apt.status !== "cancelado" && !mostrarRemarcar && (
            <button onClick={() => { onStatusChange(apt.id, "cancelado"); onClose(); }} className="w-full py-2.5 rounded-2xl bg-error-container/60 text-on-error-container text-sm font-semibold font-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <X className="w-4 h-4" />Cancelar Agendamento
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
