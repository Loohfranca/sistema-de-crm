"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { getLancamentos } from "@/lib/financeiro";
import { getAgendamentos } from "@/lib/store";
import type { Lancamento } from "@/types/financeiro";
import { FinanceiroSummary } from "@/components/financeiro/financeiro-summary";
import { FinanceiroTable } from "@/components/financeiro/financeiro-table";
import { LancamentoModal, type AtendimentoOption } from "@/components/financeiro/lancamento-modal";

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | undefined>();
  const [atendimentos, setAtendimentos] = useState<AtendimentoOption[]>([]);

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());

  const mesPrefixo = `${ano}-${String(mes + 1).padStart(2, "0")}`;

  const carregar = useCallback(() => setLancamentos(getLancamentos()), []);

  const carregarAtendimentos = useCallback(() => {
    const lista = getAgendamentos();
    setAtendimentos(
      lista
        .filter((a) => a.status === "realizado")
        .map((a) => ({
          id: String(a.id),
          label: `${a.procedimento} — ${a.cliente}`,
          valor: a.valor,
          data: a.data,
        }))
    );
  }, []);

  useEffect(() => {
    carregar();
    carregarAtendimentos();
    window.addEventListener("crm_lancamentos_updated", carregar);
    window.addEventListener("crm_agenda_updated", carregarAtendimentos);
    return () => {
      window.removeEventListener("crm_lancamentos_updated", carregar);
      window.removeEventListener("crm_agenda_updated", carregarAtendimentos);
    };
  }, [carregar, carregarAtendimentos]);

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1); }
    else setMes(mes - 1);
  }

  function mesSeguinte() {
    if (mes === 11) { setMes(0); setAno(ano + 1); }
    else setMes(mes + 1);
  }

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }

  function abrirEditar(l: Lancamento) {
    setEditando(l);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
            Financeiro
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Financeiro
          </h1>
          <p className="text-on-surface-variant font-body mt-1">
            {lancamentos.length} lançamentos registrados
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Adicionar Lançamento
        </button>
      </div>

      {/* Summary com navegação de mês */}
      <FinanceiroSummary
        lancamentos={lancamentos}
        mes={mes}
        ano={ano}
        onMesAnterior={mesAnterior}
        onMesSeguinte={mesSeguinte}
      />

      {/* Tabela de lançamentos */}
      <FinanceiroTable
        lancamentos={lancamentos}
        mesPrefixo={mesPrefixo}
        onEdit={abrirEditar}
        onChanged={setLancamentos}
      />

      {/* Modal */}
      {modalAberto && (
        <LancamentoModal
          onClose={fecharModal}
          onSaved={setLancamentos}
          lancamento={editando}
          atendimentos={atendimentos}
        />
      )}
    </div>
  );
}
