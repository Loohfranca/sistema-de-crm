"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { getAgendamentos, isoParaBR, type Agendamento } from "@/lib/store";
import { getLancamentos, formatBRL } from "@/lib/financeiro";
import { getClientes, type Cliente } from "@/lib/clientes";
import { getProdutos, getAlertas } from "@/lib/estoque";
import { getServicos } from "@/lib/servicos";
import type { Lancamento } from "@/types/financeiro";

type Periodo = "30d" | "mesAtual" | "mesAnterior" | "custom";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatorioPage() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [customDe, setCustomDe] = useState("");
  const [customAte, setCustomAte] = useState("");

  const { dataInicio, dataFim, label } = useMemo(() => {
    const hoje = new Date();
    if (periodo === "30d") {
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 29);
      return {
        dataInicio: isoDate(inicio),
        dataFim: isoDate(hoje),
        label: "Últimos 30 dias",
      };
    }
    if (periodo === "mesAtual") {
      const i = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const f = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return {
        dataInicio: isoDate(i),
        dataFim: isoDate(f),
        label: hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      };
    }
    if (periodo === "mesAnterior") {
      const i = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const f = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return {
        dataInicio: isoDate(i),
        dataFim: isoDate(f),
        label: i.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      };
    }
    return {
      dataInicio: customDe || isoDate(hoje),
      dataFim: customAte || isoDate(hoje),
      label: customDe && customAte ? `${isoParaBR(customDe)} – ${isoParaBR(customAte)}` : "Personalizado",
    };
  }, [periodo, customDe, customAte]);

  const agendamentos = useMemo(() => getAgendamentos(), []);
  const lancamentos = useMemo(() => getLancamentos(), []);
  const clientes = useMemo(() => getClientes(), []);
  const produtos = useMemo(() => getProdutos(), []);
  const servicos = useMemo(() => getServicos(), []);
  const alertasEstoque = useMemo(() => getAlertas(), []);

  // Filtro por período
  const aptsPeriodo = agendamentos.filter((a) => a.data >= dataInicio && a.data <= dataFim);
  const lancsPeriodo = lancamentos.filter((l) => l.data >= dataInicio && l.data <= dataFim);

  // Financeiro
  const entradas = lancsPeriodo.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const saidas = lancsPeriodo.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
  const saldo = entradas - saidas;
  const realizadosPeriodo = aptsPeriodo.filter((a) => a.status === "realizado");
  const ticketMedio = realizadosPeriodo.length > 0
    ? realizadosPeriodo.reduce((s, a) => s + (a.valor || 0), 0) / realizadosPeriodo.length
    : 0;

  // Atendimentos
  const realizados = realizadosPeriodo.length;
  const agendados = aptsPeriodo.filter((a) => a.status === "agendado").length;
  const cancelados = aptsPeriodo.filter((a) => a.status === "cancelado").length;
  const total = aptsPeriodo.length;
  const taxaCancel = total > 0 ? (cancelados / total) * 100 : 0;

  // Clientes — top por receita
  const receitaPorCliente: Record<string, number> = {};
  realizadosPeriodo.forEach((a) => {
    receitaPorCliente[a.cliente] = (receitaPorCliente[a.cliente] || 0) + (a.valor || 0);
  });
  const topClientes = Object.entries(receitaPorCliente)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Aniversariantes (próximos 30 dias)
  const aniversariantes = clientes
    .map((c: Cliente) => {
      if (!c.birthDate) return null;
      const [, m, d] = c.birthDate.split("-").map(Number);
      if (!m || !d) return null;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      let prox = new Date(hoje.getFullYear(), m - 1, d);
      if (prox < hoje) prox = new Date(hoje.getFullYear() + 1, m - 1, d);
      const dias = Math.round((prox.getTime() - hoje.getTime()) / 86400000);
      if (dias > 30) return null;
      return { nome: c.name, telefone: c.phone || "", data: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`, dias };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.dias - b.dias);

  // Procedimentos top
  const receitaPorProc: Record<string, { receita: number; qtd: number }> = {};
  realizadosPeriodo.forEach((a) => {
    if (!receitaPorProc[a.procedimento]) {
      receitaPorProc[a.procedimento] = { receita: 0, qtd: 0 };
    }
    receitaPorProc[a.procedimento].receita += a.valor || 0;
    receitaPorProc[a.procedimento].qtd += 1;
  });
  const topProcedimentos = Object.entries(receitaPorProc)
    .sort(([, a], [, b]) => b.receita - a.receita)
    .slice(0, 10);

  // Exports
  function exportPDF() {
    window.print();
  }

  function exportCSV() {
    const linhas: (string | number)[][] = [];
    linhas.push(["Relatório CRM", label]);
    linhas.push(["Período", `${isoParaBR(dataInicio)} a ${isoParaBR(dataFim)}`]);
    linhas.push([]);
    linhas.push(["FINANCEIRO"]);
    linhas.push(["Entradas", entradas.toFixed(2)]);
    linhas.push(["Saídas", saidas.toFixed(2)]);
    linhas.push(["Saldo", saldo.toFixed(2)]);
    linhas.push(["Ticket médio", ticketMedio.toFixed(2)]);
    linhas.push([]);
    linhas.push(["ATENDIMENTOS"]);
    linhas.push(["Realizados", realizados]);
    linhas.push(["Agendados", agendados]);
    linhas.push(["Cancelados", cancelados]);
    linhas.push(["Taxa cancelamento %", taxaCancel.toFixed(1)]);
    linhas.push([]);
    linhas.push(["TOP CLIENTES POR RECEITA"]);
    linhas.push(["Cliente", "Receita"]);
    topClientes.forEach(([n, v]) => linhas.push([n, v.toFixed(2)]));
    linhas.push([]);
    linhas.push(["TOP PROCEDIMENTOS"]);
    linhas.push(["Procedimento", "Quantidade", "Receita"]);
    topProcedimentos.forEach(([n, v]) => linhas.push([n, v.qtd, v.receita.toFixed(2)]));
    linhas.push([]);
    linhas.push(["LANÇAMENTOS DETALHADOS"]);
    linhas.push(["Data", "Tipo", "Descrição", "Categoria", "Valor"]);
    lancsPeriodo.forEach((l: Lancamento) => {
      linhas.push([isoParaBR(l.data), l.tipo, l.descricao, l.categoria || "", l.valor.toFixed(2)]);
    });
    linhas.push([]);
    linhas.push(["ATENDIMENTOS DETALHADOS"]);
    linhas.push(["Data", "Hora", "Cliente", "Procedimento", "Profissional", "Status", "Valor"]);
    aptsPeriodo.forEach((a: Agendamento) => {
      linhas.push([
        isoParaBR(a.data),
        `${String(a.horaInicio).padStart(2, "0")}:${String(a.minutoInicio).padStart(2, "0")}`,
        a.cliente,
        a.procedimento,
        a.profissional,
        a.status,
        (a.valor || 0).toFixed(2),
      ]);
    });
    downloadCSV(`relatorio_${dataInicio}_${dataFim}.csv`, linhas);
  }

  return (
    <div className="space-y-6">
      {/* Header — escondido no print */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-2 font-body">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">Relatório</p>
          <h1 className="font-display text-3xl font-bold text-on-surface">Relatório consolidado</h1>
          <p className="text-on-surface-variant font-body mt-1 capitalize">{label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-high text-on-surface text-sm font-semibold font-body hover:bg-surface-highest transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity">
            <Printer className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Seletor de período — escondido no print */}
      <div className="print:hidden flex flex-wrap items-center gap-2">
        {([
          { k: "30d", l: "Últimos 30 dias" },
          { k: "mesAtual", l: "Mês atual" },
          { k: "mesAnterior", l: "Mês anterior" },
          { k: "custom", l: "Personalizado" },
        ] as const).map((p) => (
          <button
            key={p.k}
            onClick={() => setPeriodo(p.k)}
            className={`px-4 py-2 rounded-full text-sm font-semibold font-body transition-all ${
              periodo === p.k
                ? "gradient-primary text-on-primary shadow-sm"
                : "bg-surface-lowest text-on-surface-variant hover:bg-surface-high shadow-ambient"
            }`}
          >
            {p.l}
          </button>
        ))}
        {periodo === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customDe} onChange={(e) => setCustomDe(e.target.value)} className="px-3 py-2 rounded-xl bg-surface-lowest text-sm font-body shadow-ambient" />
            <span className="text-on-surface-variant">→</span>
            <input type="date" value={customAte} onChange={(e) => setCustomAte(e.target.value)} className="px-3 py-2 rounded-xl bg-surface-lowest text-sm font-body shadow-ambient" />
          </div>
        )}
      </div>

      {/* Print header — só visível no print */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Relatório CRM</h1>
        <p className="text-sm">Período: {isoParaBR(dataInicio)} a {isoParaBR(dataFim)}</p>
        <p className="text-xs text-gray-600">Gerado em {new Date().toLocaleString("pt-BR")}</p>
        <hr className="my-3" />
      </div>

      {/* Financeiro */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-4">Financeiro</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Entradas", value: formatBRL(entradas), color: "text-secondary" },
            { label: "Saídas", value: formatBRL(saidas), color: "text-error" },
            { label: "Saldo", value: formatBRL(saldo), color: saldo >= 0 ? "text-primary" : "text-error" },
            { label: "Ticket médio", value: formatBRL(ticketMedio), color: "text-on-surface" },
          ].map((m) => (
            <div key={m.label} className="bg-surface-low rounded-2xl p-4 print:bg-transparent print:border print:border-gray-300">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">{m.label}</p>
              <p className={`text-xl font-bold font-display tabular-nums mt-1 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Atendimentos */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-4">Atendimentos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Realizados", value: realizados },
            { label: "Agendados", value: agendados },
            { label: "Cancelados", value: cancelados },
            { label: "Taxa cancel.", value: `${taxaCancel.toFixed(1)}%` },
          ].map((m) => (
            <div key={m.label} className="bg-surface-low rounded-2xl p-4 print:bg-transparent print:border print:border-gray-300">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">{m.label}</p>
              <p className="text-xl font-bold font-display tabular-nums mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top clientes */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-4">Top clientes por receita</h2>
        {topClientes.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-body">Sem dados no período.</p>
        ) : (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                <th className="py-2">#</th>
                <th>Cliente</th>
                <th className="text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {topClientes.map(([n, v], i) => (
                <tr key={n} className="border-b border-outline-variant/10 last:border-0">
                  <td className="py-2 text-on-surface-variant tabular-nums">{i + 1}</td>
                  <td className="font-semibold">{n}</td>
                  <td className="text-right font-bold tabular-nums">{formatBRL(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Top procedimentos */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-4">Top procedimentos</h2>
        {topProcedimentos.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-body">Sem dados no período.</p>
        ) : (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                <th className="py-2">#</th>
                <th>Procedimento</th>
                <th className="text-right">Qtd</th>
                <th className="text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {topProcedimentos.map(([n, v], i) => (
                <tr key={n} className="border-b border-outline-variant/10 last:border-0">
                  <td className="py-2 text-on-surface-variant tabular-nums">{i + 1}</td>
                  <td className="font-semibold">{n}</td>
                  <td className="text-right tabular-nums">{v.qtd}</td>
                  <td className="text-right font-bold tabular-nums">{formatBRL(v.receita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Aniversariantes */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-1">Aniversariantes próximos 30 dias</h2>
        <p className="text-xs text-on-surface-variant font-body mb-4">{aniversariantes.length} cliente(s)</p>
        {aniversariantes.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-body">Nenhum aniversariante.</p>
        ) : (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                <th className="py-2">Data</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th className="text-right">Em</th>
              </tr>
            </thead>
            <tbody>
              {aniversariantes.map((b) => (
                <tr key={b.nome} className="border-b border-outline-variant/10 last:border-0">
                  <td className="py-2 tabular-nums font-semibold">{b.data}</td>
                  <td>{b.nome}</td>
                  <td className="text-on-surface-variant">{b.telefone}</td>
                  <td className="text-right tabular-nums text-on-surface-variant">{b.dias === 0 ? "hoje" : `${b.dias}d`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Estoque crítico */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-1">Estoque crítico</h2>
        <p className="text-xs text-on-surface-variant font-body mb-4">
          {alertasEstoque.length} alerta(s) · {produtos.length} produtos · valor total {formatBRL(produtos.reduce((s, p) => s + p.custoUnitario * p.quantidadeAtual, 0))}
        </p>
        {alertasEstoque.length === 0 ? (
          <p className="text-sm text-on-surface-variant font-body">Sem alertas no estoque.</p>
        ) : (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                <th className="py-2">Produto</th>
                <th>Categoria</th>
                <th className="text-right">Atual</th>
                <th className="text-right">Mínimo</th>
                <th className="text-right">Nível</th>
              </tr>
            </thead>
            <tbody>
              {alertasEstoque.map((a) => (
                <tr key={a.produto.id} className="border-b border-outline-variant/10 last:border-0">
                  <td className="py-2 font-semibold">{a.produto.nome}</td>
                  <td className="text-on-surface-variant">{a.produto.categoria}</td>
                  <td className="text-right tabular-nums">{a.produto.quantidadeAtual}</td>
                  <td className="text-right tabular-nums">{a.produto.quantidadeMinima}</td>
                  <td className={`text-right font-semibold uppercase text-[11px] ${a.nivel === "critico" ? "text-error" : "text-tertiary"}`}>{a.nivel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Resumo de catálogo */}
      <section className="bg-surface-lowest rounded-3xl shadow-ambient p-6 print:shadow-none print:rounded-none print:p-0 print:mb-6">
        <h2 className="font-display text-lg font-bold text-on-surface mb-4">Resumo</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Clientes", value: clientes.length },
            { label: "Procedimentos", value: servicos.length },
            { label: "Produtos", value: produtos.length },
            { label: "Atendimentos no período", value: total },
          ].map((m) => (
            <div key={m.label} className="bg-surface-low rounded-2xl p-4 print:bg-transparent print:border print:border-gray-300">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">{m.label}</p>
              <p className="text-xl font-bold font-display tabular-nums mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
