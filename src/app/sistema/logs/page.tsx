"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  getLogs,
  subscribeLogs,
  getLogsServerSnapshot,
  type LogAcao,
  type LogEntidade,
} from "@/lib/logs";
import { EASE_OUT_EXPO } from "@/lib/motion";

type TimePeriod =
  | "hoje"
  | "ontem"
  | "7dias"
  | "esteMes"
  | "mesPassado"
  | "esteAno"
  | "personalizado";

const PERIODOS: { key: TimePeriod; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7dias", label: "Últimos 7 dias" },
  { key: "esteMes", label: "Este mês" },
  { key: "mesPassado", label: "Mês passado" },
  { key: "esteAno", label: "Este ano" },
  { key: "personalizado", label: "Personalizado" },
];

function acaoColor(acao: LogAcao) {
  const map: Record<LogAcao, string> = {
    Criou: "text-[#059669]",
    Editou: "text-[#d97706]",
    Excluiu: "text-[#dc2626]",
    Desativou: "text-[#6b7280]",
    Ativou: "text-[#059669]",
  };
  return map[acao] ?? "text-on-surface";
}

function entidadeBadge(entidade: LogEntidade) {
  const map: Record<LogEntidade, string> = {
    agendamento: "bg-primary/12 text-primary",
    atendimento: "bg-primary/12 text-primary",
    cliente: "bg-tertiary/12 text-tertiary",
    profissional: "bg-error/12 text-error",
    servico: "bg-secondary/12 text-on-secondary-container",
    categoria: "bg-surface-high text-on-surface-variant",
    usuario: "bg-primary-fixed text-on-primary-fixed",
    configuracao: "bg-surface-high text-on-surface-variant",
    estoque: "bg-tertiary/12 text-tertiary",
    financeiro: "bg-secondary/12 text-on-secondary-container",
  };
  return map[entidade] ?? "bg-surface-high text-on-surface-variant";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function isInPeriod(iso: string, period: TimePeriod): boolean {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "hoje":
      return d >= today;
    case "ontem": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return d >= yesterday && d < today;
    }
    case "7dias": {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    case "esteMes":
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    case "mesPassado": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    }
    case "esteAno":
      return d.getFullYear() === now.getFullYear();
    case "personalizado":
      return true;
    default:
      return true;
  }
}

export default function LogsPage() {
  const logs = useSyncExternalStore(subscribeLogs, getLogs, getLogsServerSnapshot);
  const [period, setPeriod] = useState<TimePeriod>("esteMes");
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const usuarios = useMemo(
    () => [...new Set(logs.map((l) => l.usuario))],
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (!isInPeriod(l.dataHora, period)) return false;
      if (filterUser !== "all" && l.usuario !== filterUser) return false;
      if (filterAction !== "all" && l.acao !== filterAction) return false;
      return true;
    });
  }, [logs, period, filterUser, filterAction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Sistema
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Logs de Atividade
        </h1>
      </div>

      {/* Period tabs */}
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold font-body transition-all ${
              period === p.key
                ? "gradient-primary text-on-primary shadow-sm"
                : "bg-surface-lowest text-on-surface-variant hover:bg-surface-high shadow-ambient"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative">
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-2xl bg-surface-lowest text-on-surface text-sm font-body shadow-ambient focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
          >
            <option value="all">Todos os usuários</option>
            {usuarios.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="pl-4 pr-8 py-2.5 rounded-2xl bg-surface-lowest text-on-surface text-sm font-body shadow-ambient focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
          >
            <option value="all">Todas as ações</option>
            <option value="Criou">Criou</option>
            <option value="Editou">Editou</option>
            <option value="Excluiu">Excluiu</option>
            <option value="Desativou">Desativou</option>
            <option value="Ativou">Ativou</option>
          </select>
        </div>
        <span className="ml-auto text-sm text-on-surface-variant font-body">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                  Data e Hora
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden sm:table-cell">
                  Usuário
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                  Ação
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                  Entidade
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden md:table-cell">
                  Descrição
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.18,
                    delay: Math.min(idx * 0.02, 0.3),
                    ease: EASE_OUT_EXPO,
                  }}
                  className="border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-high/40 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-body whitespace-nowrap">
                    {formatDateTime(log.dataHora)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface font-body hidden sm:table-cell">
                    {log.usuario}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold font-body ${acaoColor(log.acao)}`}>
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold font-body ${entidadeBadge(
                        log.entidade
                      )}`}
                    >
                      {log.entidade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface font-body hidden md:table-cell max-w-xs truncate">
                    {log.descricao}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-sm text-on-surface-variant font-body"
                  >
                    Nenhum log encontrado para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
