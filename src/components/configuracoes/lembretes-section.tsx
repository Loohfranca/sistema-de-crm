"use client";

import { useEffect, useRef, useState } from "react";
import {
  BellRing,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Info,
} from "lucide-react";
import { VARIAVEIS, renderExemplo } from "@/lib/whatsapp";
import {
  getRegras,
  salvarRegras,
  novaRegra,
  descricaoQuando,
  type RegraLembrete,
  type LembreteUnidade,
  type LembreteQuando,
} from "@/lib/lembretes";

// ─── Editor de uma regra ─────────────────────────────────────────────────────
function RegraEditor({
  regra,
  onSalvar,
  onCancelar,
}: {
  regra: RegraLembrete;
  onSalvar: (r: RegraLembrete) => void;
  onCancelar: () => void;
}) {
  const [draft, setDraft] = useState<RegraLembrete>(regra);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function inserirVariavel(chave: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const novo = draft.mensagem.slice(0, start) + chave + draft.mensagem.slice(end);
    setDraft({ ...draft, mensagem: novo });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + chave.length, start + chave.length);
    });
  }

  const nomeValido = draft.nome.trim().length > 0;
  const qtdValida = draft.quantidade >= 1;
  const preview = renderExemplo(draft.mensagem);

  return (
    <div className="rounded-2xl border border-primary/25 bg-surface-low p-5 space-y-4">
      {/* Nome */}
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
          Nome do lembrete
        </label>
        <input
          type="text"
          value={draft.nome}
          onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
          placeholder="Ex: 1 dia antes"
          className="w-full px-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
        />
      </div>

      {/* Quando disparar */}
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
          Quando enviar
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            value={draft.quantidade}
            onChange={(e) =>
              setDraft({
                ...draft,
                quantidade: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="w-20 px-3 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-outline-variant/30"
          />
          <select
            value={draft.unidade}
            onChange={(e) =>
              setDraft({ ...draft, unidade: e.target.value as LembreteUnidade })
            }
            className="px-3 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-outline-variant/30"
          >
            <option value="horas">horas</option>
            <option value="dias">dias</option>
          </select>
          <select
            value={draft.quando}
            onChange={(e) =>
              setDraft({ ...draft, quando: e.target.value as LembreteQuando })
            }
            className="px-3 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-outline-variant/30"
          >
            <option value="antes">antes do atendimento</option>
            <option value="depois">depois do atendimento</option>
          </select>
        </div>
        {draft.quando === "depois" && (
          <p className="text-[11px] text-on-surface-variant font-body mt-2">
            Lembretes &quot;depois&quot; aparecem para atendimentos já realizados —
            ótimo para retorno e pós-venda.
          </p>
        )}
      </div>

      {/* Mensagem */}
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
          Mensagem
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {VARIAVEIS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => inserirVariavel(v.key)}
              title={v.label}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold font-body bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {v.key}
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={draft.mensagem}
          onChange={(e) => setDraft({ ...draft, mensagem: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Preview */}
      <div>
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

      {/* Ações */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancelar}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold font-body text-on-surface-variant hover:bg-surface-high transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          type="button"
          disabled={!nomeValido || !qtdValida}
          onClick={() => onSalvar({ ...draft, nome: draft.nome.trim() })}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full gradient-primary text-on-primary text-xs font-semibold font-body hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Salvar lembrete
        </button>
      </div>
    </div>
  );
}

// ─── Seção principal ─────────────────────────────────────────────────────────
export function LembretesSection() {
  const [regras, setRegras] = useState<RegraLembrete[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setRegras(getRegras());
    setMontado(true);
  }, []);

  function persistir(novas: RegraLembrete[]) {
    setRegras(novas);
    salvarRegras(novas);
  }

  function handleToggle(id: string) {
    persistir(
      regras.map((r) => (r.id === id ? { ...r, ativo: !r.ativo } : r)),
    );
  }

  function handleExcluir(id: string) {
    if (!confirm("Excluir este lembrete? A ação não pode ser desfeita.")) return;
    persistir(regras.filter((r) => r.id !== id));
    if (editandoId === id) setEditandoId(null);
  }

  function handleAdicionar() {
    const nova = novaRegra();
    persistir([...regras, nova]);
    setEditandoId(nova.id);
  }

  function handleSalvarEdicao(atualizada: RegraLembrete) {
    persistir(regras.map((r) => (r.id === atualizada.id ? atualizada : r)));
    setEditandoId(null);
  }

  if (!montado) return null;

  const ativos = regras.filter((r) => r.ativo).length;

  return (
    <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-on-surface">
            Lembretes automáticos
          </h2>
        </div>
        <button
          onClick={handleAdicionar}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo lembrete
        </button>
      </div>

      <p className="text-xs text-on-surface-variant font-body mb-4 leading-relaxed">
        Crie quantos lembretes quiser — cada um aparece no painel inicial no
        momento certo, prontos para enviar pelo WhatsApp com 1 clique.
        {ativos > 0 && (
          <span className="text-on-surface font-semibold">
            {" "}
            {ativos} ativo{ativos !== 1 ? "s" : ""}.
          </span>
        )}
      </p>

      {regras.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 p-8 text-center">
          <BellRing className="w-8 h-8 text-outline mx-auto mb-2" />
          <p className="text-sm font-body text-on-surface-variant">
            Nenhum lembrete configurado.
          </p>
          <button
            onClick={handleAdicionar}
            className="mt-3 text-xs font-semibold text-primary font-body hover:opacity-80 transition-opacity"
          >
            Criar o primeiro lembrete
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {regras.map((regra) =>
            editandoId === regra.id ? (
              <RegraEditor
                key={regra.id}
                regra={regra}
                onSalvar={handleSalvarEdicao}
                onCancelar={() => setEditandoId(null)}
              />
            ) : (
              <div
                key={regra.id}
                className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
                  regra.ativo
                    ? "border-outline-variant/20 bg-surface-low"
                    : "border-outline-variant/15 bg-surface-low/40"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold font-body truncate ${
                      regra.ativo ? "text-on-surface" : "text-on-surface-variant"
                    }`}
                  >
                    {regra.nome}
                  </p>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body bg-primary/10 text-primary uppercase tracking-wider">
                    {descricaoQuando(regra)}
                  </span>
                </div>

                {/* Toggle ativo */}
                <label className="relative cursor-pointer shrink-0" title={regra.ativo ? "Ativo" : "Inativo"}>
                  <input
                    type="checkbox"
                    checked={regra.ativo}
                    onChange={() => handleToggle(regra.id)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-surface-highest rounded-full peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow-sm" />
                </label>

                <button
                  onClick={() => setEditandoId(regra.id)}
                  title="Editar"
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high hover:text-on-surface transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleExcluir(regra.id)}
                  title="Excluir"
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
