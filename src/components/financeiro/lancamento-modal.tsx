"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { X, Check, ArrowUpRight, ArrowDownRight, CreditCard, Info } from "lucide-react";
import { adicionarLancamento, editarLancamento, formatBRL } from "@/lib/financeiro";
import { MAQUININHAS, getTaxa, calcLiquido } from "@/lib/financeiro-taxas";
import type { Lancamento, FormaPagamento, DadosCartao, QuemPagaTaxa } from "@/types/financeiro";
import {
  backdropTransition, backdropVariants, modalTransition, modalVariants,
} from "@/lib/motion";

export type AtendimentoOption = { id: string; label: string; valor: number; data: string };

const CATEGORIAS_ENTRADA = ["Procedimento", "Produto", "Pacote", "Outros"];
const CATEGORIAS_SAIDA = ["Aluguel", "Material", "Equipamento", "Marketing", "Salário", "Imposto", "Outros"];

const labelCls = "block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2";
const inputCls = "w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all";

export function LancamentoModal({
  onClose,
  onSaved,
  lancamento,
  atendimentos = [],
}: {
  onClose: () => void;
  onSaved: (lista: Lancamento[]) => void;
  lancamento?: Lancamento;
  atendimentos?: AtendimentoOption[];
}) {
  const isEdit = !!lancamento;

  const [tipo, setTipo] = useState<"entrada" | "saida">(lancamento?.tipo ?? "entrada");
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? "");
  const [valor, setValor] = useState(lancamento ? String(lancamento.valor) : "");
  const [data, setData] = useState(lancamento?.data ?? new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState(lancamento?.categoria ?? "Procedimento");
  const [observacao, setObservacao] = useState(lancamento?.observacao ?? "");
  const [atendimentoId, setAtendimentoId] = useState(lancamento?.atendimentoId ?? "");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | "">(lancamento?.formaPagamento ?? "");

  // Dados cartão (crédito)
  const [maquininha, setMaquininha] = useState(lancamento?.dadosCartao?.maquininha ?? "");
  const [parcelas, setParcelas] = useState(lancamento?.dadosCartao?.parcelas ?? 1);
  const [quemPagaTaxa, setQuemPagaTaxa] = useState<QuemPagaTaxa>(lancamento?.dadosCartao?.quemPagaTaxa ?? "estabelecimento");

  const categorias = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  // Auto-calc taxa e líquido
  const valorNum = parseFloat(valor) || 0;

  const taxaInfo = useMemo(() => {
    let pct: number | null = null;
    if (formaPagamento === "debito" && maquininha) {
      pct = getTaxa(maquininha, 0);
    } else if (formaPagamento === "credito" && maquininha && parcelas >= 1) {
      pct = getTaxa(maquininha, parcelas);
    }
    if (pct === null) return null;

    const taxaValor = Math.round(valorNum * (pct / 100) * 100) / 100;

    if (formaPagamento === "credito" && quemPagaTaxa === "cliente") {
      // Cliente paga a taxa: cobrado = valor + taxa, líquido ≈ valor original
      const cobrado = Math.round((valorNum + taxaValor) * 100) / 100;
      const liquido = calcLiquido(cobrado, pct);
      return { percentual: pct, liquido, cobradoCliente: cobrado, taxaValor };
    }

    // Estabelecimento paga (padrão): cobrado = valor, líquido = valor - taxa
    const liquido = calcLiquido(valorNum, pct);
    return { percentual: pct, liquido, cobradoCliente: valorNum, taxaValor: valorNum - liquido };
  }, [formaPagamento, maquininha, parcelas, valorNum, quemPagaTaxa]);

  useEffect(() => {
    if (!isEdit) {
      setCategoria(tipo === "entrada" ? "Procedimento" : "Aluguel");
    }
  }, [tipo, isEdit]);

  // Reset cartão fields when switching away from crédito/débito
  useEffect(() => {
    if (formaPagamento !== "credito" && formaPagamento !== "debito") {
      setMaquininha("");
      setParcelas(1);
    }
  }, [formaPagamento]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao || isNaN(valorNum) || valorNum <= 0) return;

    let dadosCartao: DadosCartao | undefined;
    if (formaPagamento === "credito" && maquininha && taxaInfo) {
      dadosCartao = {
        maquininha,
        parcelas,
        taxaPercentual: taxaInfo.percentual,
        valorBruto: valorNum,
        valorLiquidoPrevisto: taxaInfo.liquido,
        quemPagaTaxa,
        valorCobradoCliente: taxaInfo.cobradoCliente,
      };
    } else if (formaPagamento === "debito" && maquininha && taxaInfo) {
      dadosCartao = {
        maquininha,
        parcelas: 0,
        taxaPercentual: taxaInfo.percentual,
        valorBruto: valorNum,
        valorLiquidoPrevisto: taxaInfo.liquido,
        quemPagaTaxa: "estabelecimento",
        valorCobradoCliente: valorNum,
      };
    }

    const dados = {
      tipo,
      descricao,
      valor: valorNum,
      data,
      categoria,
      observacao: observacao || undefined,
      formaPagamento: formaPagamento || undefined,
      dadosCartao,
      atendimentoId: atendimentoId || undefined,
    };

    const nova = isEdit
      ? editarLancamento({ ...dados, id: lancamento.id })
      : adicionarLancamento(dados);

    onSaved(nova);
    onClose();
  }

  const showMaquininha = formaPagamento === "credito" || formaPagamento === "debito";
  const showParcelas = formaPagamento === "credito";

  // Max parcelas available for selected machine
  const maxParcelas = useMemo(() => {
    if (!maquininha) return 6;
    const maq = MAQUININHAS.find((m) => m.id === maquininha);
    if (!maq) return 6;
    // taxas[0] is débito, taxas[1..N] are crédito 1x..Nx
    return maq.taxas.length - 1;
  }, [maquininha]);

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
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/20 shrink-0">
          <div>
            <h2 className="text-lg font-bold font-display text-on-surface">
              {isEdit ? "Editar Lançamento" : "Novo Lançamento"}
            </h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              {isEdit ? "Altere os dados do lançamento" : "Registre uma entrada ou saída"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-5">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("entrada")}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold font-body transition-all border-2 ${
                tipo === "entrada"
                  ? "bg-secondary-fixed text-on-secondary-container border-secondary/30"
                  : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipo("saida")}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold font-body transition-all border-2 ${
                tipo === "saida"
                  ? "bg-error-container text-on-error-container border-error/30"
                  : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Saída
            </button>
          </div>

          {/* Título (texto livre + sugestões de atendimentos) */}
          <div>
            <label className={labelCls}>Título</label>
            <input
              required
              type="text"
              list={tipo === "entrada" && atendimentos.length > 0 ? "atendimentos-list" : undefined}
              value={descricao}
              onChange={(e) => {
                const val = e.target.value;
                setDescricao(val);
                // Se o texto digitado bate com um atendimento, auto-preenche
                const apt = atendimentos.find((a) => a.label === val);
                if (apt) {
                  setAtendimentoId(apt.id);
                  setValor(String(apt.valor));
                  setData(apt.data);
                  setCategoria("Procedimento");
                } else {
                  setAtendimentoId("");
                }
              }}
              className={inputCls}
              placeholder="Digite ou selecione um atendimento"
            />
            {tipo === "entrada" && atendimentos.length > 0 && (
              <datalist id="atendimentos-list">
                {atendimentos.map((a) => (
                  <option key={a.id} value={a.label} />
                ))}
              </datalist>
            )}
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Valor (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={inputCls}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelCls}>Data</label>
              <input
                required
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className={labelCls}>Categoria</label>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <button
                  type="button"
                  key={c}
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

          {/* Forma de pagamento (só entradas) */}
          {tipo === "entrada" && (
            <div>
              <label className={labelCls}>
                Forma de Pagamento <span className="text-outline font-normal">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "pix", label: "PIX" },
                  { key: "debito", label: "Débito" },
                  { key: "credito", label: "Crédito" },
                  { key: "dinheiro", label: "Dinheiro" },
                ] as const).map((fp) => (
                  <button
                    type="button"
                    key={fp.key}
                    onClick={() => setFormaPagamento(formaPagamento === fp.key ? "" : fp.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold font-body border transition-all ${
                      formaPagamento === fp.key
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                    }`}
                  >
                    {fp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Seção Cartão (débito/crédito) ── */}
          {tipo === "entrada" && showMaquininha && (
            <div className="rounded-2xl bg-surface-low p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-on-surface font-display uppercase tracking-wider">
                  Dados do cartão
                </span>
              </div>

              {/* Maquininha */}
              <div>
                <label className={labelCls}>Maquininha</label>
                <div className="grid grid-cols-2 gap-2">
                  {MAQUININHAS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMaquininha(maquininha === m.id ? "" : m.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                        maquininha === m.id
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                      }`}
                    >
                      {m.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parcelas (só crédito) */}
              {showParcelas && maquininha && (
                <div>
                  <label className={labelCls}>Parcelas</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setParcelas(n)}
                        className={`w-10 h-10 rounded-xl text-xs font-semibold font-body border transition-all ${
                          parcelas === n
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quem paga a taxa (só crédito) */}
              {formaPagamento === "credito" && maquininha && (
                <div>
                  <label className={labelCls}>Quem paga a taxa?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "estabelecimento", label: "Estabelecimento" },
                      { key: "cliente", label: "Cliente" },
                    ] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setQuemPagaTaxa(opt.key)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                          quemPagaTaxa === opt.key
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-outline-variant/20 bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo de taxa (se maquininha selecionada e valor preenchido) */}
              {maquininha && taxaInfo && valorNum > 0 && (
                <div className="rounded-xl bg-surface-lowest p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">Resumo</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-on-surface-variant">Valor do serviço</span>
                    <span className="font-semibold text-on-surface">{formatBRL(valorNum)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-on-surface-variant">Taxa ({taxaInfo.percentual}%)</span>
                    <span className="font-semibold text-error">− {formatBRL(taxaInfo.taxaValor)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-on-surface-variant">Cobrado da cliente</span>
                    <span className="font-semibold text-on-surface">{formatBRL(taxaInfo.cobradoCliente)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body pt-2 border-t border-outline-variant/15">
                    <span className="font-semibold text-on-surface">Líquido recebido</span>
                    <span className="font-bold text-primary font-display">{formatBRL(taxaInfo.liquido)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observação */}
          <div>
            <label className={labelCls}>
              Observação <span className="text-outline font-normal">(opcional)</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Detalhes adicionais..."
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex gap-3">
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
