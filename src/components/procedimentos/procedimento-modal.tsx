"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import {
  adicionarServico,
  editarServico,
  removerServico,
} from "@/lib/servicos";
import { getCategorias } from "@/lib/categorias";
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
} from "@/lib/motion";
import type { Servico } from "@/types/servico";

const labelCls =
  "block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2";
const inputCls =
  "w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all";

export function ProcedimentoModal({
  servico,
  categoriaPreset,
  onClose,
}: {
  servico: Servico | null;
  categoriaPreset?: string | null;
  onClose: () => void;
}) {
  const isEdit = !!servico;

  const [nome, setNome] = useState(servico?.nome ?? "");
  const [categoria, setCategoria] = useState(
    servico?.categoria ?? categoriaPreset ?? "",
  );
  const [duracao, setDuracao] = useState(servico ? String(servico.duracao) : "");
  const [preco, setPreco] = useState(servico ? String(servico.preco) : "");
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    setCategorias(getCategorias());
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const precoNum = parseFloat(preco);
    const duracaoNum = parseInt(duracao);
    if (!nome || isNaN(precoNum) || isNaN(duracaoNum)) return;

    if (isEdit && servico) {
      editarServico({
        id: servico.id,
        nome,
        preco: precoNum,
        duracao: duracaoNum,
        categoria: categoria || undefined,
      });
    } else {
      adicionarServico({
        nome,
        preco: precoNum,
        duracao: duracaoNum,
        categoria: categoria || undefined,
      });
    }
    onClose();
  }

  function handleRemover() {
    if (!servico) return;
    if (!confirm(`Excluir "${servico.nome}"?`)) return;
    removerServico(servico.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={backdropTransition}
      />
      <motion.div
        className="relative bg-surface-lowest rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-on-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-on-surface">
                {isEdit ? "Editar procedimento" : "Novo procedimento"}
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                {isEdit ? "Ajuste os dados do serviço" : "Adicione um serviço ao seu catálogo"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-5">
          <div>
            <label className={labelCls}>Nome do procedimento</label>
            <input
              required
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Limpeza de Pele Profissional"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Categoria</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoria("")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold font-body border transition-all ${
                  categoria === ""
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                }`}
              >
                Sem categoria
              </button>
              {categorias.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold font-body border transition-all ${
                    categoria === c
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Duração (minutos)</label>
              <input
                required
                type="number"
                min="1"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                placeholder="60"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Preço (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                className={inputCls}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            {isEdit && (
              <button
                type="button"
                onClick={handleRemover}
                className="px-5 py-3.5 rounded-full text-sm font-semibold font-body bg-error-container/60 text-on-error-container hover:opacity-90 transition-opacity"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isEdit ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
