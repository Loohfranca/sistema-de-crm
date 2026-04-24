"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Calendar, Clock, CheckCircle2,
  ChevronRight, MessageCircle, Phone, XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  getAgendamentos,
  isoParaBR,
  type Agendamento,
} from "@/lib/store";
import { statusConfig } from "@/lib/agenda-config";
import { AlertasEstoque } from "@/components/dashboard/alertas-estoque";

// ─── Birthday helpers ─────────────────────────────────────────────────────────
function daysFromNow(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}

const birthdayClients = [
  { name: "Marina Silva",    phone: "5511987654321", birthday: daysFromNow(0), isToday: true  },
  { name: "Cláudia Nunes",   phone: "5541998765678", birthday: daysFromNow(1), isToday: false },
  { name: "Fernanda Costa",  phone: "5521998765432", birthday: daysFromNow(3), isToday: false },
  { name: "Ana Beatriz",     phone: "5521987651234", birthday: daysFromNow(5), isToday: false },
];

function waMsg(name: string) {
  const first = name.split(" ")[0];
  return encodeURIComponent(`Olá, ${first}! 🎂 A equipe da Gabelia deseja um feliz aniversário! Que hoje seja especial ✨💖`);
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

  const carregar = useCallback(() => setLista(getAgendamentos()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_agenda_updated", carregar);
    return () => window.removeEventListener("crm_agenda_updated", carregar);
  }, [carregar]);

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

  const [vistaAgenda, setVistaAgenda] = useState<"hoje" | "semana">("hoje");

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

  // Agenda: only pending ("agendado")
  const agendaHoje = lista
    .filter((a) => a.data === hojeISO && a.status === "agendado")
    .sort((a, b) => a.horaInicio - b.horaInicio || a.minutoInicio - b.minutoInicio);

  const agendaSemana = lista
    .filter((a) => a.data >= segISO && a.data <= domISO && a.status === "agendado")
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio - b.horaInicio);

  const agendaAtual = vistaAgenda === "hoje" ? agendaHoje : agendaSemana;

  // Próximos agendamentos futuros (para estado vazio)
  const proximos = lista
    .filter((a) => a.data > hojeISO && a.status === "agendado")
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio - b.horaInicio || a.minutoInicio - b.minutoInicio)
    .slice(0, 3);

  // Histórico: realizados + cancelados (most recent first)
  const recentes = lista
    .filter((a) => a.status === "realizado" || a.status === "cancelado")
    .sort((a, b) => b.data.localeCompare(a.data) || b.horaInicio - a.horaInicio)
    .slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">

      {/* Left column */}
      <div className="flex-1 min-w-0 space-y-4 lg:space-y-6">

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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="bg-surface-lowest rounded-2xl p-5 shadow-ambient hover:shadow-lg hover:scale-[1.02] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-display text-lg font-bold text-on-surface leading-tight">{s.value}</p>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* ── Agenda pendente — seção principal ── */}
        <div className="bg-surface-lowest rounded-2xl shadow-ambient overflow-hidden ring-1 ring-primary/10">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/20 bg-primary-fixed/30">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-sm font-bold text-on-surface">
                {vistaAgenda === "hoje" ? "Agenda de hoje" : "Agenda da semana"}
              </h2>
              <span className="text-[11px] text-on-surface-variant font-body">
                {vistaAgenda === "hoje"
                  ? `${hojeFormatado} · ${agendaAtual.length} pendente${agendaAtual.length !== 1 ? "s" : ""}`
                  : `${isoParaBR(segISO)} – ${isoParaBR(domISO)} · ${agendaAtual.length}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-surface-lowest p-0.5">
                <button
                  onClick={() => setVistaAgenda("hoje")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold font-body transition-all ${
                    vistaAgenda === "hoje"
                      ? "gradient-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setVistaAgenda("semana")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold font-body transition-all ${
                    vistaAgenda === "semana"
                      ? "gradient-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Semana
                </button>
              </div>
              <Link href="/agenda" className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-lowest text-[11px] text-primary font-semibold font-body hover:bg-surface-high transition-colors">
                Ver agenda <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {agendaAtual.length === 0 ? (
            <div>
              <div className="px-5 py-3 flex items-center justify-between border-b border-outline-variant/10">
                <p className="text-xs text-on-surface-variant font-body">Agenda livre {vistaAgenda === "hoje" ? "hoje" : "esta semana"}</p>
                <Link href="/atendimentos/novo" className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold font-body hover:opacity-80 transition-opacity">
                  Agendar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {proximos.length > 0 && (
                <div>
                  <p className="px-5 pt-2.5 pb-1 text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">Próximos</p>
                  <div className="divide-y divide-outline-variant/10">
                    {proximos.map((apt) => (
                      <Link key={apt.id} href="/agenda" className="flex items-center gap-3 px-5 py-2 hover:bg-surface-low transition-colors group">
                        <span className="text-[10px] text-on-surface-variant font-body tabular-nums shrink-0 w-10">
                          {isoParaBR(apt.data).slice(0, 5)}
                        </span>
                        <span className="text-xs font-semibold text-primary font-body tabular-nums shrink-0 w-10">
                          {String(apt.horaInicio).padStart(2,"0")}:{String(apt.minutoInicio).padStart(2,"0")}
                        </span>
                        <p className="flex-1 text-xs font-semibold text-on-surface font-body truncate group-hover:text-primary transition-colors">{apt.cliente}</p>
                        <p className="text-[11px] text-on-surface-variant font-body truncate max-w-[140px] hidden lg:block">{apt.procedimento}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {agendaAtual.slice(0, 3).map((apt) => (
                <Link key={apt.id} href="/agenda" className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-low transition-colors group">
                  {vistaAgenda === "semana" && (
                    <span className="text-[10px] text-on-surface-variant font-body tabular-nums shrink-0 w-10">
                      {isoParaBR(apt.data).slice(0, 5)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-primary font-body tabular-nums shrink-0 w-10">
                    {String(apt.horaInicio).padStart(2,"0")}:{String(apt.minutoInicio).padStart(2,"0")}
                  </span>
                  <p className="flex-1 text-xs font-semibold text-on-surface font-body truncate group-hover:text-primary transition-colors">{apt.cliente}</p>
                  <p className="text-[11px] text-on-surface-variant font-body truncate max-w-[160px] hidden lg:block">{apt.procedimento}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
              {agendaAtual.length > 3 && (
                <Link href="/agenda" className="flex items-center justify-center px-5 py-2 text-[11px] text-primary font-semibold font-body hover:bg-surface-low transition-colors">
                  +{agendaAtual.length - 3} mais <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Histórico recente — seção secundária ── */}
        <div className="bg-surface-lowest/70 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-outline-variant/10">
            <h2 className="font-display text-sm font-bold text-on-surface-variant">Histórico recente</h2>
            <Link href="/atendimentos" className="text-[11px] text-primary font-semibold font-body hover:opacity-80 transition-opacity flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/8">
            {recentes.length === 0 ? (
              <p className="px-6 py-5 text-center text-on-surface-variant text-xs font-body">
                Nenhum atendimento registrado.
              </p>
            ) : (
              recentes.slice(0, 5).map((apt) => {
                const sc = statusConfig[apt.status];
                const StatusIcon = sc.icon;
                return (
                  <Link key={apt.id} href="/agenda" className="flex items-center gap-3 px-6 py-2.5 hover:bg-surface-low transition-colors group">
                    <span className="text-[11px] text-on-surface-variant font-body tabular-nums shrink-0 w-16">{isoParaBR(apt.data)}</span>
                    <p className="flex-1 text-xs font-medium text-on-surface font-body truncate group-hover:text-primary transition-colors">{apt.cliente}</p>
                    <p className="text-[11px] text-on-surface-variant font-body truncate max-w-[140px] hidden lg:block">{apt.procedimento}</p>
                    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold font-body shrink-0 ${sc.cls}`}>
                      <StatusIcon className="w-2.5 h-2.5" />{sc.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right column — vira coluna abaixo do conteúdo principal no mobile */}
      <div className="w-full lg:w-72 lg:shrink-0 space-y-4 lg:overflow-y-auto" style={{ maxHeight: "calc(100vh - 6rem)" }}>

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
            <p className="text-[11px] text-on-surface-variant font-body mt-0.5">Esta semana</p>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {birthdayClients.map((b) => (
              <div key={b.name} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-low transition-colors group">
                <span className={`text-[11px] font-bold font-display tabular-nums shrink-0 w-10 ${b.isToday ? "text-primary" : "text-on-surface-variant"}`}>
                  {b.birthday}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.isToday ? "bg-primary" : "bg-outline-variant"}`} />
                <p className={`flex-1 text-xs font-body truncate ${b.isToday ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
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
