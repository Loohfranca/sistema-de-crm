"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { X, FileSpreadsheet, FileText, Download, ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { Lancamento } from "@/types/financeiro";
import { formatBRL } from "@/lib/financeiro";
import {
  calcularResumo,
  filtrarPorMes,
  gerarCSV,
  baixarArquivo,
  nomeArquivoCSV,
  MESES_LONGOS,
} from "@/lib/export/contador";
import {
  backdropTransition, backdropVariants, modalTransition, modalVariants,
} from "@/lib/motion";

export function ExportModal({
  onClose,
  lancamentos,
  mesInicial,
  anoInicial,
}: {
  onClose: () => void;
  lancamentos: Lancamento[];
  mesInicial: number;
  anoInicial: number;
}) {
  const [mes, setMes] = useState(mesInicial);
  const [ano, setAno] = useState(anoInicial);

  const doMes = useMemo(() => filtrarPorMes(lancamentos, mes, ano), [lancamentos, mes, ano]);
  const resumo = useMemo(() => calcularResumo(doMes), [doMes]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function mesAnterior() {
    if (mes === 0) {
      setMes(11);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function mesSeguinte() {
    if (mes === 11) {
      setMes(0);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  }

  function exportarCSV() {
    if (doMes.length === 0) return;
    const csv = gerarCSV(doMes);
    baixarArquivo(csv, nomeArquivoCSV(mes, ano), "text/csv;charset=utf-8");
  }

  function abrirRelatorioPDF() {
    if (doMes.length === 0) return;
    const url = `/financeiro/relatorio?mes=${mes}&ano=${ano}&print=1`;
    window.open(url, "_blank");
  }

  const temDados = doMes.length > 0;

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
            <h2 className="text-lg font-bold font-display text-on-surface">Exportar para o contador</h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Relatório mensal com entradas, saídas e taxas de cartão
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
        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          {/* Seletor de mês */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-3">
              Período
            </label>
            <div className="flex items-center justify-center gap-4 bg-surface-high rounded-2xl py-3">
              <button
                onClick={mesAnterior}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-highest text-on-surface-variant transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold text-on-surface font-body min-w-[160px] text-center">
                {MESES_LONGOS[mes]} {ano}
              </p>
              <button
                onClick={mesSeguinte}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-highest text-on-surface-variant transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl bg-surface-low p-5 space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                Prévia do relatório
              </span>
            </div>

            {!temDados ? (
              <p className="text-sm text-on-surface-variant font-body py-4 text-center">
                Nenhum lançamento neste período.
              </p>
            ) : (
              <>
                <div className="flex justify-between text-xs font-body">
                  <span className="text-on-surface-variant">
                    {resumo.quantidadeEntradas} entradas
                  </span>
                  <span className="font-semibold text-on-surface">
                    {formatBRL(resumo.totalEntradas)}
                  </span>
                </div>
                {resumo.totalTaxas > 0 && (
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-on-surface-variant">Taxas de cartão</span>
                    <span className="font-semibold text-error">− {formatBRL(resumo.totalTaxas)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-body">
                  <span className="text-on-surface-variant">
                    {resumo.quantidadeSaidas} saídas
                  </span>
                  <span className="font-semibold text-on-surface">
                    − {formatBRL(resumo.totalSaidas)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-body pt-3 border-t border-outline-variant/15">
                  <span className="font-semibold text-on-surface">Saldo do mês</span>
                  <span
                    className={`font-bold font-display ${
                      resumo.saldo >= 0 ? "text-primary" : "text-error"
                    }`}
                  >
                    {formatBRL(resumo.saldo)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Formato */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-3">
              Escolha o formato
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportarCSV}
                disabled={!temDados}
                className="group flex flex-col items-start gap-3 p-5 rounded-2xl bg-surface-high hover:bg-surface-highest border-2 border-transparent hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-high disabled:hover:border-transparent text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-on-secondary-container" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-on-surface">CSV / Excel</p>
                  <p className="text-xs text-on-surface-variant font-body mt-0.5">
                    Planilha que o contador importa
                  </p>
                </div>
              </button>

              <button
                onClick={abrirRelatorioPDF}
                disabled={!temDados}
                className="group flex flex-col items-start gap-3 p-5 rounded-2xl bg-surface-high hover:bg-surface-highest border-2 border-transparent hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-high disabled:hover:border-transparent text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <FileText className="w-5 h-5 text-on-primary-fixed" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-on-surface">PDF</p>
                  <p className="text-xs text-on-surface-variant font-body mt-0.5">
                    Relatório visual para impressão
                  </p>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant font-body mt-3 leading-relaxed flex items-start gap-1.5">
              <Download className="w-3 h-3 mt-0.5 shrink-0" />
              O PDF abre em uma nova aba já pronto para imprimir ou salvar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
