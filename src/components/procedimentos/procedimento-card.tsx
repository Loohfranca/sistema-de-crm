"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Clock, MoreVertical, Pencil, Package, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/financeiro";
import { calcularCustoMateriais } from "@/lib/estoque";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type { Servico } from "@/types/servico";

function formatDuracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function ProcedimentoCard({
  servico,
  onEdit,
  onMateriais,
  onRemove,
}: {
  servico: Servico;
  onEdit: () => void;
  onMateriais: () => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [estoqueTick, setEstoqueTick] = useState(0);

  useEffect(() => {
    const sync = () => setEstoqueTick((t) => t + 1);
    window.addEventListener("crm_estoque_updated", sync);
    return () => window.removeEventListener("crm_estoque_updated", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const custo = calcularCustoMateriais(servico.id);
  void estoqueTick; // re-render trigger
  const temCusto = custo > 0;
  const margemPct = servico.preco > 0 ? ((servico.preco - custo) / servico.preco) * 100 : 0;

  return (
    <motion.button
      onClick={onEdit}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
      className="group relative text-left w-full bg-surface-lowest rounded-3xl p-6 shadow-ambient hover:shadow-lg transition-shadow"
    >
      {/* Menu ⋮ */}
      <div ref={menuRef} className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-surface-high transition-all"
          aria-label="Ações"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
            className="absolute right-0 top-10 z-20 w-44 bg-surface-lowest rounded-2xl shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-body text-on-surface hover:bg-surface-high transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-on-surface-variant" />
              Editar
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onMateriais();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-body text-on-surface hover:bg-surface-high transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-on-surface-variant" />
              Materiais
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onRemove();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-body text-error hover:bg-error-container/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </motion.div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 pr-8">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-bold text-on-surface leading-snug">
            {servico.nome}
          </h3>

          {servico.categoria && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-body bg-primary/10 text-primary uppercase tracking-wider">
              {servico.categoria}
            </span>
          )}

          <div className="flex items-center gap-1.5 mt-3 text-xs text-on-surface-variant font-body">
            <Clock className="w-3.5 h-3.5" />
            {formatDuracao(servico.duracao)}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display text-xl font-bold text-primary leading-none">
            {formatBRL(servico.preco)}
          </p>
          {temCusto && (
            <div className="mt-2 space-y-0.5">
              <p className="text-[10px] text-outline font-body">
                custo {formatBRL(custo)}
              </p>
              <p
                className={`text-[10px] font-semibold font-body ${
                  margemPct >= 50
                    ? "text-primary"
                    : margemPct >= 0
                      ? "text-tertiary"
                      : "text-error"
                }`}
              >
                {margemPct.toFixed(0)}% margem
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
