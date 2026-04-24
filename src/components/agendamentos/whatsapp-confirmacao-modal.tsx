"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, MessageCircle, X, Phone } from "lucide-react";
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
} from "@/lib/motion";
import {
  gerarLinkWhatsApp,
  getTemplateConfirmacao,
  renderMensagem,
  type ContextoMensagem,
} from "@/lib/whatsapp";

export function WhatsAppConfirmacaoModal({
  contexto,
  telefoneInicial,
  onPular,
  onEnviado,
}: {
  contexto: ContextoMensagem;
  telefoneInicial?: string;
  onPular: () => void;
  onEnviado: () => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [telefone, setTelefone] = useState(telefoneInicial ?? "");

  useEffect(() => {
    const template = getTemplateConfirmacao();
    setMensagem(renderMensagem(template, contexto));
  }, [contexto]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onPular();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onPular]);

  function enviar() {
    if (!telefone) return;
    const url = gerarLinkWhatsApp(telefone, mensagem);
    window.open(url, "_blank");
    onEnviado();
  }

  const podeEnviar = telefone.replace(/\D/g, "").length >= 10;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onPular}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={backdropTransition}
      />
      <motion.div
        className="relative bg-surface-lowest rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#25D366] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-on-surface">
                Confirmar por WhatsApp
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Agendamento salvo! Deseja enviar confirmação?
              </p>
            </div>
          </div>
          <button
            onClick={onPular}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7 space-y-5">
          {/* Telefone */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
              Telefone da cliente
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
                Mensagem
              </span>
              <span className="text-[10px] text-outline font-body">
                você pode ajustar antes de enviar
              </span>
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-2xl bg-[#dcf8c6]/20 text-on-surface text-sm font-body border border-outline-variant/20 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={onPular}
            className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
          >
            Pular
          </button>
          <button
            onClick={enviar}
            disabled={!podeEnviar}
            className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-[#25D366] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar pelo WhatsApp
          </button>
        </div>
      </motion.div>
    </div>
  );
}
