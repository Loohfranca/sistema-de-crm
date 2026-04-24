"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Search, Pencil, Trash2, Link2, CreditCard } from "lucide-react";
import { formatBRL, isoParaBR, removerLancamento } from "@/lib/financeiro";
import { MAQUININHAS } from "@/lib/financeiro-taxas";
import type { Lancamento } from "@/types/financeiro";

export function FinanceiroTable({
  lancamentos,
  mesPrefixo,
  onEdit,
  onChanged,
}: {
  lancamentos: Lancamento[];
  mesPrefixo: string;
  onEdit: (l: Lancamento) => void;
  onChanged: (lista: Lancamento[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<"all" | "entrada" | "saida">("all");

  const filtered = lancamentos.filter((l) => {
    const matchMes = l.data.startsWith(mesPrefixo);
    const matchSearch = l.descricao.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "all" || l.tipo === filterTipo;
    return matchMes && matchSearch && matchTipo;
  });

  function handleRemover(id: string) {
    const atualizada = removerLancamento(id);
    onChanged(atualizada);
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar lançamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              { id: "all", label: "Todos" },
              { id: "entrada", label: "Entradas" },
              { id: "saida", label: "Saídas" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterTipo(f.id)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium font-body transition-all ${
                filterTipo === f.id
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — scroll horizontal no mobile */}
      <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-x-auto">
        <div className="min-w-[720px]">
        {/* Header */}
        <div className="grid grid-cols-[2fr_auto_1fr_auto_1fr_1fr_auto] gap-4 px-6 py-4 bg-surface-low">
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
            Descrição
          </span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider w-20 text-center">
            Tipo
          </span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
            Categoria
          </span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider w-20 text-center">
            Pagamento
          </span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
            Data
          </span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider text-right">
            Valor
          </span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider w-20 text-center">
            Ações
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-outline-variant/10">
          {filtered.map((l) => {
            const isEntrada = l.tipo === "entrada";
            return (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_auto_1fr_auto_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-surface-low transition-colors group"
              >
                {/* Descrição */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isEntrada ? "bg-secondary-fixed" : "bg-error-container"
                    }`}
                  >
                    {isEntrada ? (
                      <ArrowUpRight className="w-4 h-4 text-on-secondary-container" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-on-error-container" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface font-body truncate">
                      {l.descricao}
                    </p>
                    {l.atendimentoId && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary font-body">
                        <Link2 className="w-3 h-3" />
                        Vinculado
                      </span>
                    )}
                  </div>
                </div>

                {/* Tipo */}
                <div className="w-20 flex justify-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold font-body ${
                      isEntrada
                        ? "bg-secondary-fixed text-on-secondary-container"
                        : "bg-error-container text-on-error-container"
                    }`}
                  >
                    {isEntrada ? "Entrada" : "Saída"}
                  </span>
                </div>

                {/* Categoria */}
                <span className="text-xs text-on-surface-variant font-body">
                  {l.categoria ?? "—"}
                </span>

                {/* Pagamento */}
                <div className="w-20 flex flex-col items-center gap-0.5">
                  {l.formaPagamento ? (
                    <>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-high text-on-surface-variant font-semibold font-body uppercase">
                        {l.formaPagamento === "credito" ? "Crédito" : l.formaPagamento === "debito" ? "Débito" : l.formaPagamento === "pix" ? "PIX" : "Dinheiro"}
                      </span>
                      {l.dadosCartao && (
                        <span className="text-[9px] text-on-surface-variant font-body" title={`${MAQUININHAS.find(m => m.id === l.dadosCartao!.maquininha)?.nome ?? l.dadosCartao.maquininha} · ${l.dadosCartao.taxaPercentual}% · Líq. ${formatBRL(l.dadosCartao.valorLiquidoPrevisto)}${l.dadosCartao.quemPagaTaxa === "cliente" ? " · Taxa: cliente" : ""}`}>
                          {l.dadosCartao.parcelas > 0 ? `${l.dadosCartao.parcelas}x` : "Déb"} · {l.dadosCartao.taxaPercentual}%
                          {l.dadosCartao.quemPagaTaxa === "cliente" && " · cli"}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-outline font-body">—</span>
                  )}
                </div>

                {/* Data */}
                <span className="text-sm text-on-surface-variant font-body tabular-nums">
                  {isoParaBR(l.data)}
                </span>

                {/* Valor */}
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold font-body tabular-nums ${
                      isEntrada ? "text-secondary" : "text-error"
                    }`}
                  >
                    {isEntrada ? "+" : "−"} {formatBRL(l.dadosCartao?.valorLiquidoPrevisto ?? l.valor)}
                  </p>
                  {l.dadosCartao && (
                    <p className="text-[10px] text-on-surface-variant font-body tabular-nums">
                      {l.dadosCartao.quemPagaTaxa === "cliente"
                        ? `cobrado ${formatBRL(l.dadosCartao.valorCobradoCliente)} · taxa ${l.dadosCartao.taxaPercentual}%`
                        : `bruto ${formatBRL(l.dadosCartao.valorBruto)} · taxa ${l.dadosCartao.taxaPercentual}%`
                      }
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="w-20 flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(l)}
                    title="Editar"
                    className="p-2 rounded-full text-on-surface-variant hover:bg-surface-high hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemover(l.id)}
                    title="Excluir"
                    className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant text-sm font-body">
              Nenhum lançamento encontrado.
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
