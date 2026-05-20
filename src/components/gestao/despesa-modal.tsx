"use client";

import { useEffect, useState } from "react";
import { X, TrendingDown } from "lucide-react";
import {
  adicionarDespesa,
  CATEGORIAS,
  type CategoriaDespesa,
} from "@/lib/gestao";

const inputCls =
  "w-full px-4 py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";
const labelCls =
  "block text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1.5";

export function DespesaModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDespesa>("salario");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const valorNum = Number(valor) || 0;

  function handleSalvar() {
    if (valorNum <= 0) return;
    adicionarDespesa({
      valor: valorNum,
      categoria,
      descricao: descricao.trim(),
      data,
    });
    onSaved();
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-[440px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-7 pt-7 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-error-container flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-on-error-container" />
              </div>
              <h2 className="font-display text-xl font-bold text-on-surface">
                Nova despesa
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-7 py-5 space-y-4">
            <div>
              <label className={labelCls}>Valor</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                autoFocus
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Categoria</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoria(c.id)}
                    className={`px-2 py-2 rounded-xl text-xs font-semibold font-body border-2 transition-all ${
                      categoria === c.id
                        ? "border-primary/40 bg-primary/5 text-on-surface"
                        : "border-transparent bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Descrição</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Salário da Fernanda"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="px-7 py-5 border-t border-outline-variant/15 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={valorNum <= 0}
              className="flex-1 py-3 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lançar despesa
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
