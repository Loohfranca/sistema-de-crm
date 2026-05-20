"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import { getAgendamentos, type Agendamento } from "@/lib/store";
import {
  getDespesas,
  excluirDespesa,
  coletarReceitas,
  getFormas,
  getCategorias,
  formaInfo,
  categoriaInfo,
  brl,
  GESTAO_EVENT,
  type Despesa,
  type ItemRegistro,
} from "@/lib/gestao";
import { DespesaModal } from "@/components/gestao/despesa-modal";
import { EditarAtendimentoModal } from "@/components/agendamentos/editar-atendimento-modal";

// ─── Transação unificada ─────────────────────────────────────────────────────
interface TransacaoBase {
  chave: string;
  data: string;
  valor: number;
}
interface TransacaoReceita extends TransacaoBase {
  tipo: "receita";
  cliente: string;
  servico: string;
  forma: string;
  agendamentoId: number;
}
interface TransacaoDespesa extends TransacaoBase {
  tipo: "despesa";
  descricao: string;
  categoria: string;
  despesaRef: Despesa;
}
type Transacao = TransacaoReceita | TransacaoDespesa;

function dataBR(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export function CaixaPanel() {
  const [montado, setMontado] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [formas, setFormas] = useState<ItemRegistro[]>([]);
  const [categorias, setCategorias] = useState<ItemRegistro[]>([]);

  const [dataInicio, setDataInicio] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [dataFim, setDataFim] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "receita" | "despesa">(
    "todos",
  );
  const [busca, setBusca] = useState("");
  const [filtroForma, setFiltroForma] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  const [modalDespesa, setModalDespesa] = useState<"nova" | Despesa | null>(
    null,
  );
  const [editarApt, setEditarApt] = useState<Agendamento | null>(null);

  const carregar = useCallback(() => {
    setAgendamentos(getAgendamentos());
    setDespesas(getDespesas());
    setFormas(getFormas());
    setCategorias(getCategorias());
  }, []);

  useEffect(() => {
    carregar();
    setMontado(true);
    window.addEventListener("crm_agenda_updated", carregar);
    window.addEventListener(GESTAO_EVENT, carregar);
    return () => {
      window.removeEventListener("crm_agenda_updated", carregar);
      window.removeEventListener(GESTAO_EVENT, carregar);
    };
  }, [carregar]);

  // Todas as transações no intervalo (antes dos filtros de tipo/busca)
  const doPeriodo = useMemo<Transacao[]>(() => {
    const dentro = (d: string) => d >= dataInicio && d <= dataFim;
    const out: Transacao[] = [];
    coletarReceitas(agendamentos).forEach((r, i) => {
      if (!dentro(r.data)) return;
      out.push({
        tipo: "receita",
        chave: `r-${r.agendamentoId}-${i}`,
        data: r.data,
        valor: r.valor,
        cliente: r.cliente,
        servico: r.servico,
        forma: r.forma,
        agendamentoId: r.agendamentoId,
      });
    });
    for (const d of despesas) {
      if (!dentro(d.data)) continue;
      out.push({
        tipo: "despesa",
        chave: `d-${d.id}`,
        data: d.data,
        valor: d.valor,
        descricao: d.descricao,
        categoria: d.categoria,
        despesaRef: d,
      });
    }
    return out.sort((a, b) => b.data.localeCompare(a.data));
  }, [agendamentos, despesas, dataInicio, dataFim]);

  // KPIs do período (independe dos filtros de tipo/busca)
  const kpis = useMemo(() => {
    let rec = 0;
    let desp = 0;
    for (const t of doPeriodo) {
      if (t.tipo === "receita") rec += t.valor;
      else desp += t.valor;
    }
    return { rec, desp, lucro: rec - desp };
  }, [doPeriodo]);

  // Lista filtrada
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return doPeriodo.filter((t) => {
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
      if (
        filtroForma !== "todas" &&
        (t.tipo !== "receita" || t.forma !== filtroForma)
      )
        return false;
      if (
        filtroCategoria !== "todas" &&
        (t.tipo !== "despesa" || t.categoria !== filtroCategoria)
      )
        return false;
      if (q) {
        const texto =
          t.tipo === "receita"
            ? `${t.cliente} ${t.servico}`
            : `${t.descricao} ${categoriaInfo(t.categoria).label}`;
        if (!texto.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [doPeriodo, filtroTipo, filtroForma, filtroCategoria, busca]);

  function exportarCSV() {
    const cab = ["Tipo", "Data", "Descrição", "Forma/Categoria", "Valor"];
    const linhas = lista.map((t) => [
      t.tipo === "receita" ? "Receita" : "Despesa",
      dataBR(t.data),
      t.tipo === "receita"
        ? `${t.cliente} — ${t.servico}`
        : t.descricao || categoriaInfo(t.categoria).label,
      t.tipo === "receita"
        ? formaInfo(t.forma).label
        : categoriaInfo(t.categoria).label,
      `${t.tipo === "despesa" ? "-" : ""}${brl(t.valor)}`,
    ]);
    const csv = [cab, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caixa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!montado) return null;

  const colunas =
    "grid grid-cols-[0.8fr_0.8fr_1.7fr_1.1fr_0.85fr_0.7fr] gap-3 px-6";

  return (
    <div className="space-y-5">
      {modalDespesa && (
        <DespesaModal
          despesa={modalDespesa === "nova" ? undefined : modalDespesa}
          onClose={() => setModalDespesa(null)}
          onSaved={() => {
            setModalDespesa(null);
            carregar();
          }}
        />
      )}
      {editarApt && (
        <EditarAtendimentoModal
          apt={editarApt}
          onClose={() => setEditarApt(null)}
          onSaved={() => {
            setEditarApt(null);
            carregar();
          }}
        />
      )}

      {/* Intervalo de datas + ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <span className="text-sm text-on-surface-variant font-body">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={() => {
              const hoje = new Date().toISOString().slice(0, 10);
              setDataInicio(hoje);
              setDataFim(hoje);
            }}
            className="px-4 py-2.5 rounded-2xl text-sm font-medium font-body bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors"
          >
            Hoje
          </button>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={exportarCSV}
            disabled={lista.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => setModalDespesa("nova")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nova despesa
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-2 mb-1.5">
            <ArrowUpRight className="w-4 h-4 text-secondary" />
            <span className="text-xs text-on-surface-variant font-body">
              Receitas
            </span>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">
            {brl(kpis.rec)}
          </p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-2 mb-1.5">
            <ArrowDownRight className="w-4 h-4 text-error" />
            <span className="text-xs text-on-surface-variant font-body">
              Despesas
            </span>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">
            {brl(kpis.desp)}
          </p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-on-surface-variant font-body">
              Saldo do período
            </span>
          </div>
          <p
            className={`font-display text-xl font-bold ${
              kpis.lucro < 0 ? "text-error" : "text-on-surface"
            }`}
          >
            {brl(kpis.lucro)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar por cliente ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) =>
            setFiltroTipo(e.target.value as "todos" | "receita" | "despesa")
          }
          className="px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="todos">Tudo</option>
          <option value="receita">Só receitas</option>
          <option value="despesa">Só despesas</option>
        </select>
        <select
          value={filtroForma}
          onChange={(e) => setFiltroForma(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="todas">Toda forma</option>
          {formas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="todas">Toda categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {lista.length === 0 ? (
        <div className="bg-surface-lowest rounded-3xl shadow-ambient py-16 text-center text-on-surface-variant font-body">
          Nenhuma movimentação no período.
        </div>
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className="hidden md:block bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
            <div className={`${colunas} py-4 bg-surface-low`}>
              {["Tipo", "Data", "Descrição", "Forma / Categoria", "Valor", ""].map(
                (h, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold text-on-surface-variant font-body uppercase tracking-wider"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>
            <div className="divide-y divide-outline-variant/10">
              {lista.map((t) => {
                const rotulo =
                  t.tipo === "receita"
                    ? formaInfo(t.forma)
                    : categoriaInfo(t.categoria);
                return (
                  <div
                    key={t.chave}
                    className={`${colunas} py-3.5 items-center hover:bg-surface-low transition-colors`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold font-body w-fit ${
                        t.tipo === "receita"
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {t.tipo === "receita" ? "Receita" : "Despesa"}
                    </span>
                    <span className="text-sm text-on-surface-variant font-body tabular-nums">
                      {dataBR(t.data)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface font-body truncate">
                        {t.tipo === "receita"
                          ? t.cliente
                          : t.descricao || rotulo.label}
                      </p>
                      <p className="text-[11px] text-on-surface-variant font-body truncate">
                        {t.tipo === "receita" ? t.servico : "Despesa"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant font-body">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rotulo.cor }}
                      />
                      <span className="truncate">{rotulo.label}</span>
                    </span>
                    <span
                      className={`text-sm font-bold font-body tabular-nums ${
                        t.tipo === "receita" ? "text-secondary" : "text-error"
                      }`}
                    >
                      {t.tipo === "despesa" ? "−" : "+"}
                      {brl(t.valor)}
                    </span>
                    <div className="flex items-center gap-1 justify-self-start">
                      <button
                        onClick={() => {
                          if (t.tipo === "receita") {
                            const apt = agendamentos.find(
                              (a) => a.id === t.agendamentoId,
                            );
                            if (apt) setEditarApt(apt);
                          } else {
                            setModalDespesa(t.despesaRef);
                          }
                        }}
                        title="Editar"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high hover:text-on-surface transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {t.tipo === "despesa" && (
                        <button
                          onClick={() => {
                            if (confirm("Excluir esta despesa?")) {
                              setDespesas(excluirDespesa(t.despesaRef.id));
                            }
                          }}
                          title="Excluir"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {lista.map((t) => {
              const rotulo =
                t.tipo === "receita"
                  ? formaInfo(t.forma)
                  : categoriaInfo(t.categoria);
              return (
                <div
                  key={t.chave}
                  className="bg-surface-lowest rounded-3xl shadow-ambient p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold font-body ${
                        t.tipo === "receita"
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {t.tipo === "receita" ? "Receita" : "Despesa"}
                    </span>
                    <span
                      className={`text-sm font-bold font-body ${
                        t.tipo === "receita" ? "text-secondary" : "text-error"
                      }`}
                    >
                      {t.tipo === "despesa" ? "−" : "+"}
                      {brl(t.valor)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface font-body mt-2">
                    {t.tipo === "receita"
                      ? t.cliente
                      : t.descricao || rotulo.label}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-body">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: rotulo.cor }}
                      />
                      {rotulo.label} · {dataBR(t.data)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (t.tipo === "receita") {
                            const apt = agendamentos.find(
                              (a) => a.id === t.agendamentoId,
                            );
                            if (apt) setEditarApt(apt);
                          } else {
                            setModalDespesa(t.despesaRef);
                          }
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {t.tipo === "despesa" && (
                        <button
                          onClick={() => {
                            if (confirm("Excluir esta despesa?")) {
                              setDespesas(excluirDespesa(t.despesaRef.id));
                            }
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-on-surface-variant font-body text-center">
            Receitas entram automático das baixas dos atendimentos · editar uma
            receita abre o atendimento.
          </p>
        </>
      )}
    </div>
  );
}
