"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, MessageCircle, Gift } from "lucide-react";
import { getClientes, type Cliente } from "@/lib/clientes";
import { gerarLinkWhatsApp } from "@/lib/whatsapp";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  dia: number;
  mes: number;
  estado: "hoje" | "proximo" | "passou";
  dias: number; // dias até (só quando próximo)
}

// ─── Componente ──────────────────────────────────────────────────────────────
export function AniversariosMes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const carregar = () => setClientes(getClientes());
    carregar();
    setMontado(true);
    window.addEventListener("crm_clientes_updated", carregar);
    return () => window.removeEventListener("crm_clientes_updated", carregar);
  }, []);

  const hoje = new Date();
  const mesAtual = hoje.getMonth(); // 0-11
  const diaHoje = hoje.getDate();

  // Aniversariantes do mês corrente
  const lista = useMemo<Aniversariante[]>(() => {
    return clientes
      .map((c) => {
        if (!c.birthDate) return null;
        const [, m, d] = c.birthDate.split("-").map(Number);
        if (!m || !d || m - 1 !== mesAtual) return null;
        const estado: Aniversariante["estado"] =
          d === diaHoje ? "hoje" : d > diaHoje ? "proximo" : "passou";
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          phone: c.phone?.replace(/\D/g, "") ?? "",
          dia: d,
          mes: m,
          estado,
          dias: d - diaHoje,
        };
      })
      .filter((a): a is Aniversariante => a !== null)
      .sort((a, b) => a.dia - b.dia);
  }, [clientes, mesAtual, diaHoje]);

  if (!montado) return null;

  const nomeMes = MESES[mesAtual];

  return (
    <section>
      {/* Título destacado — fora do card */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-sm shrink-0">
          <Cake className="w-5 h-5 text-on-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-on-surface">
            Aniversariantes do mês
          </h2>
          <p className="text-xs text-on-surface-variant font-body mt-0.5 capitalize">
            {nomeMes} ·{" "}
            <span className="text-on-surface font-semibold">
              {lista.length} cliente{lista.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </div>

      {/* Card — só a lista */}
      {lista.length === 0 ? (
        <div className="bg-surface-lowest rounded-3xl shadow-ambient px-6 py-8 text-center">
          <Gift className="w-7 h-7 text-outline mx-auto mb-2" />
          <p className="text-sm font-body text-on-surface-variant">
            Nenhuma aniversariante em {nomeMes}.
          </p>
        </div>
      ) : (
        <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden divide-y divide-outline-variant/10">
          {lista.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 px-6 py-3.5 transition-colors ${
                a.estado === "hoje" ? "bg-primary/5" : "hover:bg-surface-low/50"
              }`}
            >
              <div className="w-10 h-10 shrink-0 rounded-full gradient-primary flex items-center justify-center text-on-primary font-display font-bold text-xs">
                {a.avatar}
              </div>
              <div className="flex-1 min-w-0">
                {/* nome = título do item */}
                <p className="text-sm font-bold text-on-surface font-body truncate">
                  {a.name}
                </p>
                {/* data = texto secundário */}
                <p className="text-[11px] font-body">
                  {a.estado === "hoje" ? (
                    <span className="text-primary font-semibold">
                      🎂 Aniversário hoje!
                    </span>
                  ) : a.estado === "proximo" ? (
                    <span className="text-on-surface-variant">
                      Dia {String(a.dia).padStart(2, "0")}/
                      {String(a.mes).padStart(2, "0")} · em {a.dias} dia
                      {a.dias !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">
                      Dia {String(a.dia).padStart(2, "0")}/
                      {String(a.mes).padStart(2, "0")}
                    </span>
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
    </section>
  );
}
