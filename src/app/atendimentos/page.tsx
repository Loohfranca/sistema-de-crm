"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, AlertCircle } from "lucide-react";
import {
  getAgendamentos,
  isoParaBR,
  type Agendamento,
} from "@/lib/store";
import { statusConfig } from "@/lib/agenda-config";

// ─── Badge de status ─────────────────────────────────────────────────────────
function StatusBadge({ apt }: { apt: Agendamento }) {
  const sc = statusConfig[apt.status];
  const StatusIcon = sc.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${sc.cls}`}>
      <StatusIcon className="w-3 h-3" />{sc.label}
    </span>
  );
}

// ─── Página principal (somente leitura) ──────────────────────────────────────
export default function AtendimentosPage() {
  const [lista, setLista]         = useState<Agendamento[]>([]);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState("all");

  const carregar = useCallback(() => setLista(getAgendamentos()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_agenda_updated", carregar);
    return () => window.removeEventListener("crm_agenda_updated", carregar);
  }, [carregar]);

  const filtered = lista.filter(a => {
    const matchSearch =
      a.cliente.toLowerCase().includes(search.toLowerCase()) ||
      a.procedimento.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "all" ||
      a.status === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">Atendimentos</p>
          <h1 className="font-display text-3xl font-bold text-on-surface">Histórico de Atendimentos</h1>
          <p className="text-on-surface-variant font-body mt-1">
            {lista.length} atendimentos · Veja na <Link href="/agenda" className="text-primary font-semibold hover:opacity-80 transition-opacity">Agenda</Link>
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant"/>
          <input
            type="text"
            placeholder="Buscar por cliente ou procedimento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[
            {id:"all",        label:"Todos"},
            {id:"agendado",   label:"Agendados"},
            {id:"realizado",  label:"Realizados"},
            {id:"cancelado",  label:"Cancelados"},
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-3 rounded-2xl text-sm font-medium font-body transition-all ${
                filterStatus === f.id
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(apt => {
          const dataFormatada = isoParaBR(apt.data);
          const hora = `${String(apt.horaInicio).padStart(2,"0")}:${String(apt.minutoInicio).padStart(2,"0")}`;

          return (
            <div key={apt.id} className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
              <div className="flex items-center gap-5 px-5 py-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-on-primary-fixed">{apt.avatar}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-base font-medium text-on-surface font-body">{apt.cliente}</p>
                    <StatusBadge apt={apt} />
                  </div>
                  <p className="text-sm text-on-surface-variant font-body mt-0.5 truncate">{apt.procedimento}</p>
                </div>

                {/* Data / hora */}
                <div className="flex items-center gap-5 text-sm text-on-surface-variant font-body shrink-0">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/>{dataFormatada}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/>{hora}</span>
                  <span className="text-xs text-outline">{apt.duracao} min</span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant font-body">
            Nenhum atendimento encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
