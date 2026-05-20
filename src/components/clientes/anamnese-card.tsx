"use client";

import { useEffect, useState } from "react";
import { ClipboardList, AlertTriangle, Pencil, Plus } from "lucide-react";
import {
  type Anamnese,
  getAnamnese,
  salvarAnamnese,
  temAlertas,
  TIPOS_PELE,
  ANAMNESE_EVENT,
} from "@/lib/anamnese";
import { AnamneseModal } from "@/components/clientes/anamnese-modal";

function formatarData(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function rotuloTipoPele(valor: string): string {
  return TIPOS_PELE.find((t) => t.value === valor)?.label ?? "";
}

export function AnamneseCard({
  clienteId,
  clienteNome,
}: {
  clienteId: string;
  clienteNome: string;
}) {
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const carregar = () => setAnamnese(getAnamnese(clienteId));
    carregar();
    setMontado(true);
    window.addEventListener(ANAMNESE_EVENT, carregar);
    return () => window.removeEventListener(ANAMNESE_EVENT, carregar);
  }, [clienteId]);

  function handleSalvar(dados: Anamnese) {
    salvarAnamnese(clienteId, dados);
    setAnamnese(getAnamnese(clienteId));
    setModalAberto(false);
  }

  if (!montado) return null;

  const alertas = anamnese ? temAlertas(anamnese) : false;

  return (
    <>
      {modalAberto && (
        <AnamneseModal
          clienteNome={clienteNome}
          inicial={anamnese}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
        />
      )}

      <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-bold text-on-surface">
              Anamnese
            </h3>
          </div>
          {anamnese && (
            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold font-body bg-surface-high text-on-surface-variant hover:bg-surface-highest hover:text-on-surface transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
          )}
        </div>

        {!anamnese ? (
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-on-surface font-body">
              Anamnese não preenchida
            </p>
            <p className="text-xs text-on-surface-variant font-body mt-1 mb-4">
              Registre o histórico de saúde e estética da cliente.
            </p>
            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-primary text-on-primary text-xs font-semibold font-body hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Preencher anamnese
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-on-surface-variant font-body">
              Atualizada em {formatarData(anamnese.atualizadoEm)}
            </p>

            {alertas && (
              <div className="rounded-2xl bg-error-container/60 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-on-error-container" />
                  <span className="text-[10px] font-bold text-on-error-container font-body uppercase tracking-widest">
                    Pontos de atenção
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {anamnese.gestante === "sim" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-container text-on-error-container font-body">
                      Gestante / amamentando
                    </span>
                  )}
                  {anamnese.fumante === "sim" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-container text-on-error-container font-body">
                      Fumante
                    </span>
                  )}
                  {anamnese.condicoes.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-container text-on-error-container font-body"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <dl className="space-y-2">
              {anamnese.queixaPrincipal && (
                <div>
                  <dt className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                    Queixa principal
                  </dt>
                  <dd className="text-sm text-on-surface font-body">
                    {anamnese.queixaPrincipal}
                  </dd>
                </div>
              )}
              {anamnese.tipoPele && (
                <div>
                  <dt className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                    Tipo de pele
                  </dt>
                  <dd className="text-sm text-on-surface font-body">
                    {rotuloTipoPele(anamnese.tipoPele)}
                  </dd>
                </div>
              )}
              {anamnese.alergias && (
                <div>
                  <dt className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                    Alergias
                  </dt>
                  <dd className="text-sm text-on-surface font-body">
                    {anamnese.alergias}
                  </dd>
                </div>
              )}
              {anamnese.observacoes && (
                <div>
                  <dt className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                    Observações
                  </dt>
                  <dd className="text-sm text-on-surface-variant font-body whitespace-pre-wrap leading-relaxed">
                    {anamnese.observacoes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </>
  );
}
