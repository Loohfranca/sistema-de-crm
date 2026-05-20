"use client";

import { useEffect, useState } from "react";
import { X, ClipboardList, HeartPulse, Sparkles, FileText } from "lucide-react";
import {
  type Anamnese,
  type SimNao,
  type TipoPele,
  CONDICOES_SAUDE,
  TIPOS_PELE,
  anamneseVazia,
} from "@/lib/anamnese";

const inputCls =
  "w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";
const labelCls =
  "block text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1.5";

// ─── Grupo de botões Sim / Não ───────────────────────────────────────────────
function SimNaoGroup({
  valor,
  onChange,
}: {
  valor: SimNao;
  onChange: (v: SimNao) => void;
}) {
  const opcoes: { v: SimNao; label: string }[] = [
    { v: "sim", label: "Sim" },
    { v: "nao", label: "Não" },
  ];
  return (
    <div className="flex gap-2">
      {opcoes.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(valor === o.v ? "" : o.v)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold font-body border-2 transition-all ${
            valor === o.v
              ? "bg-primary-container text-on-primary-container border-primary/30"
              : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AnamneseModal({
  clienteNome,
  inicial,
  onClose,
  onSave,
}: {
  clienteNome: string;
  inicial: Anamnese | null;
  onClose: () => void;
  onSave: (a: Anamnese) => void;
}) {
  const [form, setForm] = useState<Anamnese>(inicial ?? anamneseVazia());

  function set<K extends keyof Anamnese>(key: K, val: Anamnese[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleCondicao(c: string) {
    setForm((prev) => ({
      ...prev,
      condicoes: prev.condicoes.includes(c)
        ? prev.condicoes.filter((x) => x !== c)
        : [...prev.condicoes, c],
    }));
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-on-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-on-surface">
                  Anamnese
                </h2>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  Ficha de avaliação — {clienteNome}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 py-6 space-y-7">
            {/* ── Saúde ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HeartPulse className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-on-surface font-display">
                  Saúde
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Gestante ou amamentando?</label>
                    <SimNaoGroup
                      valor={form.gestante}
                      onChange={(v) => set("gestante", v)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Fumante?</label>
                    <SimNaoGroup
                      valor={form.fumante}
                      onChange={(v) => set("fumante", v)}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Condições de saúde (marque as que se aplicam)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONDICOES_SAUDE.map((c) => {
                      const ativo = form.condicoes.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCondicao(c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold font-body border-2 transition-all ${
                            ativo
                              ? "bg-error-container text-on-error-container border-error/30"
                              : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Alergias conhecidas</label>
                  <input
                    type="text"
                    value={form.alergias}
                    onChange={(e) => set("alergias", e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Látex, Dipirona, Lidocaína..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Uso de medicamentos</label>
                  <input
                    type="text"
                    value={form.medicamentos}
                    onChange={(e) => set("medicamentos", e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Anticoncepcional, Roacutan..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Cirurgias recentes</label>
                  <input
                    type="text"
                    value={form.cirurgiasRecentes}
                    onChange={(e) => set("cirurgiasRecentes", e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Nenhuma / cirurgia plástica há 6 meses..."
                  />
                </div>
              </div>
            </div>

            {/* ── Pele & estética ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-on-surface font-display">
                  Pele &amp; estética
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Tipo de pele</label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_PELE.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          set(
                            "tipoPele",
                            form.tipoPele === t.value
                              ? ("" as TipoPele)
                              : t.value,
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold font-body border-2 transition-all ${
                          form.tipoPele === t.value
                            ? "bg-primary-container text-on-primary-container border-primary/30"
                            : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Usa filtro solar diariamente?</label>
                  <SimNaoGroup
                    valor={form.usaFiltroSolar}
                    onChange={(v) => set("usaFiltroSolar", v)}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Procedimentos estéticos anteriores
                  </label>
                  <input
                    type="text"
                    value={form.procedimentosAnteriores}
                    onChange={(e) =>
                      set("procedimentosAnteriores", e.target.value)
                    }
                    className={inputCls}
                    placeholder="Ex: Botox, peeling químico, preenchimento..."
                  />
                </div>
              </div>
            </div>

            {/* ── Avaliação ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-on-surface font-display">
                  Avaliação
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Queixa principal / objetivo</label>
                  <input
                    type="text"
                    value={form.queixaPrincipal}
                    onChange={(e) => set("queixaPrincipal", e.target.value)}
                    className={inputCls}
                    placeholder="O que a cliente busca tratar?"
                  />
                </div>
                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => set("observacoes", e.target.value)}
                    rows={4}
                    className={`${inputCls} resize-none leading-relaxed`}
                    placeholder="Anotações da profissional sobre a avaliação..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-outline-variant/15 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-all"
            >
              Salvar anamnese
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
