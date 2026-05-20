"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Calendar, Clock, CheckCircle2,
  ChevronRight, MessageCircle, Phone, XCircle,
  Play, TrendingUp, Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  getAgendamentos,
  isoParaBR,
  type Agendamento,
} from "@/lib/store";
import { getClientes, type Cliente } from "@/lib/clientes";
import { statusConfig, endTime } from "@/lib/agenda-config";
import { AlertasEstoque } from "@/components/dashboard/alertas-estoque";
import { LembretesProximos } from "@/components/dashboard/lembretes-proximos";

// ─── Birthday helpers ─────────────────────────────────────────────────────────
function daysUntilBirthday(birthDate: string): number | null {
  if (!birthDate) return null;
  const [, m, d] = birthDate.split("-").map(Number);
  if (!m || !d) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ano = hoje.getFullYear();
  let prox = new Date(ano, m - 1, d);
  if (prox < hoje) prox = new Date(ano + 1, m - 1, d);
  return Math.round((prox.getTime() - hoje.getTime()) / 86400000);
}

function birthdayLabel(birthDate: string): string {
  const [, m, d] = birthDate.split("-");
  return `${d}/${m}`;
}

function deriveBirthdays(clientes: Cliente[]) {
  return clientes
    .map((c) => {
      const dias = daysUntilBirthday(c.birthDate);
      if (dias === null || dias > 30) return null;
      return {
        name: c.name,
        phone: c.phone?.replace(/\D/g, "") ?? "",
        birthday: birthdayLabel(c.birthDate),
        isToday: dias === 0,
        dias,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 6);
}

function waMsg(name: string) {
  const first = name.split(" ")[0];
  return encodeURIComponent(`Olá, ${first}! 🎂 A equipe do Studio Estética deseja um feliz aniversário! Que hoje seja especial ✨💖`);
}

// ─── Heatmap helpers ─────────────────────────────────────────────────────────
const HEAT_HOURS = ["08h","09h","10h","11h","12h","13h","14h","15h","16h","17h"];
const HEAT_DAYS  = ["Seg","Ter","Qua","Qui","Sex","Sáb"];

function buildHeatmap(lista: Agendamento[]): number[][] {
  // count appointments per (hour, dayOfWeek)
  const counts: number[][] = Array.from({ length: 10 }, () => Array(6).fill(0));
  for (const a of lista) {
    const d = new Date(a.data + "T12:00:00");
    const dow = d.getDay(); // 0=Sun
    if (dow === 0) continue; // skip Sunday
    const col = dow - 1; // Mon=0 ... Sat=5
    const row = a.horaInicio - 8;
    if (row >= 0 && row < 10 && col < 6) {
      counts[row][col]++;
    }
  }
  // normalize to 0-4 scale
  const max = Math.max(1, ...counts.flat());
  return counts.map(row => row.map(v => v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4))));
}

const heatColor = (v: number) => {
  if (v === 0) return "bg-surface-high";
  if (v === 1) return "bg-primary/15";
  if (v === 2) return "bg-primary/30";
  if (v === 3) return "bg-primary/55";
  return "bg-primary/80";
};

// ─── Retornos ────────────────────────────────────────────────────────────────
const urgencyColor: Record<string, string> = {
  high: "bg-error", medium: "bg-tertiary", low: "bg-secondary",
};

function calcUrgency(retorno: string): string {
  const diff = Math.ceil((new Date(retorno + "T12:00:00").getTime() - Date.now()) / 86400000);
  if (diff <= 3) return "high";
  if (diff <= 10) return "medium";
  return "low";
}

function retornoLabel(retorno: string): string {
  const d = new Date(retorno + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

// ─── Greeting ────────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const carregar = useCallback(() => setLista(getAgendamentos()), []);
  const carregarClientes = useCallback(() => setClientes(getClientes()), []);

  useEffect(() => {
    carregar();
    carregarClientes();
    window.addEventListener("crm_agenda_updated", carregar);
    window.addEventListener("crm_clientes_updated", carregarClientes);
    return () => {
      window.removeEventListener("crm_agenda_updated", carregar);
      window.removeEventListener("crm_clientes_updated", carregarClientes);
    };
  }, [carregar, carregarClientes]);

  const birthdayClients = useMemo(() => deriveBirthdays(clientes), [clientes]);

  const agendados  = lista.filter((a) => a.status === "agendado").length;
  const realizados = lista.filter((a) => a.status === "realizado").length;
  const cancelados = lista.filter((a) => a.status === "cancelado").length;
  const clientesUnicos = [...new Set(lista.map((a) => a.cliente))].length;

  const upcomingReturns = lista
    .filter((a) => a.status === "realizado" && a.retorno)
    .sort((a, b) => a.retorno!.localeCompare(b.retorno!))
    .slice(0, 6)
    .map((a) => ({
      client: a.cliente,
      procedure: a.procedimento,
      lastDate: retornoLabel(a.retorno!),
      urgency: calcUrgency(a.retorno!),
      phone: a.telefone,
    }));

  const heatData = buildHeatmap(lista);

  const stats = [
    {
      label: "Clientes",
      value: String(clientesUnicos),
      icon: Users,
      color: "bg-primary-fixed",
      iconColor: "text-on-primary-fixed",
      href: "/clientes",
    },
    {
      label: "Agendados",
      value: String(agendados),
      icon: Calendar,
      color: "bg-secondary-fixed",
      iconColor: "text-on-secondary-container",
      href: "/agenda",
    },
    {
      label: "Realizados",
      value: String(realizados),
      icon: CheckCircle2,
      color: "bg-primary-container",
      iconColor: "text-on-primary-container",
      href: "/atendimentos",
    },
    {
      label: "Cancelados",
      value: String(cancelados),
      icon: XCircle,
      color: "bg-surface-high",
      iconColor: "text-on-surface-variant",
      href: "/atendimentos",
    },
  ];

  const [vistaAgenda, setVistaAgenda] = useState<"hoje" | "semana" | "mes">("hoje");

  const hojeISO = new Date().toISOString().slice(0, 10);
  const hojeFormatado = isoParaBR(hojeISO);

  // Week date range (Mon–Sun)
  const hoje = new Date();
  const dow = hoje.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() + diffToMon);
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const segISO = seg.toISOString().slice(0, 10);
  const domISO = dom.toISOString().slice(0, 10);

  // Month date range
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const inicioMesISO = inicioMes.toISOString().slice(0, 10);
  const fimMesISO = fimMes.toISOString().slice(0, 10);
  const mesFormatado = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Agenda: only pending ("agendado")
  const agendaHoje = lista
    .filter((a) => a.data === hojeISO && a.status === "agendado")
    .sort((a, b) => a.horaInicio - b.horaInicio || a.minutoInicio - b.minutoInicio);

  const agendaSemana = lista
    .filter((a) => a.data >= segISO && a.data <= domISO && a.status === "agendado")
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio - b.horaInicio);

  const agendaMes = lista
    .filter((a) => a.data >= inicioMesISO && a.data <= fimMesISO && a.status === "agendado")
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio - b.horaInicio);

  const agendaAtual = vistaAgenda === "hoje" ? agendaHoje : vistaAgenda === "semana" ? agendaSemana : agendaMes;

  // Histórico: realizados + cancelados (most recent first)
  const recentes = lista
    .filter((a) => a.status === "realizado" || a.status === "cancelado")
    .sort((a, b) => b.data.localeCompare(a.data) || b.horaInicio - a.horaInicio)
    .slice(0, 5);

  // ── Métricas do dia ──────────────────────────────────────────────────────────
  const todosHoje = lista
    .filter((a) => a.data === hojeISO)
    .sort((a, b) => a.horaInicio - b.horaInicio || a.minutoInicio - b.minutoInicio);

  // Faturamento do dia = soma dos pagamentos recebidos hoje (baixa feita hoje),
  // independente da data do atendimento.
  const faturamentoHoje = lista.reduce((acc, a) => {
    if (!a.pagamento) return acc;
    const p = a.pagamento as Record<string, unknown>;
    if (Array.isArray(p.recebimentos)) {
      for (const r of p.recebimentos as { valor: number; data: string }[]) {
        if (r.data === hojeISO) acc += Number(r.valor) || 0;
      }
    }
    return acc;
  }, 0);

  const realizadosHoje = todosHoje.filter((a) => a.status === "realizado").length;

  // Horários livres hoje: total de slots de 1h (8–18h = 10 slots) − ocupados
  const slotsOcupadosHoje = new Set(
    todosHoje.filter((a) => a.status !== "cancelado").map((a) => a.horaInicio)
  ).size;
  const horariosLivresHoje = Math.max(0, 10 - slotsOcupadosHoje);

  // Próximo atendimento: primeiro "agendado" de hoje (ou agora em diante)
  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const proximoAtendimento = todosHoje
    .filter((a) => a.status === "agendado")
    .find((a) => a.horaInicio * 60 + a.minutoInicio >= minutosAgora) ??
    todosHoje.find((a) => a.status === "agendado");

  // Timeline: hoje mostra todos status; semana/mês mostram apenas pendentes
  const timelineSource = vistaAgenda === "hoje" ? todosHoje : vistaAgenda === "semana" ? agendaSemana : agendaMes;
  const timelineItems = timelineSource.map((a) => {
    const inicio = a.horaInicio * 60 + a.minutoInicio;
    const fim = inicio + a.duracao;
    const isCurrent =
      a.data === hojeISO &&
      a.status === "agendado" &&
      minutosAgora >= inicio &&
      minutosAgora < fim;
    return { ...a, isCurrent };
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">

      {/* Left column */}
      <div className="flex-1 min-w-0 space-y-5 lg:space-y-7">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs text-on-surface-variant font-body uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="font-display text-2xl font-bold text-on-surface">{greeting()}, Dra. Helena</h1>
            <p className="text-sm text-on-surface-variant font-body mt-0.5">
              {realizados} realizados · {agendados} agendados
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/clientes" className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-lowest text-on-surface text-sm font-medium font-body ghost-border hover:bg-surface-high transition-colors">
              <Users className="w-3.5 h-3.5" />Nova Cliente
            </Link>
            <Link href="/atendimentos/novo" className="flex items-center gap-2 px-4 py-2 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity">
              <Calendar className="w-3.5 h-3.5" />Agendar
            </Link>
          </div>
        </div>

        {/* ── Stats premium ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="relative bg-surface-lowest rounded-2xl p-5 shadow-ambient ring-1 ring-outline-variant/15 hover:ring-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${s.color} rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-on-surface/5`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-outline-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-display text-2xl font-bold text-on-surface leading-none tabular-nums">{s.value}</p>
              <p className="text-[11px] text-on-surface-variant font-body mt-1.5 uppercase tracking-wider">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* ── Grid: Próximo Atendimento + Faturamento (esq) | Agenda timeline (dir) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

          {/* ── COLUNA ESQUERDA — menor ── */}
          <div className="lg:col-span-5 space-y-4 lg:space-y-5">

            {/* Próximo Atendimento */}
            <div className="relative bg-gradient-to-br from-primary-container/60 via-surface-lowest to-secondary-container/30 rounded-3xl p-5 shadow-ambient ring-1 ring-primary/15 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-semibold text-primary font-body uppercase tracking-widest">Próximo Atendimento</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-body">{hojeFormatado}</span>
                </div>

                {proximoAtendimento ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-on-primary font-display font-bold text-lg shadow-md ring-2 ring-surface-lowest">
                          {proximoAtendimento.avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-lowest flex items-center justify-center shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 text-primary" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-bold text-on-surface truncate">{proximoAtendimento.cliente}</p>
                        <p className="text-xs text-on-surface-variant font-body truncate">{proximoAtendimento.procedimento}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-xs text-on-surface-variant font-body">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-on-surface tabular-nums">
                        {String(proximoAtendimento.horaInicio).padStart(2,"0")}:{String(proximoAtendimento.minutoInicio).padStart(2,"0")}
                      </span>
                      <span className="text-outline-variant">→</span>
                      <span className="tabular-nums">{endTime(proximoAtendimento)}</span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-surface-lowest/80 text-on-surface-variant">
                        {proximoAtendimento.duracao} min
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href="/agenda"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl gradient-primary text-on-primary text-xs font-bold font-body hover:opacity-90 transition-opacity shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />Iniciar
                      </Link>
                      {proximoAtendimento.telefone && (
                        <a
                          href={`https://wa.me/${proximoAtendimento.telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="w-10 h-10 rounded-2xl bg-surface-lowest flex items-center justify-center text-on-surface-variant hover:bg-[#25D366]/15 hover:text-[#25D366] transition-all ring-1 ring-outline-variant/20"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-lowest flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    <p className="text-xs font-semibold text-on-surface font-body">Sem próximos hoje</p>
                    <p className="text-[11px] text-on-surface-variant font-body mt-1">Aproveite a folga ou agende</p>
                  </div>
                )}
              </div>
            </div>

            {/* Faturamento do dia */}
            <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient ring-1 ring-outline-variant/15">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-secondary-container/70 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-on-secondary-container" />
                  </div>
                  <p className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">Faturamento do dia</p>
                </div>
                <Link href="/gestao" className="text-[10px] text-primary font-semibold font-body hover:opacity-80 transition-opacity">
                  Ver
                </Link>
              </div>
              <p className="font-display text-2xl font-bold text-on-surface tabular-nums">
                {faturamentoHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/15">
                <div>
                  <p className="text-[10px] text-on-surface-variant font-body uppercase tracking-wide">Realizados</p>
                  <p className="text-sm font-bold font-display text-on-surface tabular-nums">{realizadosHoje}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-on-surface-variant font-body uppercase tracking-wide">Horários livres</p>
                  <p className="text-sm font-bold font-display text-on-surface tabular-nums">{horariosLivresHoje}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUNA DIREITA — maior — Agenda timeline ── */}
          <div className="lg:col-span-7">
            <div className="bg-surface-lowest rounded-3xl shadow-ambient ring-1 ring-outline-variant/15 overflow-hidden h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
                <div>
                  <h2 className="font-display text-base font-bold text-on-surface">
                    {vistaAgenda === "hoje" ? "Agenda de hoje" : vistaAgenda === "semana" ? "Agenda da semana" : "Agenda do mês"}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant font-body mt-0.5 capitalize">
                    {vistaAgenda === "hoje"
                      ? `${hojeFormatado} · ${timelineItems.length} atendimento${timelineItems.length !== 1 ? "s" : ""}`
                      : vistaAgenda === "semana"
                      ? `${isoParaBR(segISO)} – ${isoParaBR(domISO)} · ${agendaAtual.length}`
                      : `${mesFormatado} · ${agendaAtual.length}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-full bg-surface-high p-0.5">
                    <button
                      onClick={() => setVistaAgenda("hoje")}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold font-body transition-all ${
                        vistaAgenda === "hoje"
                          ? "gradient-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setVistaAgenda("semana")}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold font-body transition-all ${
                        vistaAgenda === "semana"
                          ? "gradient-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      onClick={() => setVistaAgenda("mes")}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold font-body transition-all ${
                        vistaAgenda === "mes"
                          ? "gradient-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Mês
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-5 py-5">
                {timelineItems.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-high flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-on-surface-variant" />
                    </div>
                    <p className="text-sm font-semibold text-on-surface font-body">Agenda livre</p>
                    <p className="text-[11px] text-on-surface-variant font-body mt-1 mb-4">
                      Nenhum atendimento para {vistaAgenda === "hoje" ? "hoje" : vistaAgenda === "semana" ? "esta semana" : "este mês"}
                    </p>
                    <Link
                      href="/atendimentos/novo"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full gradient-primary text-on-primary text-xs font-semibold font-body hover:opacity-90 transition-opacity"
                    >
                      <Calendar className="w-3.5 h-3.5" />Agendar
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    {/* linha vertical da timeline */}
                    <div className="absolute left-[58px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-outline-variant/40 to-transparent" />

                    <div className="space-y-3">
                      {timelineItems.map((apt) => {
                        const sc = statusConfig[apt.status];
                        const StatusIcon = sc.icon;
                        const isCurrent = apt.isCurrent;
                        return (
                          <Link
                            key={apt.id}
                            href="/agenda"
                            className="group relative flex items-stretch gap-4"
                          >
                            {/* horário + dia (se semana/mes) */}
                            <div className="w-14 shrink-0 pt-2 text-right">
                              {vistaAgenda !== "hoje" && (
                                <p className="text-[10px] font-semibold text-primary font-body uppercase tracking-wide">
                                  {new Date(apt.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")}
                                </p>
                              )}
                              <p className={`text-xs font-bold font-body tabular-nums ${isCurrent ? "text-primary" : "text-on-surface"}`}>
                                {String(apt.horaInicio).padStart(2,"0")}:{String(apt.minutoInicio).padStart(2,"0")}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-body tabular-nums">{endTime(apt)}</p>
                            </div>

                            {/* dot na timeline */}
                            <div className="relative shrink-0 flex justify-center w-3 pt-3">
                              <div className={`relative w-3 h-3 rounded-full ring-4 ring-surface-lowest z-10 ${
                                isCurrent
                                  ? "bg-primary shadow-[0_0_0_4px_var(--md-sys-color-primary-container)]"
                                  : apt.status === "realizado"
                                    ? "bg-secondary"
                                    : apt.status === "cancelado"
                                      ? "bg-error"
                                      : "bg-primary-container ring-primary/20"
                              }`}>
                                {isCurrent && (
                                  <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                                )}
                              </div>
                            </div>

                            {/* card */}
                            <div className={`flex-1 min-w-0 rounded-2xl p-3.5 transition-all ${
                              isCurrent
                                ? "bg-primary-container/50 ring-2 ring-primary/40 shadow-md"
                                : "bg-surface-low/60 ring-1 ring-outline-variant/15 hover:ring-primary/25 hover:bg-surface-low"
                            }`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-display font-bold text-[11px] ${
                                  apt.cor === "rose" ? "bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200" :
                                  apt.cor === "gold" ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" :
                                  "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
                                }`}>
                                  {apt.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <p className="text-xs font-bold text-on-surface font-body truncate group-hover:text-primary transition-colors">
                                      {apt.cliente}
                                    </p>
                                    <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold font-body ${
                                      isCurrent ? "bg-primary text-on-primary" : sc.cls
                                    }`}>
                                      <StatusIcon className="w-2.5 h-2.5" />
                                      {isCurrent ? "Em andamento" : sc.label}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant font-body truncate">{apt.procedimento}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-outline-variant/15 bg-surface-low/30">
                <Link href="/agenda" className="flex items-center justify-center gap-1 text-[11px] text-primary font-semibold font-body hover:opacity-80 transition-opacity">
                  Ver agenda completa <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Histórico recente — premium ── */}
        <div className="bg-surface-lowest rounded-3xl shadow-ambient ring-1 ring-outline-variant/15 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">Histórico recente</h2>
              <p className="text-[11px] text-on-surface-variant font-body mt-0.5">Últimos atendimentos</p>
            </div>
            <Link href="/atendimentos" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-high text-[11px] text-primary font-semibold font-body hover:bg-primary-container/50 transition-colors">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* cabeçalho — só desktop */}
          <div className="hidden md:grid grid-cols-12 px-5 py-2.5 bg-surface-low/40 border-b border-outline-variant/10">
            <p className="col-span-4 text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-wider">Cliente</p>
            <p className="col-span-3 text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-wider">Serviço</p>
            <p className="col-span-2 text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-wider">Hora</p>
            <p className="col-span-2 text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-wider text-right">Valor</p>
            <p className="col-span-1 text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-wider text-right">Status</p>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {recentes.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-high flex items-center justify-center">
                  <Clock className="w-5 h-5 text-on-surface-variant" />
                </div>
                <p className="text-xs text-on-surface-variant font-body">Nenhum atendimento registrado</p>
              </div>
            ) : (
              recentes.slice(0, 5).map((apt) => {
                const sc = statusConfig[apt.status];
                const StatusIcon = sc.icon;
                return (
                  <Link
                    key={apt.id}
                    href="/agenda"
                    className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 hover:bg-surface-low/50 transition-colors group"
                  >
                    {/* Cliente + avatar */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-display font-bold text-[11px] ${
                        apt.cor === "rose" ? "bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200" :
                        apt.cor === "gold" ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" :
                        "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
                      }`}>
                        {apt.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface font-body truncate group-hover:text-primary transition-colors">
                          {apt.cliente}
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-body truncate md:hidden">
                          {apt.procedimento}
                        </p>
                      </div>
                    </div>

                    {/* Serviço — desktop */}
                    <p className="hidden md:block md:col-span-3 text-[11px] text-on-surface-variant font-body truncate">
                      {apt.procedimento}
                    </p>

                    {/* Hora/Data */}
                    <div className="hidden md:block md:col-span-2">
                      <p className="text-[11px] font-semibold text-on-surface font-body tabular-nums">
                        {isoParaBR(apt.data).slice(0, 5)}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-body tabular-nums">
                        {String(apt.horaInicio).padStart(2,"0")}:{String(apt.minutoInicio).padStart(2,"0")}
                      </p>
                    </div>

                    {/* Valor */}
                    <p className="hidden md:block md:col-span-2 text-[11px] font-bold text-on-surface font-body tabular-nums text-right">
                      {apt.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>

                    {/* Status */}
                    <div className="col-span-12 md:col-span-1 flex md:justify-end">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-full font-semibold font-body ${sc.cls}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        <span className="md:hidden lg:inline">{sc.label}</span>
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right column — vira coluna abaixo do conteúdo principal no mobile */}
      <div className="w-full lg:w-72 lg:shrink-0 space-y-4">

        {/* Lembretes WhatsApp — atendimentos nas próximas 2h */}
        <LembretesProximos />

        {/* Alertas de estoque (só aparece se houver) */}
        <AlertasEstoque />

        {/* Retornos previstos */}
        <div className="bg-surface-lowest rounded-2xl shadow-ambient overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/15">
            <h2 className="font-display text-sm font-bold text-on-surface">Retornos Previstos</h2>
            <p className="text-[11px] text-on-surface-variant font-body mt-0.5">Para reconvocação</p>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {upcomingReturns.length === 0 && (
              <p className="px-5 py-6 text-xs text-on-surface-variant font-body text-center">
                Nenhum retorno previsto
              </p>
            )}
            {upcomingReturns.map((ret, i) => (
              <div key={`${ret.client}-${i}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-surface-low transition-colors">
                <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyColor[ret.urgency]}`} />
                <Link href="/agenda" className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="text-xs font-semibold text-on-surface font-body truncate hover:text-primary transition-colors">{ret.client}</p>
                  <p className="text-[10px] text-on-surface-variant font-body truncate">{ret.procedure} · {ret.lastDate}</p>
                </Link>
                {ret.phone && (
                  <a href={`https://wa.me/${ret.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-high hover:bg-[#25D366]/15 text-on-surface-variant hover:text-[#25D366] transition-all shrink-0">
                    <Phone className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Aniversariantes */}
        <div className="bg-surface-lowest rounded-2xl shadow-ambient overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/15">
            <h2 className="font-display text-sm font-bold text-on-surface">Próximos aniversariantes</h2>
            <p className="text-[11px] text-on-surface-variant font-body mt-0.5">Próximos 30 dias</p>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {birthdayClients.length === 0 && (
              <p className="px-5 py-6 text-xs text-on-surface-variant font-body text-center">
                Nenhum aniversariante nos próximos 30 dias
              </p>
            )}
            {birthdayClients.map((b) => (
              <div key={b.name} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-low transition-colors group">
                <span className={`text-[11px] font-bold font-display tabular-nums shrink-0 w-10 ${b.isToday ? "text-primary" : "text-on-surface-variant"}`}>
                  {b.birthday}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.isToday ? "bg-primary" : "bg-outline-variant"}`} />
                <p className={`flex-1 text-xs font-body truncate text-on-surface ${b.isToday ? "font-semibold" : "font-medium"}`}>
                  {b.name}
                </p>
                <a
                  href={`https://wa.me/${b.phone}?text=${waMsg(b.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    b.isToday
                      ? "bg-[#25D366]/15 text-[#25D366]"
                      : "opacity-0 group-hover:opacity-100 bg-surface-high text-on-surface-variant hover:bg-[#25D366]/15 hover:text-[#25D366]"
                  }`}
                >
                  <MessageCircle className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-surface-lowest rounded-2xl shadow-ambient overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/15">
            <h2 className="font-display text-sm font-bold text-on-surface">Horários mais movimentados</h2>
            <p className="text-[11px] text-on-surface-variant font-body mt-0.5">Baseado nos agendamentos</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex gap-1 mb-1.5 ml-7">
              {HEAT_DAYS.map((d) => (
                <div key={d} className="flex-1 text-center text-[9px] font-semibold text-on-surface-variant font-body uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {heatData.map((row, hi) => (
                <div key={HEAT_HOURS[hi]} className="flex items-center gap-1">
                  <span className="text-[9px] text-on-surface-variant font-body w-6 shrink-0 text-right">
                    {HEAT_HOURS[hi]}
                  </span>
                  {row.map((val, di) => (
                    <div
                      key={di}
                      title={`${HEAT_DAYS[di]} ${HEAT_HOURS[hi]} — ${val > 0 ? val + " atendimento(s)" : "livre"}`}
                      className={`flex-1 h-4 rounded-sm ${heatColor(val)} transition-opacity hover:opacity-80`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-4 justify-end">
              <span className="text-[9px] text-on-surface-variant font-body">Menos</span>
              {[0,1,2,3,4].map((v) => (
                <div key={v} className={`w-3 h-3 rounded-sm ${heatColor(v)}`} />
              ))}
              <span className="text-[9px] text-on-surface-variant font-body">Mais</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
