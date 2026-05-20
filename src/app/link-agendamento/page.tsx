"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  AtSign,
  Info,
} from "lucide-react";

export default function LinkAgendamentoPage() {
  const [origin, setOrigin] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/agendar` : "";

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — usuário copia manual */
    }
  }

  const msgWhatsApp = encodeURIComponent(
    `Olá! 💖 Agende seu horário online por aqui: ${link}`,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Agendamento
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Link de Agendamento
        </h1>
        <p className="text-on-surface-variant font-body mt-1">
          Compartilhe este link para suas clientes agendarem sozinhas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Link + ações */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <Share2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Seu link público
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              <button
                onClick={copiar}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold font-body transition-all shrink-0 ${
                  copiado
                    ? "bg-secondary-container text-on-secondary-container"
                    : "gradient-primary text-on-primary hover:opacity-90"
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar link
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-4">
              <a
                href="/agendar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir página
              </a>
              <a
                href={`https://wa.me/?text=${msgWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold font-body bg-[#25D366] text-white hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Compartilhar no WhatsApp
              </a>
            </div>
          </div>

          {/* Onde divulgar */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <h2 className="font-display text-lg font-bold text-on-surface mb-4">
              Onde divulgar
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <AtSign className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-on-surface font-body">
                  Coloque o link na <strong>bio do Instagram</strong>.
                </p>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-on-surface font-body">
                  Envie no <strong>WhatsApp</strong> ou no status.
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Como funciona */}
        <div className="space-y-6">
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <h3 className="font-display text-base font-bold text-on-surface mb-4">
              Como funciona
            </h3>
            <ol className="space-y-3">
              {[
                "A cliente escolhe o serviço",
                "Escolhe o profissional",
                "Escolhe data e horário livre",
                "Confirma com nome e WhatsApp",
              ].map((t, i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full gradient-primary text-on-primary text-[11px] font-bold font-body flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-on-surface-variant font-body">
                    {t}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-on-surface-variant font-body mt-4 pt-4 border-t border-outline-variant/15">
              O agendamento cai direto na sua Agenda com status{" "}
              <strong>agendado</strong>.
            </p>
          </div>

          <div className="bg-surface-low rounded-3xl p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-on-surface-variant" />
              <p className="text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                Importante
              </p>
            </div>
            <p className="text-xs text-on-surface-variant font-body leading-relaxed">
              Esta versão guarda os dados neste navegador. Para receber
              agendamentos de qualquer celular, será necessário conectar o
              sistema a um servidor — funcionalidade prevista para a próxima
              etapa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
