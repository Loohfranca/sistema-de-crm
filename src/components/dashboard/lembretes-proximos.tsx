"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Bell, BellOff, MessageCircle, Clock } from "lucide-react";
import { getAgendamentos, type Agendamento } from "@/lib/store";
import { renderMensagem, gerarLinkWhatsApp } from "@/lib/whatsapp";
import {
  getRegras,
  offsetMinutos,
  descricaoQuando,
  LEMBRETES_EVENT,
  type RegraLembrete,
} from "@/lib/lembretes";

const ENVIADOS_KEY = "crm_lembretes_enviados_v2";
const NOTIF_PREF_KEY = "crm_notif_lembretes_v1";

// ─── Tipos internos ──────────────────────────────────────────────────────────
interface Pendente {
  apt: Agendamento;
  regra: RegraLembrete;
  chave: string;
  envioEm: number; // timestamp do momento ideal de envio
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function aptInicioMs(apt: Agendamento): number {
  const d = new Date(apt.data + "T00:00:00");
  d.setHours(apt.horaInicio, apt.minutoInicio, 0, 0);
  return d.getTime();
}

function chave(apt: Agendamento, regra: RegraLembrete): string {
  return `${apt.data}-${apt.id}-${regra.id}`;
}

function formatarHora(apt: Agendamento): string {
  return `${String(apt.horaInicio).padStart(2, "0")}:${String(apt.minutoInicio).padStart(2, "0")}`;
}

function getEnviados(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ENVIADOS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function marcarEnviado(c: string) {
  const set = getEnviados();
  set.add(c);
  localStorage.setItem(ENVIADOS_KEY, JSON.stringify([...set]));
}

// "em 2h 15min", "em 40 min", "enviar agora"
function descreverPrazo(minutos: number): string {
  if (minutos <= 0) return "enviar agora";
  if (minutos < 60) return `em ${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h < 24) return `em ${h}h${m ? ` ${m}min` : ""}`;
  const d = Math.floor(h / 24);
  return `em ${d} dia${d !== 1 ? "s" : ""}`;
}

// ─── Hook de notificação desktop ─────────────────────────────────────────────
function useNotificacoesDesktop(proximos: Pendente[]) {
  const [permitido, setPermitido] = useState(false);
  const [habilitado, setHabilitado] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermitido(Notification.permission === "granted");
    setHabilitado(localStorage.getItem(NOTIF_PREF_KEY) === "1");
  }, []);

  const solicitarPermissao = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    const ok = result === "granted";
    setPermitido(ok);
    if (ok) {
      localStorage.setItem(NOTIF_PREF_KEY, "1");
      setHabilitado(true);
    }
  }, []);

  const desativar = useCallback(() => {
    localStorage.setItem(NOTIF_PREF_KEY, "0");
    setHabilitado(false);
  }, []);

  // Dispara notificação no momento de envio de cada lembrete que vença
  // dentro das próximas 3h (enquanto a aba estiver aberta).
  useEffect(() => {
    if (!permitido || !habilitado) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const agora = Date.now();

    for (const p of proximos) {
      const delay = p.envioEm - agora;
      if (delay > 0 && delay <= 3 * 60 * 60 * 1000) {
        const t = setTimeout(() => {
          new Notification(`Lembrete: ${p.apt.cliente}`, {
            body: `${p.regra.nome} · ${p.apt.procedimento} ${formatarHora(p.apt)}`,
            tag: p.chave,
            icon: "/favicon.ico",
          });
        }, delay);
        timers.push(t);
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [proximos, permitido, habilitado]);

  return { permitido, habilitado, solicitarPermissao, desativar };
}

// ─── Componente principal ────────────────────────────────────────────────────
export function LembretesProximos() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [regras, setRegras] = useState<RegraLembrete[]>([]);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const carregar = () => {
      setLista(getAgendamentos());
      setRegras(getRegras());
      setEnviados(getEnviados());
    };
    carregar();
    window.addEventListener("crm_agenda_updated", carregar);
    window.addEventListener(LEMBRETES_EVENT, carregar);
    // reavalia janelas de tempo a cada minuto
    const tick = setInterval(() => setAgora(Date.now()), 60000);
    return () => {
      window.removeEventListener("crm_agenda_updated", carregar);
      window.removeEventListener(LEMBRETES_EVENT, carregar);
      clearInterval(tick);
    };
  }, []);

  // Lembretes pendentes: para cada regra ativa × agendamento, calcula o
  // momento de envio e decide se já deve aparecer no painel.
  const { pendentes, agendaveis } = useMemo(() => {
    const now = agora;
    const pend: Pendente[] = [];
    const agend: Pendente[] = [];

    for (const regra of regras) {
      if (!regra.ativo) continue;
      const offMs = offsetMinutos(regra) * 60000;

      for (const apt of lista) {
        const inicio = aptInicioMs(apt);
        const envioEm = inicio - offMs;
        const c = chave(apt, regra);
        if (enviados.has(c)) continue;
        const item: Pendente = { apt, regra, chave: c, envioEm };

        if (regra.quando === "antes") {
          if (apt.status !== "agendado") continue;
          if (inicio <= now) continue; // atendimento já passou
          // pendente: até 1h antes do momento de envio
          if (envioEm - now <= 60 * 60000) pend.push(item);
          else agend.push(item); // futuro — só para agendar notificação
        } else {
          if (apt.status !== "realizado") continue;
          // pendente: do momento de envio até 48h depois
          if (now >= envioEm && now <= envioEm + 48 * 3600000) pend.push(item);
          else if (envioEm > now) agend.push(item);
        }
      }
    }

    pend.sort((a, b) => a.envioEm - b.envioEm);
    return { pendentes: pend, agendaveis: [...pend, ...agend] };
  }, [lista, regras, enviados, agora]);

  const { permitido, habilitado, solicitarPermissao, desativar } =
    useNotificacoesDesktop(agendaveis);

  if (pendentes.length === 0) return null;

  function abrirLembrete(p: Pendente) {
    if (!p.apt.telefone) return;
    const ctx = {
      cliente: p.apt.cliente,
      dataISO: p.apt.data,
      horaInicio: p.apt.horaInicio,
      minutoInicio: p.apt.minutoInicio,
      procedimento: p.apt.procedimento,
      duracao: p.apt.duracao,
      profissional: p.apt.profissional,
    };
    const msg = renderMensagem(p.regra.mensagem, ctx);
    const link = gerarLinkWhatsApp(p.apt.telefone, msg);
    window.open(link, "_blank", "noopener,noreferrer");
    marcarEnviado(p.chave);
    setEnviados(getEnviados());
  }

  return (
    <div className="bg-surface-lowest rounded-3xl shadow-ambient ring-1 ring-primary/15 overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between gap-3 bg-primary-fixed/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Bell className="w-4 h-4 text-on-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-on-surface">
              Lembretes pendentes
            </h3>
            <p className="text-[11px] text-on-surface-variant font-body">
              {pendentes.length} lembrete{pendentes.length !== 1 ? "s" : ""}{" "}
              para enviar
            </p>
          </div>
        </div>
        {!permitido ? (
          <button
            onClick={solicitarPermissao}
            className="text-[11px] font-semibold text-primary font-body hover:opacity-80 transition-opacity inline-flex items-center gap-1"
            title="Receber aviso no desktop na hora de cada lembrete"
          >
            <Bell className="w-3 h-3" />
            Ativar avisos
          </button>
        ) : habilitado ? (
          <button
            onClick={desativar}
            className="text-[11px] font-semibold text-on-surface-variant font-body hover:text-on-surface transition-colors inline-flex items-center gap-1"
            title="Desativar notificações"
          >
            <BellOff className="w-3 h-3" />
            Avisos ativos
          </button>
        ) : (
          <button
            onClick={solicitarPermissao}
            className="text-[11px] font-semibold text-primary font-body hover:opacity-80 transition-opacity inline-flex items-center gap-1"
          >
            <Bell className="w-3 h-3" />
            Reativar
          </button>
        )}
      </div>

      <div className="divide-y divide-outline-variant/10">
        {pendentes.map((p) => {
          const minutos = Math.floor((p.envioEm - agora) / 60000);
          return (
            <div
              key={p.chave}
              className="flex items-center gap-3 px-5 py-3 hover:bg-surface-low/40 transition-colors"
            >
              <div className="w-9 h-9 shrink-0 rounded-full gradient-primary flex items-center justify-center text-on-primary font-display font-bold text-[11px]">
                {p.apt.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface font-body truncate">
                  {p.apt.cliente}
                </p>
                <p className="text-[11px] text-on-surface-variant font-body truncate">
                  {p.apt.procedimento}
                </p>
                <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold font-body bg-primary/10 text-primary uppercase tracking-wider">
                  {p.regra.nome} · {descricaoQuando(p.regra)}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-on-surface font-body tabular-nums inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  {formatarHora(p.apt)}
                </p>
                <p
                  className={`text-[10px] font-body ${
                    minutos <= 0
                      ? "text-primary font-semibold"
                      : "text-on-surface-variant"
                  }`}
                >
                  {descreverPrazo(minutos)}
                </p>
              </div>
              {p.apt.telefone ? (
                <button
                  onClick={() => abrirLembrete(p)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold font-body bg-[#25D366] text-white hover:opacity-90 shadow-sm transition-all"
                  title="Enviar lembrete pelo WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                  Lembrar
                </button>
              ) : (
                <span className="shrink-0 text-[10px] text-outline font-body italic">
                  sem telefone
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
