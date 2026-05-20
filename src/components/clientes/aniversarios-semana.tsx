"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, MessageCircle, Gift } from "lucide-react";
import { getClientes, type Cliente } from "@/lib/clientes";
import { gerarLinkWhatsApp } from "@/lib/whatsapp";

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Dias até o próximo aniversário (0 = hoje). null se data inválida.
function diasAteAniversario(birthDate: string): number | null {
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

function dataCurta(birthDate: string): string {
  const [, m, d] = birthDate.split("-");
  return `${d}/${m}`;
}

function getClinicaNome(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("crm_clinica");
    if (!raw) return "";
    return (JSON.parse(raw) as { nome?: string }).nome ?? "";
  } catch {
    return "";
  }
}

function mensagemParabens(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? nome;
  const clinica = getClinicaNome();
  const assinatura = clinica ? `\n\nCom carinho, ${clinica} ✨` : "";
  return `Olá, ${primeiro}! 🎂 Passando para desejar um feliz aniversário! Que seu dia seja lindo e cheio de alegria. 💖${assinatura}`;
}

interface Aniversariante {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  data: string;
  dias: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────
export function AniversariosSemana() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const carregar = () => setClientes(getClientes());
    carregar();
    setMontado(true);
    window.addEventListener("crm_clientes_updated", carregar);
    return () => window.removeEventListener("crm_clientes_updated", carregar);
  }, []);

  // Aniversariantes nos próximos 7 dias (incluindo hoje)
  const lista = useMemo<Aniversariante[]>(() => {
    return clientes
      .map((c) => {
        const dias = diasAteAniversario(c.birthDate);
        if (dias === null || dias > 7) return null;
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          phone: c.phone?.replace(/\D/g, "") ?? "",
          data: dataCurta(c.birthDate),
          dias,
        };
      })
      .filter((a): a is Aniversariante => a !== null)
      .sort((a, b) => a.dias - b.dias);
  }, [clientes]);

  if (!montado) return null;

  return (
    <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between gap-3 bg-primary-fixed/30 border-b border-outline-variant/15">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Cake className="w-4 h-4 text-on-primary" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">
              Aniversários da semana
            </h2>
            <p className="text-[11px] text-on-surface-variant font-body">
              {lista.length === 0
                ? "Próximos 7 dias"
                : `${lista.length} cliente${lista.length !== 1 ? "s" : ""} nos próximos 7 dias`}
            </p>
          </div>
        </div>
        <span className="shrink-0 font-display text-2xl font-bold text-primary tabular-nums">
          {lista.length}
        </span>
      </div>

      {lista.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Gift className="w-7 h-7 text-outline mx-auto mb-2" />
          <p className="text-sm font-body text-on-surface-variant">
            Nenhuma aniversariante nesta semana.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/10">
          {lista.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                a.dias === 0 ? "bg-primary/5" : "hover:bg-surface-low/50"
              }`}
            >
              <div className="w-9 h-9 shrink-0 rounded-full gradient-primary flex items-center justify-center text-on-primary font-display font-bold text-[11px]">
                {a.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface font-body truncate">
                  {a.name}
                </p>
                <p className="text-[11px] text-on-surface-variant font-body">
                  {a.dias === 0 ? (
                    <span className="text-primary font-semibold">
                      🎂 Aniversário hoje!
                    </span>
                  ) : (
                    <>
                      {a.data} · em {a.dias} dia{a.dias !== 1 ? "s" : ""}
                    </>
                  )}
                </p>
              </div>
              {a.phone ? (
                <a
                  href={gerarLinkWhatsApp(a.phone, mensagemParabens(a.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold font-body bg-[#25D366] text-white hover:opacity-90 shadow-sm transition-all"
                  title="Enviar parabéns pelo WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                  Parabenizar
                </a>
              ) : (
                <span className="shrink-0 text-[10px] text-outline font-body italic">
                  sem telefone
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
