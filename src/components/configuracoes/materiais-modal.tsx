"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Check, Package, X } from "lucide-react";
import {
  getMateriaisPorServico,
  getProdutos,
  setMateriaisDeServico,
  calcularCustoMateriais,
} from "@/lib/estoque";
import { formatBRL } from "@/lib/financeiro";
import type { Produto } from "@/types/produto";
import type { Servico } from "@/types/servico";
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
} from "@/lib/motion";

interface LinhaMaterial {
  produtoId: string;
  quantidade: string;
}

export function MateriaisModal({
  servico,
  onClose,
}: {
  servico: Servico;
  onClose: () => void;
}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [linhas, setLinhas] = useState<LinhaMaterial[]>([]);

  useEffect(() => {
    setProdutos(getProdutos());
    const vinculos = getMateriaisPorServico(servico.id);
    setLinhas(
      vinculos.length > 0
        ? vinculos.map((v) => ({ produtoId: v.produtoId, quantidade: String(v.quantidade) }))
        : [{ produtoId: "", quantidade: "" }],
    );
  }, [servico.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function adicionarLinha() {
    setLinhas([...linhas, { produtoId: "", quantidade: "" }]);
  }

  function removerLinha(idx: number) {
    setLinhas(linhas.filter((_, i) => i !== idx));
  }

  function atualizarLinha(idx: number, campo: keyof LinhaMaterial, valor: string) {
    setLinhas(linhas.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }

  const custoPrevisto = useMemo(() => {
    return linhas.reduce((acc, l) => {
      const p = produtos.find((pp) => pp.id === l.produtoId);
      const q = parseFloat(l.quantidade);
      if (!p || isNaN(q)) return acc;
      return acc + p.custoUnitario * q;
    }, 0);
  }, [linhas, produtos]);

  const margemPct = servico.preco > 0 ? ((servico.preco - custoPrevisto) / servico.preco) * 100 : 0;

  function salvar() {
    const validas = linhas
      .filter((l) => l.produtoId && parseFloat(l.quantidade) > 0)
      .map((l) => ({ produtoId: l.produtoId, quantidade: parseFloat(l.quantidade) }));
    setMateriaisDeServico(servico.id, validas);
    onClose();
  }

  const produtosDisponiveis = (linhaAtual: string) =>
    produtos.filter(
      (p) => p.id === linhaAtual || !linhas.some((l) => l.produtoId === p.id),
    );

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
        className="relative bg-surface-lowest rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-on-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-on-surface">
                Materiais consumidos
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5 truncate max-w-md">
                {servico.nome}
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

        <div className="flex-1 overflow-y-auto p-7 space-y-4">
          <p className="text-xs text-on-surface-variant font-body">
            Produtos descontados do estoque a cada atendimento realizado.
          </p>

          {linhas.map((linha, idx) => {
            const produto = produtos.find((p) => p.id === linha.produtoId);
            return (
              <div key={idx} className="flex items-center gap-3">
                <select
                  value={linha.produtoId}
                  onChange={(e) => atualizarLinha(idx, "produtoId", e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="">Selecione um produto...</option>
                  {produtosDisponiveis(linha.produtoId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.unidade})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Qtd"
                  value={linha.quantidade}
                  onChange={(e) => atualizarLinha(idx, "quantidade", e.target.value)}
                  className="w-24 px-3 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body text-right border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
                <span className="text-xs text-on-surface-variant font-body w-16 shrink-0">
                  {produto?.unidade ?? ""}
                </span>
                <button
                  onClick={() => removerLinha(idx)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors shrink-0"
                  aria-label="Remover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          <button
            onClick={adicionarLinha}
            className="w-full py-2.5 rounded-xl text-xs font-semibold font-body bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors"
          >
            + Adicionar material
          </button>

          {/* Resumo de custo/margem */}
          <div className="rounded-2xl bg-surface-low p-4 space-y-2 mt-6">
            <p className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1">
              Prévia financeira
            </p>
            <div className="flex justify-between text-xs font-body">
              <span className="text-on-surface-variant">Preço cobrado</span>
              <span className="font-semibold text-on-surface">{formatBRL(servico.preco)}</span>
            </div>
            <div className="flex justify-between text-xs font-body">
              <span className="text-on-surface-variant">Custo dos materiais</span>
              <span className="font-semibold text-error">− {formatBRL(custoPrevisto)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-outline-variant/15">
              <span className="text-sm font-semibold text-on-surface font-body">
                Margem
              </span>
              <span
                className={`font-display text-lg font-bold ${
                  margemPct >= 50 ? "text-primary" : margemPct >= 0 ? "text-tertiary" : "text-error"
                }`}
              >
                {formatBRL(servico.preco - custoPrevisto)} ({margemPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            className="flex-1 py-3 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Salvar vínculos
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Helper re-exportado para facilitar uso fora do modal
export { calcularCustoMateriais };
