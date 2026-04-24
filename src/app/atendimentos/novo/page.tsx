"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Sparkles,
  X,
  Save,
  FileText,
  Phone,
} from "lucide-react";
import { getServicos } from "@/lib/servicos";
import { getAgendamentos, salvarAgendamentos } from "@/lib/store";
import { getClientes } from "@/lib/clientes";
import type { Cliente } from "@/lib/clientes";
import type { Servico } from "@/types/servico";
import { WhatsAppConfirmacaoModal } from "@/components/agendamentos/whatsapp-confirmacao-modal";
import type { ContextoMensagem } from "@/lib/whatsapp";

const CORES = ["rose", "gold", "teal"] as const;

export default function NovoAtendimentoPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Form state
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [profissional, setProfissional] = useState("Dra. Helena");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Clientes from localStorage (nomes + objetos completos para auto-fill)
  const [clientesList, setClientesList] = useState<string[]>([]);
  const [clientesObjs, setClientesObjs] = useState<Cliente[]>([]);

  // Modal de confirmação WhatsApp após salvar
  const [confirmacaoCtx, setConfirmacaoCtx] = useState<ContextoMensagem | null>(null);
  const [confirmacaoTel, setConfirmacaoTel] = useState("");

  const carregar = useCallback(() => setServicos(getServicos()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_servicos_updated", carregar);
    return () => window.removeEventListener("crm_servicos_updated", carregar);
  }, [carregar]);

  // Load clientes from clientes DB + agendamentos (merge unique names)
  useEffect(() => {
    const cadastrados = getClientes();
    const nomesAgendamentos = getAgendamentos().map((a) => a.cliente);
    const nomes = [...new Set([...cadastrados.map((c) => c.name), ...nomesAgendamentos])].sort();
    setClientesList(nomes);
    setClientesObjs(cadastrados);

    const sync = () => {
      const cad = getClientes();
      const fromApts = getAgendamentos().map((a) => a.cliente);
      setClientesList([...new Set([...cad.map((c) => c.name), ...fromApts])].sort());
      setClientesObjs(cad);
    };
    window.addEventListener("crm_clientes_updated", sync);
    return () => window.removeEventListener("crm_clientes_updated", sync);
  }, []);

  // Auto-fill telefone quando o cliente digitado corresponde a um cadastrado
  useEffect(() => {
    if (!cliente) return;
    const match = clientesObjs.find((c) => c.name === cliente);
    if (match?.phone && !telefone) setTelefone(match.phone);
  }, [cliente, clientesObjs, telefone]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selecionados = servicos.filter((s) => selectedServices.includes(s.id));
  const selectedTotal = selecionados.reduce((acc, s) => acc + s.preco, 0);
  const selectedDuration = selecionados.reduce((acc, s) => acc + s.duracao, 0);

  function handleSalvar() {
    if (!cliente || !data || !horario || selectedServices.length === 0) return;

    const [hora, minuto] = horario.split(":").map(Number);
    const procedimentoNome = selecionados.map((s) => s.nome).join(" + ");
    const iniciais = cliente
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const lista = getAgendamentos();
    const maxId = lista.reduce((max, a) => Math.max(max, a.id), 0);

    const novo = {
      id: maxId + 1,
      cliente,
      avatar: iniciais,
      procedimento: procedimentoNome,
      data,
      horaInicio: hora,
      minutoInicio: minuto,
      duracao: selectedDuration,
      profissional,
      valor: selectedTotal,
      telefone: telefone || undefined,
      observacoes: observacoes || undefined,
      cor: CORES[maxId % CORES.length],
      status: "agendado" as const,
      pagamento: null,
    };

    salvarAgendamentos([...lista, novo]);

    // Abre modal de confirmação por WhatsApp em vez de redirecionar direto
    setConfirmacaoCtx({
      cliente,
      dataISO: data,
      horaInicio: hora,
      minutoInicio: minuto,
      procedimento: procedimentoNome,
      duracao: selectedDuration,
      profissional,
    });
    setConfirmacaoTel(telefone);
  }

  function fecharConfirmacao() {
    setConfirmacaoCtx(null);
    setConfirmacaoTel("");
    router.push("/agenda");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/atendimentos"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant font-body hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para atendimentos
        </Link>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Registrar Atendimento
        </h1>
        <p className="text-on-surface-variant font-body mt-1">
          Preencha as informações do novo atendimento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Dados da Cliente
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  list="clientes-list"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome da cliente"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                />
                <datalist id="clientes-list">
                  {clientesList.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Profissional
                </label>
                <input
                  type="text"
                  value={profissional}
                  onChange={(e) => setProfissional(e.target.value)}
                  placeholder="Nome do profissional"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Telefone <span className="text-outline font-normal">(para confirmação pelo WhatsApp)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Data e Horário
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Procedimentos
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servicos.length === 0 && (
                <p className="col-span-2 text-sm text-on-surface-variant font-body text-center py-6">
                  Nenhum serviço cadastrado. Adicione em{" "}
                  <Link href="/configuracoes" className="text-primary font-semibold hover:opacity-80 transition-opacity">
                    Configurações
                  </Link>.
                </p>
              )}
              {servicos.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`text-left p-4 rounded-2xl transition-all ${
                      isSelected
                        ? "bg-primary-container ring-2 ring-primary/30"
                        : "bg-surface-low hover:bg-surface-container"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium font-body ${isSelected ? "text-on-primary-container" : "text-on-surface"}`}
                    >
                      {service.nome}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span
                        className={`text-xs font-body ${isSelected ? "text-on-primary-container/70" : "text-on-surface-variant"}`}
                      >
                        R$ {service.preco.toLocaleString("pt-BR")}
                      </span>
                      <span
                        className={`text-xs font-body ${isSelected ? "text-on-primary-container/70" : "text-outline"}`}
                      >
                        {service.duracao} min
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Observações
              </h2>
            </div>
            <textarea
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre o atendimento, recomendações para retorno..."
              className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Summary - 1 column */}
        <div className="space-y-6">
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient sticky top-8">
            <h2 className="font-display text-lg font-bold text-on-surface mb-5">
              Resumo do Atendimento
            </h2>

            {selectedServices.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                <p className="text-sm text-on-surface-variant font-body">
                  Selecione os procedimentos ao lado
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {selecionados.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-surface-low"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-on-surface font-body">
                          {service.nome}
                        </p>
                        <p className="text-xs text-outline font-body">
                          {service.duracao} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface font-body">
                          R$ {service.preco.toLocaleString("pt-BR")}
                        </span>
                        <button
                          onClick={() => toggleService(service.id)}
                          className="p-1 rounded-full hover:bg-surface-container text-outline transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-on-surface-variant">Duração total</span>
                    <span className="font-medium text-on-surface">{selectedDuration} min</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-on-surface-variant">Procedimentos</span>
                    <span className="font-medium text-on-surface">{selectedServices.length}</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-base font-semibold text-on-surface font-body">Total</span>
                    <span className="text-xl font-bold text-primary font-display">
                      R$ {selectedTotal.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleSalvar}
                disabled={!cliente || !data || !horario || selectedServices.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold font-body transition-all ${
                  !cliente || !data || !horario || selectedServices.length === 0
                    ? "bg-surface-high text-outline cursor-not-allowed"
                    : "gradient-primary text-on-primary hover:opacity-90"
                }`}
              >
                <Save className="w-4 h-4" />
                Salvar Atendimento
              </button>
              <Link
                href="/atendimentos"
                className="w-full flex items-center justify-center px-5 py-3 rounded-full bg-surface-high text-on-surface-variant text-sm font-medium font-body hover:bg-surface-highest transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação por WhatsApp */}
      <AnimatePresence>
        {confirmacaoCtx && (
          <WhatsAppConfirmacaoModal
            contexto={confirmacaoCtx}
            telefoneInicial={confirmacaoTel}
            onPular={fecharConfirmacao}
            onEnviado={fecharConfirmacao}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
