"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Bell, BellOff, MessageCircle, Clock, Check } from "lucide-react";
import { getAgendamentos, type Agendamento } from "@/lib/store";
import {
  getTemplateLembrete,
  renderMensagem,
  gerarLinkWhatsApp,
} from "@/lib/whatsapp";

const ENVIADOS_KEY = "crm_lembretes_enviados_v1";
const NOTIF_PREF_KEY = "crm_notif_lembretes_v1";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function chaveLembrete(apt: Agendamento): string {
  return `${apt.data}-${apt.id}`;
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

function marcarEnviado(chave: string) {
  const set = getEnviados();
  set.add(chave);
  localStorage.setItem(ENVIADOS_KEY, JSON.stringify([...set]));
}

function minutosAteAgendamento(apt: Agendamento): number {
  const agora = new Date();
  const alvo = new Date(apt.data + "T00:00:00");
  alvo.setHours(apt.horaInicio, apt.minutoInicio, 0, 0);
  return Math.floor((alvo.getTime() - agora.getTime()) / 60000);
}

function formatarHora(apt: Agendamento): string {
  return `${String(apt.horaInicio).padStart(2, "0")}:${String(apt.minutoInicio).padStart(2, "0")}`;
}

// ─── Hook de notificação desktop ─────────────────────────────────────────────
function useNotificacoesDesktop(proximos: Agendamento[]) {
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

  // Agenda notificações 1h antes pra cada upcoming (enquanto a aba estiver aberta)
  useEffect(() => {
    if (!permitido || !habilitado) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const apt of proximos) {
      const minutos = minutosAteAgendamento(apt);
      // Dispara 1h (60min) antes — só se ainda faltar mais que isso
      const minutosAteDisparo = minutos - 60;
      if (minutosAteDisparo > 0 && minutosAteDisparo <= 180) {
        const t = setTimeout(() => {
          new Notification(`Atendimento em 1 hora — ${apt.cliente}`, {
            body: `${formatarHora(apt)} · ${apt.procedimento}`,
            tag: chaveLembrete(apt),
            icon: "/favicon.ico",
          });
        }, minutosAteDisparo * 60 * 1000);
        timers.push(t);
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [proximos, permitido, habilitado]);

  return { permitido, habilitado, solicitarPermissao, desativar };
}

// ─── Componente principal ───────────────────────────────────────────────────
export function LembretesProximos() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const carregar = () => {
      setLista(getAgendamentos());
      setEnviados(getEnviados());
    };
    carregar();
    window.addEventListener("crm_agenda_updated", carregar);
    // refresh "agora" a cada minuto pra reavaliar janela de 2h
    const tick = setInterval(() => setAgora(Date.now()), 60000);
    return () => {
      window.removeEventListener("crm_agenda_updated", carregar);
      clearInterval(tick);
    };
  }, []);

  // Agendamentos nos próximos 120 minutos (não passou ainda, status agendado)
  const proximos = useMemo(() => {
    void agora; // dependência pra recalcular a cada minuto
    return lista
      .filter((a) => a.status === "agendado")
      .filter((a) => {
        const min = minutosAteAgendamento(a);
        return min > 0 && min <= 120;
      })
      .sort(
        (a, b) =>
          a.horaInicio - b.horaInicio || a.minutoInicio - b.minutoInicio,
      );
  }, [lista, agora]);

  const { permitido, habilitado, solicitarPermissao, desativar } =
    useNotificacoesDesktop(proximos);

  if (proximos.length === 0) return null;

  function abrirLembrete(apt: Agendamento) {
    if (!apt.telefone) return;
    const ctx = {
      cliente: apt.cliente,
      dataISO: apt.data,
      horaInicio: apt.horaInicio,
      minutoInicio: apt.minutoInicio,
      procedimento: apt.procedimento,
      duracao: apt.duracao,
      profissional: apt.profissional,
    };
    const msg = renderMensagem(getTemplateLembrete(), ctx);
    const link = gerarLinkWhatsApp(apt.telefone, msg);
    window.open(link, "_blank", "noopener,noreferrer");
    marcarEnviado(chaveLembrete(apt));
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
              Lembretes próximos
            </h3>
            <p className="text-[11px] text-on-surface-variant font-body">
              {proximos.length} atendimento{proximos.length !== 1 ? "s" : ""}{" "}
              nas próximas 2 horas
            </p>
          </div>
        </div>
        {!permitido ? (
          <button
            onClick={solicitarPermissao}
            className="text-[11px] font-semibold text-primary font-body hover:opacity-80 transition-opacity inline-flex items-center gap-1"
            title="Receber notificação no desktop 1h antes"
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
        {proximos.map((apt) => {
          const enviado = enviados.has(chaveLembrete(apt));
          const minutos = minutosAteAgendamento(apt);
          const faltam =
            minutos < 60
              ? `em ${minutos} min`
              : `em ${Math.floor(minutos / 60)}h${minutos % 60 ? ` ${minutos % 60}min` : ""}`;
          return (
            <div
              key={apt.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-surface-low/40 transition-colors"
            >
              <div className="w-9 h-9 shrink-0 rounded-full gradient-primary flex items-center justify-center text-on-primary font-display font-bold text-[11px]">
                {apt.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface font-body truncate">
                  {apt.cliente}
                </p>
                <p className="text-[11px] text-on-surface-variant font-body truncate">
                  {apt.procedimento}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-on-surface font-body tabular-nums inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  {formatarHora(apt)}
                </p>
                <p className="text-[10px] text-on-surface-variant font-body">
                  {faltam}
                </p>
              </div>
              {apt.telefone ? (
                <button
                  onClick={() => abrirLembrete(apt)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold font-body transition-all ${
                    enviado
                      ? "bg-surface-high text-on-surface-variant"
                      : "bg-[#25D366] text-white hover:opacity-90 shadow-sm"
                  }`}
                  title={enviado ? "Já enviado — reenviar" : "Enviar lembrete pelo WhatsApp"}
                >
                  {enviado ? (
                    <>
                      <Check className="w-3 h-3" />
                      Enviado
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-3 h-3" />
                      Lembrar
                    </>
                  )}
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
