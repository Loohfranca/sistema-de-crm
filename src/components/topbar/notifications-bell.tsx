"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  AlertTriangle,
  RotateCcw,
  Cake,
  ChevronRight,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { getAlertas } from "@/lib/estoque";
import { getAgendamentos } from "@/lib/store";
import { getClientes } from "@/lib/clientes";
import type { AlertaEstoque } from "@/types/produto";

interface Retorno {
  id: number;
  cliente: string;
  procedimento: string;
  dataISO: string;
  diasRestantes: number;
}

interface Aniversariante {
  id: string;
  nome: string;
  avatar: string;
}

const SEEN_KEY = "crm_notificacoes_vistas";

function getVistas(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function salvarVistas(set: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<AlertaEstoque[]>([]);
  const [retornos, setRetornos] = useState<Retorno[]>([]);
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [vistas, setVistas] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const carregar = useCallback(() => {
    setAlertas(getAlertas().filter((a) => a.nivel === "critico"));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const listaRetornos: Retorno[] = getAgendamentos()
      .filter((a) => a.status === "realizado" && a.retorno)
      .map((a) => {
        const d = new Date(a.retorno! + "T12:00:00");
        const dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
        return {
          id: a.id,
          cliente: a.cliente,
          procedimento: a.procedimento,
          dataISO: a.retorno!,
          diasRestantes: dias,
        };
      })
      .filter((r) => r.diasRestantes >= 0 && r.diasRestantes <= 7)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 4);
    setRetornos(listaRetornos);

    const m = hoje.getMonth() + 1;
    const d = hoje.getDate();
    const mmdd = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const niver = getClientes()
      .filter((c) => c.birthDate && c.birthDate.endsWith(mmdd))
      .map((c) => ({ id: c.id, nome: c.name, avatar: c.avatar }));
    setAniversariantes(niver);
  }, []);

  useEffect(() => {
    carregar();
    setVistas(getVistas());
    window.addEventListener("crm_estoque_updated", carregar);
    window.addEventListener("crm_agenda_updated", carregar);
    window.addEventListener("crm_clientes_updated", carregar);
    return () => {
      window.removeEventListener("crm_estoque_updated", carregar);
      window.removeEventListener("crm_agenda_updated", carregar);
      window.removeEventListener("crm_clientes_updated", carregar);
    };
  }, [carregar]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  const hojeKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Chave única por item — garante que novos itens reapareçam como "não lidos"
  const chavesAtuais = useMemo(() => {
    const keys: string[] = [];
    for (const a of alertas) keys.push(`est:${a.produto.id}:${a.produto.quantidadeAtual}`);
    for (const r of retornos) keys.push(`ret:${r.id}:${r.dataISO}`);
    for (const n of aniversariantes) keys.push(`nv:${n.id}:${hojeKey}`);
    return keys;
  }, [alertas, retornos, aniversariantes, hojeKey]);

  const total = alertas.length + retornos.length + aniversariantes.length;
  const naoLidas = chavesAtuais.filter((k) => !vistas.has(k)).length;

  function abrirPainel() {
    setOpen(true);
    if (chavesAtuais.length > 0) {
      const atualizada = new Set(vistas);
      chavesAtuais.forEach((k) => atualizada.add(k));
      setVistas(atualizada);
      salvarVistas(atualizada);
    }
  }

  function ir(href: string) {
    router.push(href);
    setOpen(false);
  }

  function rotuloRetorno(dias: number): string {
    if (dias === 0) return "hoje";
    if (dias === 1) return "amanhã";
    return `em ${dias} dias`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (open ? setOpen(false) : abrirPainel())}
        aria-label="Notificações"
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-high/70 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
        {naoLidas > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-lowest"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-12 w-96 bg-surface-lowest rounded-3xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-5 py-4 border-b border-outline-variant/10">
              <h3 className="font-display text-sm font-bold text-on-surface">
                Notificações
              </h3>
              <p className="text-[11px] text-on-surface-variant font-body mt-0.5">
                {total === 0
                  ? "Tudo em dia ✨"
                  : `${total} ${total === 1 ? "item pra sua atenção" : "itens pra sua atenção"}`}
              </p>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {alertas.length > 0 && (
                <section className="px-2 py-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-error" />
                    <span className="text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                      Estoque crítico
                    </span>
                  </div>
                  {alertas.slice(0, 3).map((a) => (
                    <button
                      key={a.produto.id}
                      onClick={() => ir("/estoque")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-high/50 transition-colors text-left"
                    >
                      <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface font-body truncate">
                          {a.produto.nome}
                        </p>
                        <p className="text-[11px] text-on-surface-variant font-body">
                          {a.produto.quantidadeAtual} {a.produto.unidade} · mín.{" "}
                          {a.produto.quantidadeMinima}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                    </button>
                  ))}
                </section>
              )}

              {retornos.length > 0 && (
                <section className="px-2 py-2 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                      Retornos próximos
                    </span>
                  </div>
                  {retornos.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => ir("/agenda")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-high/50 transition-colors text-left"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          r.diasRestantes <= 1
                            ? "bg-error"
                            : r.diasRestantes <= 3
                              ? "bg-tertiary"
                              : "bg-secondary"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface font-body truncate">
                          {r.cliente}
                        </p>
                        <p className="text-[11px] text-on-surface-variant font-body truncate">
                          {r.procedimento} · {rotuloRetorno(r.diasRestantes)}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                    </button>
                  ))}
                </section>
              )}

              {aniversariantes.length > 0 && (
                <section className="px-2 py-2 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Cake className="w-3.5 h-3.5 text-tertiary" />
                    <span className="text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                      Aniversariantes de hoje
                    </span>
                  </div>
                  {aniversariantes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => ir(`/clientes/${c.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-high/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-semibold text-on-tertiary-container font-display">
                          {c.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface font-body truncate">
                          {c.nome}
                        </p>
                        <p className="text-[11px] text-on-surface-variant font-body">
                          Enviar parabéns 🎂
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                    </button>
                  ))}
                </section>
              )}

              {total === 0 && (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <p className="text-sm text-on-surface font-body font-semibold">
                    Nenhuma notificação
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-body mt-1">
                    Você está com tudo sob controle
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
