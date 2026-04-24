"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, Check, Info } from "lucide-react";
import {
  TEMPLATE_PADRAO,
  VARIAVEIS,
  getTemplateConfirmacao,
  renderExemplo,
  resetarTemplate,
  salvarTemplate,
} from "@/lib/whatsapp";

export function WhatsAppSection() {
  const [template, setTemplate] = useState(TEMPLATE_PADRAO);
  const [salvoToast, setSalvoToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTemplate(getTemplateConfirmacao());
  }, []);

  function inserirVariavel(chave: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const novo = template.slice(0, start) + chave + template.slice(end);
    setTemplate(novo);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + chave.length, start + chave.length);
    });
  }

  function handleSalvar() {
    salvarTemplate(template);
    setSalvoToast(true);
    setTimeout(() => setSalvoToast(false), 2000);
  }

  function handleResetar() {
    resetarTemplate();
    setTemplate(TEMPLATE_PADRAO);
  }

  const preview = renderExemplo(template);

  return (
    <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-on-surface">
            Mensagem de WhatsApp
          </h2>
        </div>
        <button
          onClick={handleResetar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-body text-on-surface-variant hover:bg-surface-high transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Restaurar padrão
        </button>
      </div>

      <p className="text-xs text-on-surface-variant font-body mb-4 leading-relaxed">
        Mensagem que aparece quando você confirma um novo agendamento. Clique nas
        etiquetas para inserir variáveis — elas são substituídas automaticamente pelos
        dados da cliente ao enviar.
      </p>

      {/* Chips de variáveis */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {VARIAVEIS.map((v) => (
          <button
            key={v.key}
            onClick={() => inserirVariavel(v.key)}
            title={v.label}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold font-body bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {v.key}
          </button>
        ))}
      </div>

      {/* Textarea do template */}
      <textarea
        ref={textareaRef}
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        rows={9}
        className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
      />

      {/* Preview */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5 text-on-surface-variant" />
          <p className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
            Prévia com dados de exemplo
          </p>
        </div>
        <div className="rounded-2xl bg-[#dcf8c6]/30 border border-outline-variant/15 p-4 whitespace-pre-wrap text-sm font-body text-on-surface leading-relaxed">
          {preview}
        </div>
      </div>

      {/* Salvar */}
      <div className="mt-5 flex items-center justify-end gap-3">
        <div
          className={`text-xs font-body text-secondary transition-opacity flex items-center gap-1.5 ${
            salvoToast ? "opacity-100" : "opacity-0"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          Template salvo
        </div>
        <button
          onClick={handleSalvar}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity"
        >
          <Check className="w-4 h-4" />
          Salvar mensagem
        </button>
      </div>
    </div>
  );
}
