"use client";

import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatBRL } from "@/lib/financeiro";
import type { Lancamento } from "@/types/financeiro";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function FinanceiroSummary({
  lancamentos,
  mes,
  ano,
  onMesAnterior,
  onMesSeguinte,
}: {
  lancamentos: Lancamento[];
  mes: number;
  ano: number;
  onMesAnterior: () => void;
  onMesSeguinte: () => void;
}) {
  const prefixo = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  const doMes = lancamentos.filter((l) => l.data.startsWith(prefixo));

  const entradas = doMes
    .filter((l) => l.tipo === "entrada")
    .reduce((acc, l) => acc + (l.dadosCartao?.valorLiquidoPrevisto ?? l.valor), 0);

  const saidas = doMes
    .filter((l) => l.tipo === "saida")
    .reduce((acc, l) => acc + l.valor, 0);

  const saldo = entradas - saidas;

  const stats = [
    {
      label: "Entradas",
      value: formatBRL(entradas),
      icon: TrendingUp,
      color: "bg-secondary-fixed",
      iconColor: "text-on-secondary-container",
    },
    {
      label: "Saídas",
      value: formatBRL(saidas),
      icon: TrendingDown,
      color: "bg-error-container",
      iconColor: "text-on-error-container",
    },
    {
      label: "Saldo",
      value: formatBRL(saldo),
      icon: DollarSign,
      color: saldo >= 0 ? "bg-primary-fixed" : "bg-error-container",
      iconColor: saldo >= 0 ? "text-on-primary-fixed" : "text-on-error-container",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Navegação de mês */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMesAnterior}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high text-on-surface-variant transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-on-surface font-body min-w-[140px] text-center">
          {MESES[mes]} {ano}
        </p>
        <button
          onClick={onMesSeguinte}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high text-on-surface-variant transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-lowest rounded-2xl p-5 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
            <p className="font-display text-lg font-bold text-on-surface leading-tight">
              {s.value}
            </p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
