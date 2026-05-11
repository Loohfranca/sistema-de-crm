"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Phone, Mail, MapPin, AlertTriangle, Heart,
  Clock, Sparkles, Star, Diamond, Crown, Pencil, Trash2,
} from "lucide-react";
import { GaleriaFotos } from "@/components/clientes/galeria-fotos";
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal";
import { ConfirmarExclusao } from "@/components/clientes/confirmar-exclusao";
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
            <div className="w-20 h-20 rounded-3xl bg-primary-fixed-dim flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-on-primary-fixed font-display">{cliente.avatar}</span>
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-fixed rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-on-primary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">{realizados.length}</p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">Procedimentos realizados</p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-secondary-fixed rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-on-secondary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">{meusAtendimentos.length}</p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">Total de atendimentos</p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-2xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-on-tertiary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">
            {ultimaVisitaDerivada ?? "—"}
          </p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">Última visita</p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-container rounded-2xl flex items-center justify-center">
              <Star className="w-5 h-5 text-on-primary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface capitalize">
            {tierDerivado === "diamond" ? "Diamante" : tierDerivado === "gold" ? "Ouro" : "Prata"}
          </p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">Categoria</p>
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
            Todos os procedimentos {meusAtendimentos.length > 0 && `(${meusAtendimentos.length})`}
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
                          <p className="text-sm font-medium text-on-surface font-body">{apt.procedimento}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body ${sc.cls}`}>
                            <StatusIcon className="w-2.5 h-2.5" />{sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-body">
                          {apt.profissional} • {isoParaBR(apt.data)} às{" "}
                          {String(apt.horaInicio).padStart(2, "0")}:{String(apt.minutoInicio).padStart(2, "0")}
                        </p>
                        {apt.observacoes && (
                          <p className="text-xs text-outline font-body mt-2">{apt.observacoes}</p>
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
