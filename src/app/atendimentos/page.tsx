"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Clock,
  Pencil,
  Download,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Wallet,
} from "lucide-react";
import { getAgendamentos, isoParaBR, type Agendamento } from "@/lib/store";
import { statusConfig } from "@/lib/agenda-config";
import { getClientes, type Cliente } from "@/lib/clientes";
import { EditarAtendimentoModal } from "@/components/agendamentos/editar-atendimento-modal";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function horaDe(apt: Agendamento): string {
  return `${String(apt.horaInicio).padStart(2, "0")}:${String(apt.minutoInicio).padStart(2, "0")}`;
}

type StatusPag = "total" | "parcial" | "nenhum";

// Lê o valor recebido do pagamento (campo livre no Agendamento — sem acoplar
// ao módulo financeiro).
function infoPagamento(apt: Agendamento): {
  recebido: number;
  statusPag: StatusPag;
} {
  if (!apt.pagamento) return { recebido: 0, statusPag: "nenhum" };
  const p = apt.pagamento as Record<string, unknown>;
  let recebido = 0;
  if (Array.isArray(p.recebimentos)) {
    recebido = (p.recebimentos as { valor: number }[]).reduce(
      (s, r) => s + (Number(r.valor) || 0),
      0,
    );
  } else {
    recebido = Number(p.liquido ?? p.total ?? 0) || 0;
  }
  const statusPag: StatusPag =
    recebido <= 0 ? "nenhum" : recebido >= apt.valor ? "total" : "parcial";
  return { recebido, statusPag };
}

// ─── Badges ──────────────────────────────────────────────────────────────────
function StatusBadge({ apt }: { apt: Agendamento }) {
  const sc = statusConfig[apt.status] ?? statusConfig.realizado;
  const Icon = sc.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold font-body ${sc.cls}`}
    >
      <Icon className="w-3 h-3" />
      {sc.label}
    </span>
  );
}

function PagamentoBadge({ status }: { status: StatusPag }) {
  const cfg = {
    total: { label: "Pago total", cls: "bg-secondary-container text-on-secondary-container" },
    parcial: { label: "Parcial", cls: "bg-tertiary-container text-on-tertiary-container" },
    nenhum: { label: "Não pago", cls: "bg-surface-high text-on-surface-variant" },
  }[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold font-body ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Card de métrica ─────────────────────────────────────────────────────────
function MetricaCard({
  icone,
  rotulo,
  valor,
  destaque,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icone}
        </div>
        <span className="text-xs text-on-surface-variant font-body">
          {rotulo}
        </span>
      </div>
      <p
        className={`font-display font-bold text-on-surface ${
          destaque ? "text-xl" : "text-2xl"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function AtendimentosPage() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProf, setFilterProf] = useState("all");
  const [editando, setEditando] = useState<Agendamento | null>(null);

  const carregar = useCallback(() => {
    setLista(getAgendamentos());
    setClientes(getClientes());
  }, []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_agenda_updated", carregar);
    window.addEventListener("crm_clientes_updated", carregar);
    return () => {
      window.removeEventListener("crm_agenda_updated", carregar);
      window.removeEventListener("crm_clientes_updated", carregar);
    };
  }, [carregar]);

  const clienteIdPorNome = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clientes) m.set(c.name.trim().toLowerCase(), c.id);
    return m;
  }, [clientes]);

  const profissionais = useMemo(() => {
    return [...new Set(lista.map((a) => a.profissional).filter(Boolean))].sort();
  }, [lista]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return lista
      .filter((a) => {
        const matchSearch =
          a.cliente.toLowerCase().includes(q) ||
          a.procedimento.toLowerCase().includes(q) ||
          a.profissional.toLowerCase().includes(q);
        const matchStatus =
          filterStatus === "all" || a.status === filterStatus;
        const matchProf = filterProf === "all" || a.profissional === filterProf;
        return matchSearch && matchStatus && matchProf;
      })
      .sort(
        (a, b) =>
          b.data.localeCompare(a.data) || b.horaInicio - a.horaInicio,
      );
  }, [lista, search, filterStatus, filterProf]);

  // Métricas da lista filtrada
  const metricas = useMemo(() => {
    let agendados = 0;
    let realizados = 0;
    let cancelados = 0;
    let recebido = 0;
    for (const a of filtered) {
      if (a.status === "agendado") agendados++;
      else if (a.status === "realizado") realizados++;
      else if (a.status === "cancelado") cancelados++;
      recebido += infoPagamento(a).recebido;
    }
    return { agendados, realizados, cancelados, recebido };
  }, [filtered]);

  function exportarCSV() {
    const cabecalho = [
      "ID",
      "Cliente",
      "Serviço",
      "Profissional",
      "Data",
      "Hora",
      "Preço",
      "Recebido",
      "Pagamento",
      "Status",
    ];
    const linhas = filtered.map((a) => {
      const { recebido, statusPag } = infoPagamento(a);
      return [
        a.id,
        a.cliente,
        a.procedimento,
        a.profissional,
        isoParaBR(a.data),
        horaDe(a),
        brl(a.valor),
        brl(recebido),
        statusPag === "total"
          ? "Pago total"
          : statusPag === "parcial"
            ? "Parcial"
            : "Não pago",
        (statusConfig[a.status] ?? statusConfig.realizado).label,
      ];
    });
    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agendamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusFiltros = [
    { id: "all", label: "Todos" },
    { id: "agendado", label: "Agendados" },
    { id: "realizado", label: "Realizados" },
    { id: "cancelado", label: "Cancelados" },
  ];

  const colunas =
    "grid grid-cols-[1.5fr_1.3fr_1fr_0.95fr_0.7fr_1fr_0.9fr_0.7fr] gap-3 px-6";

  return (
    <div className="space-y-8">
      {editando && (
        <EditarAtendimentoModal
          apt={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            carregar();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
            Atendimentos
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Todos os agendamentos
          </h1>
          <p className="text-on-surface-variant font-body mt-1">
            {lista.length} no total · veja na{" "}
            <Link
              href="/agenda"
              className="text-primary font-semibold hover:opacity-80 transition-opacity"
            >
              Agenda
            </Link>
          </p>
        </div>
        <button
          onClick={exportarCSV}
          disabled={filtered.length === 0}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricaCard
          icone={<CalendarClock className="w-4 h-4" />}
          rotulo="Agendados"
          valor={String(metricas.agendados)}
        />
        <MetricaCard
          icone={<CheckCircle2 className="w-4 h-4" />}
          rotulo="Realizados"
          valor={String(metricas.realizados)}
        />
        <MetricaCard
          icone={<XCircle className="w-4 h-4" />}
          rotulo="Cancelados"
          valor={String(metricas.cancelados)}
        />
        <MetricaCard
          icone={<Wallet className="w-4 h-4" />}
          rotulo="Valor recebido"
          valor={brl(metricas.recebido)}
          destaque
        />
      </div>

      {/* Busca & filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço ou profissional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <select
          value={filterProf}
          onChange={(e) => setFilterProf(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0"
        >
          <option value="all">Todos os profissionais</option>
          {profissionais.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible shrink-0">
          {statusFiltros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-4 py-3 rounded-2xl text-sm font-medium font-body transition-all whitespace-nowrap ${
                filterStatus === f.id
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-lowest rounded-3xl shadow-ambient py-16 text-center text-on-surface-variant font-body">
          Nenhum agendamento encontrado.
        </div>
      ) : (
        <>
          {/* ── Tabela (desktop) ── */}
          <div className="hidden md:block bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
            <div className={`${colunas} py-4 bg-surface-low`}>
              {[
                "Cliente",
                "Serviço",
                "Profissional",
                "Data · Hora",
                "Valor",
                "Pagamento",
                "Status",
                "",
              ].map((h, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold text-on-surface-variant font-body uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>
            <div className="divide-y divide-outline-variant/10">
              {filtered.map((apt) => {
                const clienteId = clienteIdPorNome.get(
                  apt.cliente.trim().toLowerCase(),
                );
                const { recebido, statusPag } = infoPagamento(apt);
                return (
                  <div
                    key={apt.id}
                    className={`${colunas} py-4 items-center hover:bg-surface-low transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-semibold text-on-primary font-display">
                          {apt.avatar}
                        </span>
                      </div>
                      {clienteId ? (
                        <Link
                          href={`/clientes/${clienteId}`}
                          className="text-sm font-medium text-on-surface font-body truncate hover:text-primary transition-colors"
                        >
                          {apt.cliente}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-on-surface font-body truncate">
                          {apt.cliente}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-on-surface-variant font-body truncate">
                      {apt.procedimento}
                    </span>
                    <span className="text-sm text-on-surface-variant font-body truncate">
                      {apt.profissional}
                    </span>
                    <div className="text-sm text-on-surface font-body">
                      <p>{isoParaBR(apt.data)}</p>
                      <p className="text-xs text-on-surface-variant">
                        {horaDe(apt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-on-surface font-body">
                      {brl(apt.valor)}
                    </span>
                    <div>
                      <PagamentoBadge status={statusPag} />
                      <p className="text-[11px] text-on-surface-variant font-body mt-1">
                        {brl(recebido)} recebido
                      </p>
                    </div>
                    <div>
                      <StatusBadge apt={apt} />
                    </div>
                    <button
                      onClick={() => setEditando(apt)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold font-body text-primary hover:bg-primary/10 transition-colors justify-self-start"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Cards (mobile) ── */}
          <div className="md:hidden space-y-3">
            {filtered.map((apt) => {
              const clienteId = clienteIdPorNome.get(
                apt.cliente.trim().toLowerCase(),
              );
              const { recebido, statusPag } = infoPagamento(apt);
              return (
                <div
                  key={apt.id}
                  className="bg-surface-lowest rounded-3xl shadow-ambient p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-on-primary font-display">
                        {apt.avatar}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {clienteId ? (
                        <Link
                          href={`/clientes/${clienteId}`}
                          className="text-sm font-bold text-on-surface font-body truncate hover:text-primary transition-colors"
                        >
                          {apt.cliente}
                        </Link>
                      ) : (
                        <p className="text-sm font-bold text-on-surface font-body truncate">
                          {apt.cliente}
                        </p>
                      )}
                      <p className="text-xs text-on-surface-variant font-body truncate">
                        {apt.procedimento}
                      </p>
                    </div>
                    <StatusBadge apt={apt} />
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-outline-variant/10">
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant font-body">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {isoParaBR(apt.data)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {horaDe(apt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface font-body">
                        {brl(apt.valor)}
                      </span>
                      <PagamentoBadge status={statusPag} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <p className="text-[11px] text-on-surface-variant font-body">
                      {apt.profissional} · {brl(recebido)} recebido
                    </p>
                    <button
                      onClick={() => setEditando(apt)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold font-body text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
