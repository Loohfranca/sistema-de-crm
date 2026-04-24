"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus, Pencil, Trash2, Check, AlertTriangle } from "lucide-react";
import {
  adicionarProduto,
  editarProduto,
  getProdutos,
  removerProduto,
} from "@/lib/estoque";
import type { Produto, UnidadeMedida } from "@/types/produto";

const UNIDADES: UnidadeMedida[] = [
  "un",
  "ampola",
  "seringa",
  "bisnaga",
  "caixa",
  "frasco",
  "ml",
  "g",
];

const CATEGORIAS = [
  "Injetável",
  "Descartável",
  "Tópico",
  "Peeling",
  "Cosmético",
  "Outros",
];

const emptyForm = {
  nome: "",
  unidade: "un" as UnidadeMedida,
  quantidadeAtual: "",
  quantidadeMinima: "",
  custoUnitario: "",
  categoria: "Injetável",
};

const inputCls =
  "px-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all";

export function EstoqueSection() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const carregar = useCallback(() => setProdutos(getProdutos()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_estoque_updated", carregar);
    return () => window.removeEventListener("crm_estoque_updated", carregar);
  }, [carregar]);

  function abrirNovo() {
    setEditando(null);
    setForm(emptyForm);
    setNovo(true);
  }

  function abrirEditar(p: Produto) {
    setNovo(false);
    setEditando(p);
    setForm({
      nome: p.nome,
      unidade: p.unidade,
      quantidadeAtual: String(p.quantidadeAtual),
      quantidadeMinima: String(p.quantidadeMinima),
      custoUnitario: String(p.custoUnitario),
      categoria: p.categoria ?? "Outros",
    });
  }

  function cancelar() {
    setNovo(false);
    setEditando(null);
    setForm(emptyForm);
  }

  function salvar() {
    const qAtual = parseFloat(form.quantidadeAtual);
    const qMin = parseFloat(form.quantidadeMinima);
    const custo = parseFloat(form.custoUnitario);
    if (!form.nome || isNaN(qAtual) || isNaN(qMin) || isNaN(custo)) return;

    if (editando) {
      setProdutos(
        editarProduto({
          id: editando.id,
          nome: form.nome,
          unidade: form.unidade,
          quantidadeAtual: qAtual,
          quantidadeMinima: qMin,
          custoUnitario: custo,
          categoria: form.categoria,
        }),
      );
    } else {
      setProdutos(
        adicionarProduto({
          nome: form.nome,
          unidade: form.unidade,
          quantidadeAtual: qAtual,
          quantidadeMinima: qMin,
          custoUnitario: custo,
          categoria: form.categoria,
        }),
      );
    }
    cancelar();
  }

  function handleRemover(id: string) {
    setProdutos(removerProduto(id));
  }

  function statusProduto(p: Produto): "ok" | "baixo" | "critico" {
    if (p.quantidadeAtual <= 0 || p.quantidadeAtual < p.quantidadeMinima) return "critico";
    if (p.quantidadeAtual < p.quantidadeMinima * 1.5) return "baixo";
    return "ok";
  }

  return (
    <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-on-surface">
            Estoque
          </h2>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full gradient-primary text-on-primary text-xs font-semibold font-body hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </button>
      </div>

      {(novo || editando) && (
        <div className="mb-4 p-4 rounded-2xl bg-surface-low border border-outline-variant/20 space-y-3">
          <p className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
            {editando ? "Editar produto" : "Novo produto"}
          </p>

          <input
            type="text"
            placeholder="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className={`w-full ${inputCls}`}
          />

          <div className="grid grid-cols-4 gap-3">
            <select
              value={form.unidade}
              onChange={(e) => setForm({ ...form, unidade: e.target.value as UnidadeMedida })}
              className={inputCls}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Qtd atual"
              value={form.quantidadeAtual}
              onChange={(e) => setForm({ ...form, quantidadeAtual: e.target.value })}
              className={inputCls}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Mínimo"
              value={form.quantidadeMinima}
              onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })}
              className={inputCls}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Custo unit. (R$)"
              value={form.custoUnitario}
              onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, categoria: c })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                  form.categoria === c
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={cancelar}
              className="px-4 py-2 rounded-xl text-xs font-semibold font-body bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              <Check className="w-3.5 h-3.5" />
              {editando ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {produtos.length === 0 && (
          <p className="text-sm text-on-surface-variant font-body text-center py-6">
            Nenhum produto cadastrado.
          </p>
        )}
        {produtos.map((p) => {
          const status = statusProduto(p);
          return (
            <div
              key={p.id}
              className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-surface-low hover:bg-surface-container transition-colors group"
            >
              {status !== "ok" && (
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    status === "critico" ? "bg-error" : "bg-tertiary"
                  }`}
                  title={status === "critico" ? "Estoque crítico" : "Estoque baixo"}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-on-surface font-body truncate">
                    {p.nome}
                  </p>
                  {p.categoria && (
                    <span className="text-[10px] font-semibold text-on-surface-variant font-body px-2 py-0.5 rounded-full bg-surface-high">
                      {p.categoria}
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  {p.quantidadeAtual} {p.unidade} ·{" "}
                  <span className={status === "critico" ? "text-error font-semibold" : ""}>
                    mín. {p.quantidadeMinima}
                  </span>{" "}
                  · R$ {p.custoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/{p.unidade}
                </p>
              </div>
              {status === "critico" && (
                <AlertTriangle className="w-4 h-4 text-error shrink-0" />
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => abrirEditar(p)}
                  title="Editar"
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-high hover:text-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemover(p.id)}
                  title="Excluir"
                  className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
