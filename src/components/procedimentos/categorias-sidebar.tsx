"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, X, Trash2 } from "lucide-react";
import {
  adicionarCategoria,
  getCategorias,
  removerCategoria,
} from "@/lib/categorias";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type { Servico } from "@/types/servico";

export function CategoriasSidebar({
  servicos,
  ativa,
  onChange,
}: {
  servicos: Servico[];
  ativa: string | null;
  onChange: (cat: string | null) => void;
}) {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [nova, setNova] = useState("");

  useEffect(() => {
    setCategorias(getCategorias());
    const sync = () => setCategorias(getCategorias());
    window.addEventListener("crm_categorias_updated", sync);
    return () => window.removeEventListener("crm_categorias_updated", sync);
  }, []);

  function contar(cat: string | null): number {
    if (cat === null) return servicos.length;
    return servicos.filter((s) => s.categoria === cat).length;
  }

  function handleAdicionar() {
    if (!nova.trim()) {
      setAdicionando(false);
      return;
    }
    setCategorias(adicionarCategoria(nova));
    setNova("");
    setAdicionando(false);
  }

  function handleRemover(e: React.MouseEvent, cat: string) {
    e.stopPropagation();
    if (contar(cat) > 0) {
      if (
        !confirm(
          `"${cat}" tem ${contar(cat)} procedimento(s). Remover mesmo assim? Os procedimentos ficarão sem categoria.`,
        )
      )
        return;
    }
    setCategorias(removerCategoria(cat));
    if (ativa === cat) onChange(null);
  }

  const itemCls = (isAtiva: boolean) =>
    `group w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-sm font-body transition-colors ${
      isAtiva
        ? "bg-primary/10 text-primary font-semibold"
        : "text-on-surface-variant hover:bg-surface-high"
    }`;

  return (
    <aside className="w-full lg:w-60 lg:shrink-0 space-y-2">
      <div className="px-4 mb-2">
        <p className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
          Categorias
        </p>
      </div>

      <button onClick={() => onChange(null)} className={itemCls(ativa === null)}>
        <span>Todas as categorias</span>
        <span className="text-[11px] text-on-surface-variant font-body">
          {contar(null)}
        </span>
      </button>

      {categorias.map((cat) => {
        const count = contar(cat);
        const isAtiva = ativa === cat;
        return (
          <div
            key={cat}
            onClick={() => onChange(cat)}
            className={itemCls(isAtiva) + " cursor-pointer"}
          >
            <span className="truncate">{cat}</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-on-surface-variant font-body">
                {count}
              </span>
              <button
                onClick={(e) => handleRemover(e, cat)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all"
                aria-label={`Remover ${cat}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      <div className="pt-2">
        {adicionando ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-1.5 px-2"
          >
            <input
              autoFocus
              type="text"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdicionar();
                if (e.key === "Escape") {
                  setAdicionando(false);
                  setNova("");
                }
              }}
              placeholder="Nome da categoria"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <button
              onClick={() => {
                setAdicionando(false);
                setNova("");
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdicionando(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-body text-on-surface-variant hover:bg-surface-high transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar categoria
          </button>
        )}
      </div>
    </aside>
  );
}
