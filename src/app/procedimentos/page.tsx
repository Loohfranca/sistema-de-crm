"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { getServicos, removerServico } from "@/lib/servicos";
import type { Servico } from "@/types/servico";
import { CategoriasSidebar } from "@/components/procedimentos/categorias-sidebar";
import { ProcedimentoCard } from "@/components/procedimentos/procedimento-card";
import { ProcedimentoModal } from "@/components/procedimentos/procedimento-modal";
import { MateriaisModal } from "@/components/configuracoes/materiais-modal";
import { EASE_OUT_EXPO } from "@/lib/motion";

export default function ProcedimentosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const [editando, setEditando] = useState<Servico | null>(null);
  const [criando, setCriando] = useState(false);
  const [materiaisServico, setMateriaisServico] = useState<Servico | null>(null);

  const carregar = useCallback(() => setServicos(getServicos()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_servicos_updated", carregar);
    return () => window.removeEventListener("crm_servicos_updated", carregar);
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return servicos.filter((s) => {
      if (categoriaAtiva !== null && s.categoria !== categoriaAtiva) return false;
      if (termo && !s.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [servicos, categoriaAtiva, busca]);

  function handleRemoverServico(s: Servico) {
    if (!confirm(`Excluir "${s.nome}"?`)) return;
    removerServico(s.id);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
            Catálogo
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Procedimentos
          </h1>
          <p className="text-on-surface-variant font-body mt-1">
            {servicos.length} {servicos.length === 1 ? "serviço cadastrado" : "serviços cadastrados"}
          </p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Corpo: sidebar + main */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <CategoriasSidebar
          servicos={servicos}
          ativa={categoriaAtiva}
          onChange={setCategoriaAtiva}
        />

        <div className="flex-1 min-w-0 space-y-5">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar procedimento"
              className="w-full pl-12 pr-4 py-3.5 rounded-full bg-surface-lowest text-on-surface text-sm font-body shadow-ambient border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Grid de cards */}
          {filtrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="py-20 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-surface-high flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-on-surface-variant" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface font-body">
                  {busca
                    ? "Nenhum procedimento encontrado"
                    : categoriaAtiva
                      ? `Nenhum procedimento em "${categoriaAtiva}"`
                      : "Catálogo vazio"}
                </p>
                <p className="text-xs text-on-surface-variant font-body mt-1">
                  {busca ? "Tente outra busca" : "Adicione seu primeiro serviço pra começar"}
                </p>
              </div>
              {!busca && (
                <button
                  onClick={() => setCriando(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar procedimento
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: { transition: { staggerChildren: 0.04 } },
              }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-4"
            >
              {filtrados.map((s) => (
                <motion.div
                  key={s.id}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT_EXPO } },
                  }}
                >
                  <ProcedimentoCard
                    servico={s}
                    onEdit={() => setEditando(s)}
                    onMateriais={() => setMateriaisServico(s)}
                    onRemove={() => handleRemoverServico(s)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Modais */}
      <AnimatePresence>
        {(criando || editando) && (
          <ProcedimentoModal
            servico={editando}
            categoriaPreset={criando ? categoriaAtiva : null}
            onClose={() => {
              setCriando(false);
              setEditando(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {materiaisServico && (
          <MateriaisModal
            servico={materiaisServico}
            onClose={() => setMateriaisServico(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
