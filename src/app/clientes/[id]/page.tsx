"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Phone, Mail, MapPin, AlertTriangle, Heart,
  Clock, Sparkles, Star, Diamond, Crown, Pencil, Trash2,
  CheckCircle2, CalendarClock, RotateCcw, XCircle, Wallet,
  TrendingUp, Repeat, UserRound,
} from "lucide-react";
import { GaleriaFotos } from "@/components/clientes/galeria-fotos";
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal";
import { ConfirmarExclusao } from "@/components/clientes/confirmar-exclusao";
import { AnamneseCard } from "@/components/clientes/anamnese-card";
import {
  getClientePorId, atualizarCliente, excluirCliente, type Cliente,
} from "@/lib/clientes";
import { getAgendamentos, isoParaBR, type Agendamento } from "@/lib/store";
import { statusConfig } from "@/lib/agenda-config";

function tierInfo(tier: string) {
  switch (tier) {
    case "diamond":
      return { label: "Paciente Diamante", Icon: Diamond, cls: "bg-primary-container text-on-primary-container" };
    case "gold":
      return { label: "Paciente Ouro", Icon: Crown, cls: "bg-secondary-container text-on-secondary-container" };
    default:
      return { label: "Paciente Prata", Icon: Star, cls: "bg-surface-highest text-on-surface-variant" };
  }
}

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const age = new Date(diffMs).getUTCFullYear() - 1970;
  return age >= 0 ? age : null;
}

function formatBirthDate(birthDate: string): string {
  if (!birthDate) return "—";
  const [y, m, d] = birthDate.split("-");
  if (!y || !m || !d) return birthDate;
  return `${d}/${m}/${y}`;
}

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = String(params?.id ?? "");

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [editar, setEditar] = useState(false);
  const [excluir, setExcluir] = useState(false);

  useEffect(() => {
    setCliente(getClientePorId(clienteId) ?? null);
    setAgendamentos(getAgendamentos());
    const syncCliente = () => setCliente(getClientePorId(clienteId) ?? null);
    const syncAgenda = () => setAgendamentos(getAgendamentos());
    window.addEventListener("crm_clientes_updated", syncCliente);
    window.addEventListener("crm_agenda_updated", syncAgenda);
    return () => {
      window.removeEventListener("crm_clientes_updated", syncCliente);
      window.removeEventListener("crm_agenda_updated", syncAgenda);
    };
  }, [clienteId]);

  // Atendimentos da cliente — match por nome (não há FK ainda)
  const meusAtendimentos = useMemo(() => {
    if (!cliente) return [];
    const alvo = cliente.name.trim().toLowerCase();
    return agendamentos
      .filter((a) => a.cliente.trim().toLowerCase() === alvo)
      .sort((a, b) => b.data.localeCompare(a.data) || b.horaInicio - a.horaInicio);
  }, [cliente, agendamentos]);

  const realizados = meusAtendimentos.filter((a) => a.status === "realizado");
  const proximoApt = meusAtendimentos
    .filter((a) => a.status === "agendado" && a.data >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio - b.horaInicio)[0];

  const ultimaVisitaDerivada = realizados[0]?.data
    ? isoParaBR(realizados[0].data)
    : cliente?.lastVisit && cliente.lastVisit !== "-"
    ? cliente.lastVisit
    : null;

  const tierDerivado =
    realizados.length >= 30 ? "diamond" :
    realizados.length >= 10 ? "gold" :
    cliente?.tier || "silver";

  const idade = cliente ? calcAge(cliente.birthDate) : null;

  // Estatísticas de agendamentos da cliente
  const stats = useMemo(() => {
    const realiz = meusAtendimentos.filter((a) => a.status === "realizado");
    const cancelados = meusAtendimentos.filter(
      (a) => a.status === "cancelado",
    ).length;
    const remarcacoes = meusAtendimentos.reduce(
      (s, a) => s + (a.remarcacoes?.length ?? 0),
      0,
    );
    const hoje = new Date().toISOString().slice(0, 10);
    const futuros = meusAtendimentos.filter(
      (a) => a.status === "agendado" && a.data >= hoje,
    ).length;
    const valorTotal = realiz.reduce((s, a) => s + (a.valor || 0), 0);
    const ticket = realiz.length ? valorTotal / realiz.length : 0;

    // Frequência média — dias entre procedimentos realizados
    const datas = realiz.map((a) => a.data).sort();
    let freq = 0;
    if (datas.length >= 2) {
      let soma = 0;
      for (let i = 1; i < datas.length; i++) {
        const d1 = new Date(datas[i - 1] + "T12:00:00").getTime();
        const d2 = new Date(datas[i] + "T12:00:00").getTime();
        soma += (d2 - d1) / 86400000;
      }
      freq = Math.round(soma / (datas.length - 1));
    }

    const topDe = (vals: string[]): string => {
      const conta = new Map<string, number>();
      for (const v of vals) if (v) conta.set(v, (conta.get(v) ?? 0) + 1);
      return [...conta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    };

    return {
      realizados: realiz.length,
      cancelados,
      remarcacoes,
      futuros,
      valorTotal,
      ticket,
      freq,
      servicoTop: topDe(realiz.map((a) => a.procedimento)),
      profissionalTop: topDe(meusAtendimentos.map((a) => a.profissional)),
    };
  }, [meusAtendimentos]);

  if (!cliente) {
    return (
      <div className="space-y-6">
        <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-on-surface-variant font-body hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar para clientes
        </Link>
        <div className="bg-surface-lowest rounded-3xl p-10 text-center shadow-ambient">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-high flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-on-surface-variant" />
          </div>
          <p className="font-display text-lg font-bold text-on-surface">Cliente não encontrada</p>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            A ficha pode ter sido removida ou o link está desatualizado.
          </p>
        </div>
      </div>
    );
  }

  const tier = tierInfo(tierDerivado);
  const TierIcon = tier.Icon;

  function handleEditarSave(updated: Cliente) {
    const { id, ...rest } = updated;
    atualizarCliente(id, rest);
    setCliente(getClientePorId(id) ?? null);
    setEditar(false);
  }

  function handleExcluirConfirm() {
    excluirCliente(cliente!.id);
    setExcluir(false);
    router.push("/clientes");
  }

  return (
    <div className="space-y-8">
      {editar && (
        <ClienteFormModal
          mode="edit"
          initial={cliente}
          onClose={() => setEditar(false)}
          onSave={handleEditarSave}
        />
      )}
      {excluir && (
        <ConfirmarExclusao
          clienteName={cliente.name}
          onCancel={() => setExcluir(false)}
          onConfirm={handleExcluirConfirm}
        />
      )}

      {/* Header */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant font-body hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />Voltar para clientes
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-on-primary font-display leading-none tracking-tight">{cliente.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                  {cliente.name}
                </h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${tier.cls}`}>
                  <TierIcon className="w-3 h-3" />{tier.label}
                </span>
              </div>
              <p className="text-on-surface-variant font-body mt-1">
                {idade !== null ? `${idade} anos` : "Idade não informada"}
                {ultimaVisitaDerivada && ` • Última visita: ${ultimaVisitaDerivada}`}
              </p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {cliente.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-on-surface-variant font-body">
                    <Phone className="w-3.5 h-3.5" />{cliente.phone}
                  </span>
                )}
                {cliente.email && (
                  <span className="flex items-center gap-1.5 text-sm text-on-surface-variant font-body">
                    <Mail className="w-3.5 h-3.5" />{cliente.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditar(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-lowest text-on-surface text-sm font-medium font-body ghost-border hover:bg-surface-high transition-colors"
            >
              <Pencil className="w-4 h-4" />Editar
            </button>
            <button
              onClick={() => setExcluir(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-error-container/60 text-on-error-container text-sm font-medium font-body hover:bg-error-container transition-colors"
            >
              <Trash2 className="w-4 h-4" />Excluir
            </button>
            <Link
              href="/atendimentos/novo"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity"
            >
              <Calendar className="w-4 h-4" />Agendar
            </Link>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icone={<CheckCircle2 className="w-4 h-4" />}
            rotulo="Realizados"
            valor={String(stats.realizados)}
          />
          <StatCard
            icone={<CalendarClock className="w-4 h-4" />}
            rotulo="Agendados"
            valor={String(stats.futuros)}
          />
          <StatCard
            icone={<RotateCcw className="w-4 h-4" />}
            rotulo="Remarcações"
            valor={String(stats.remarcacoes)}
          />
          <StatCard
            icone={<XCircle className="w-4 h-4" />}
            rotulo="Cancelados"
            valor={String(stats.cancelados)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icone={<Wallet className="w-4 h-4" />}
            rotulo="Total gasto"
            valor={brl(stats.valorTotal)}
            destaque
          />
          <StatCard
            icone={<TrendingUp className="w-4 h-4" />}
            rotulo="Ticket médio"
            valor={brl(stats.ticket)}
            destaque
          />
          <StatCard
            icone={<Repeat className="w-4 h-4" />}
            rotulo="Frequência média"
            valor={stats.freq ? `${stats.freq} dias` : "—"}
            destaque
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatWide
            icone={<Sparkles className="w-5 h-5" />}
            rotulo="Serviço mais realizado"
            valor={stats.servicoTop}
          />
          <StatWide
            icone={<UserRound className="w-5 h-5" />}
            rotulo="Profissional preferido"
            valor={stats.profissionalTop}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histórico — 2 cols */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-3xl p-6 shadow-ambient">
          <h2 className="font-display text-lg font-bold text-on-surface mb-1">
            Histórico de Tratamentos
          </h2>
          <p className="text-sm text-on-surface-variant font-body mb-6">
            {meusAtendimentos.length} atendimento
            {meusAtendimentos.length !== 1 ? "s" : ""}
            {stats.valorTotal > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-on-surface">
                  {brl(stats.valorTotal)}
                </span>{" "}
                em procedimentos realizados
              </>
            )}
          </p>

          {meusAtendimentos.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-high flex items-center justify-center">
                <Clock className="w-5 h-5 text-on-surface-variant" />
              </div>
              <p className="text-sm font-semibold text-on-surface font-body">Sem atendimentos ainda</p>
              <p className="text-xs text-on-surface-variant font-body mt-1 mb-4">
                Os procedimentos agendados ou realizados aparecerão aqui.
              </p>
              <Link
                href="/atendimentos/novo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-primary text-on-primary text-xs font-semibold font-body hover:opacity-90 transition-opacity"
              >
                <Calendar className="w-3.5 h-3.5" />Agendar primeiro
              </Link>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant/20" />
              <div className="space-y-6">
                {meusAtendimentos.map((apt) => {
                  const sc = statusConfig[apt.status];
                  const StatusIcon = sc.icon;
                  return (
                    <div key={apt.id} className="relative flex gap-4 pl-10">
                      <div className={`absolute left-3.5 top-1 w-3 h-3 rounded-full ring-4 ${
                        apt.status === "realizado" ? "bg-secondary ring-secondary-container" :
                        apt.status === "cancelado" ? "bg-error ring-error-container" :
                        "bg-primary ring-primary-fixed"
                      }`} />
                      <div className="flex-1 p-4 rounded-2xl bg-surface-low">
                        <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface font-body">
                              {apt.procedimento}
                            </p>
                            <p className="text-xs text-on-surface-variant font-body mt-0.5">
                              {apt.profissional} • {isoParaBR(apt.data)} às{" "}
                              {String(apt.horaInicio).padStart(2, "0")}:
                              {String(apt.minutoInicio).padStart(2, "0")} •{" "}
                              {apt.duracao} min
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-primary font-display">
                              {brl(apt.valor)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body ${sc.cls}`}>
                              <StatusIcon className="w-2.5 h-2.5" />{sc.label}
                            </span>
                          </div>
                        </div>
                        {apt.observacoes && (
                          <p className="text-xs text-outline font-body mt-2">{apt.observacoes}</p>
                        )}
                        {apt.remarcacoes && apt.remarcacoes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-outline-variant/15 space-y-1.5">
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">
                              Remarcado {apt.remarcacoes.length}x
                            </p>
                            {apt.remarcacoes.map((r, i) => (
                              <div key={i} className="text-[11px] text-on-surface-variant font-body border-l-2 border-primary/30 pl-2">
                                <p>
                                  <span className="line-through opacity-60">{isoParaBR(r.deData)} {r.deHora}</span>
                                  {" → "}
                                  <span className="font-semibold text-on-surface">{isoParaBR(r.paraData)} {r.paraHora}</span>
                                </p>
                                {r.motivo && <p className="opacity-80 mt-0.5">Motivo: {r.motivo}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <GaleriaFotos clienteId={clienteId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {proximoApt && (
            <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
              <h3 className="font-display text-base font-bold text-on-surface mb-4">
                Próximo Agendamento
              </h3>
              <div className="p-4 rounded-2xl gradient-primary text-on-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-semibold font-body">{isoParaBR(proximoApt.data)}</span>
                  <span className="text-sm font-body opacity-80">
                    às {String(proximoApt.horaInicio).padStart(2, "0")}:{String(proximoApt.minutoInicio).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-sm font-body opacity-90">{proximoApt.procedimento}</p>
              </div>
            </div>
          )}

          <AnamneseCard clienteId={clienteId} clienteNome={cliente.name} />

          {cliente.allergies.length > 0 && (
            <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-error" />
                <h3 className="font-display text-base font-bold text-on-surface">
                  Alergias Documentadas
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {cliente.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container font-body"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cliente.preferences.length > 0 && (
            <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="font-display text-base font-bold text-on-surface">Preferências</h3>
              </div>
              <div className="space-y-2">
                {cliente.preferences.map((pref) => (
                  <div
                    key={pref}
                    className="px-4 py-2.5 rounded-2xl bg-surface-low text-sm text-on-surface-variant font-body"
                  >
                    {pref}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <h3 className="font-display text-base font-bold text-on-surface mb-4">
              Informações de Contato
            </h3>
            <div className="space-y-3">
              {cliente.phone && (
                <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                  <Phone className="w-4 h-4" />{cliente.phone}
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                  <Mail className="w-4 h-4" />{cliente.email}
                </div>
              )}
              {cliente.address && (
                <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                  <MapPin className="w-4 h-4" />{cliente.address}
                </div>
              )}
              {cliente.birthDate && (
                <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                  <Calendar className="w-4 h-4" />{formatBirthDate(cliente.birthDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cards de estatística ────────────────────────────────────────────────────
function StatCard({
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
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icone}
        </div>
        <span className="text-xs text-on-surface-variant font-body">{rotulo}</span>
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

function StatWide({
  icone,
  rotulo,
  valor,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icone}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-on-surface-variant font-body">{rotulo}</p>
          <p className="font-display text-lg font-bold text-on-surface truncate">
            {valor}
          </p>
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full gradient-primary" />
    </div>
  );
}
