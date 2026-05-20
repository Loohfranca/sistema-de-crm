"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  UserRound,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Phone,
  Scissors,
  Star,
  Clock3,
  ShieldCheck,
  CalendarPlus,
} from "lucide-react";
import { getServicos } from "@/lib/servicos";
import { getProfissionais, type DiaSemana } from "@/lib/profissionais";
import { getAgendamentos, salvarAgendamentos, type Agendamento } from "@/lib/store";
import { addLog } from "@/lib/logs";
import type { Servico } from "@/types/servico";

// ─── Constantes & helpers ────────────────────────────────────────────────────
const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const DIA_SEMANA: DiaSemana[] = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const CORES = ["rose", "gold", "teal"] as const;
const PASSOS = ["Serviço", "Profissional", "Data e hora", "Seus dados"];

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataLonga(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function iniciaisDe(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function AgendarPage() {
  const [montado, setMontado] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<
    ReturnType<typeof getProfissionais>
  >([]);
  const [clinicaNome, setClinicaNome] = useState("Studio Estética");

  const [step, setStep] = useState(1);
  const [confirmadoId, setConfirmadoId] = useState(0);
  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState<number | null>(null);
  const [dataISO, setDataISO] = useState("");
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    setServicos(getServicos());
    setProfissionais(getProfissionais().filter((p) => p.ativo));
    setAgendamentos(getAgendamentos());
    try {
      const raw = localStorage.getItem("crm_clinica");
      if (raw) {
        const nomeClinica = (JSON.parse(raw) as { nome?: string }).nome;
        if (nomeClinica) setClinicaNome(nomeClinica);
      }
    } catch {
      /* mantém padrão */
    }
    setMontado(true);
  }, []);

  const servico = useMemo(
    () => servicos.find((s) => s.id === servicoId) ?? null,
    [servicos, servicoId],
  );
  const profissional = useMemo(
    () => profissionais.find((p) => p.id === profissionalId) ?? null,
    [profissionais, profissionalId],
  );

  // Horários livres de um dia (remove ocupados na agenda, dias/horas passados
  // e dias em que o profissional não atende)
  const calcularSlots = useCallback(
    (iso: string): string[] => {
      if (!profissional) return [];
      const dia = new Date(iso + "T12:00:00");
      const ds = DIA_SEMANA[dia.getDay()];
      if (!profissional.diasAtendimento.includes(ds)) return [];
      const agora = new Date();
      const hojeISO = isoLocal(agora);
      if (iso < hojeISO) return [];
      const ocupados = agendamentos
        .filter(
          (a) =>
            a.profissional === profissional.nome &&
            a.data === iso &&
            a.status !== "cancelado",
        )
        .map((a) => a.horaInicio);
      return HORAS.filter((h) => !ocupados.includes(h))
        .filter((h) => (iso === hojeISO ? h > agora.getHours() : true))
        .map((h) => `${String(h).padStart(2, "0")}:00`);
    },
    [profissional, agendamentos],
  );

  const slotsDisponiveis = useMemo(
    () => (dataISO ? calcularSlots(dataISO) : []),
    [dataISO, calcularSlots],
  );

  // Grade do mês exibido — 1 célula por dia, marcando disponibilidade
  const calendario = useMemo(() => {
    if (!profissional) return null;
    const ano = mesRef.getFullYear();
    const mes = mesRef.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const fim = new Date(ano, mes + 1, 0);
    const cursor = new Date(ano, mes, 1 - primeiro.getDay());
    const semanas: {
      iso: string;
      dia: number;
      doMes: boolean;
      disponivel: boolean;
    }[][] = [];
    while (cursor <= fim) {
      const semana = [];
      for (let d = 0; d < 7; d++) {
        const iso = isoLocal(cursor);
        const doMes = cursor.getMonth() === mes;
        semana.push({
          iso,
          dia: cursor.getDate(),
          doMes,
          disponivel: doMes && calcularSlots(iso).length > 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      semanas.push(semana);
    }
    return {
      semanas,
      label: mesRef.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [profissional, mesRef, calcularSlots]);

  // Limites de navegação de mês
  const inicioMesAtual = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  })();
  const limiteMesFuturo = new Date(
    inicioMesAtual.getFullYear(),
    inicioMesAtual.getMonth() + 6,
    1,
  );
  const podeVoltarMes = mesRef > inicioMesAtual;
  const podeAvancarMes = mesRef < limiteMesFuturo;

  function mudarMes(delta: number) {
    setMesRef((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function selecionarProfissional(id: number) {
    setProfissionalId(id);
    setDataISO("");
    setHorario("");
  }

  function selecionarData(iso: string) {
    setDataISO(iso);
    setHorario("");
  }

  function podeAvancar(): boolean {
    if (step === 1) return !!servicoId;
    if (step === 2) return profissionalId !== null;
    if (step === 3) return !!dataISO && !!horario;
    if (step === 4) return nome.trim().length > 1 && telefone.trim().length >= 8;
    return false;
  }

  function confirmar() {
    if (!servico || !profissional || !podeAvancar()) return;
    const lista = getAgendamentos();
    const maxId = lista.reduce((m, a) => Math.max(m, a.id), 0);
    const [hora] = horario.split(":").map(Number);
    lista.push({
      id: maxId + 1,
      cliente: nome.trim(),
      avatar: iniciaisDe(nome),
      procedimento: servico.nome,
      data: dataISO,
      horaInicio: hora,
      minutoInicio: 0,
      duracao: servico.duracao,
      profissional: profissional.nome,
      valor: servico.preco,
      telefone: telefone.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      cor: CORES[maxId % CORES.length],
      status: "agendado",
      pagamento: null,
    });
    salvarAgendamentos(lista);
    addLog({
      usuario: "Agendamento online",
      acao: "Criou",
      entidade: "agendamento",
      descricao: `Agendamento online: ${servico.nome} para ${nome.trim()}`,
    });
    setConfirmadoId(maxId + 1);
    setStep(5);
  }

  function reiniciar() {
    setServicoId("");
    setProfissionalId(null);
    setDataISO("");
    setHorario("");
    setNome("");
    setTelefone("");
    setObservacoes("");
    setConfirmadoId(0);
    setStep(1);
  }

  // Gera um arquivo .ics para a cliente adicionar no calendário do celular
  function baixarICS() {
    if (!servico || !profissional) return;
    const [h] = horario.split(":").map(Number);
    const inicio = new Date(dataISO + "T00:00:00");
    inicio.setHours(h, 0, 0, 0);
    const fim = new Date(inicio.getTime() + servico.duracao * 60000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
        d.getDate(),
      ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(
        d.getMinutes(),
      ).padStart(2, "0")}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CRM//Agendamento//PT-BR",
      "BEGIN:VEVENT",
      `UID:agendamento-${confirmadoId}-${Date.now()}@crm`,
      `DTSTART:${fmt(inicio)}`,
      `DTEND:${fmt(fim)}`,
      `SUMMARY:${servico.nome} — ${clinicaNome}`,
      `DESCRIPTION:Profissional: ${profissional.nome}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agendamento.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!montado) return null;

  // ─── Tela de sucesso ───────────────────────────────────────────────────────
  if (step === 5 && servico && profissional) {
    return (
      <Fundo>
        <div className="w-full max-w-[470px]">
          <div className="bg-surface-lowest rounded-[1.75rem] shadow-ambient p-8">
            {/* Selo de sucesso */}
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary-container flex items-center justify-center ring-8 ring-secondary-container/30">
              <CheckCircle2 className="w-8 h-8 text-on-secondary-container" />
            </div>
            <h1 className="text-center font-display text-2xl font-bold text-on-surface mt-4">
              Agendamento confirmado!
            </h1>
            <p className="text-center text-sm text-on-surface-variant font-body mt-1">
              {nome.trim().split(/\s+/)[0]}, seu horário está reservado 💖
            </p>
            {confirmadoId > 0 && (
              <p className="text-center text-[11px] text-on-surface-variant font-body mt-1.5">
                Comprovante nº {String(confirmadoId).padStart(4, "0")}
              </p>
            )}

            {/* Detalhes */}
            <div className="mt-6 rounded-2xl bg-surface-low p-5 grid grid-cols-2 gap-x-5 gap-y-4">
              <Detalhe rotulo="Data" valor={dataLonga(dataISO)} />
              <Detalhe rotulo="Horário" valor={horario} />
              <Detalhe rotulo="Serviço" valor={servico.nome} />
              <Detalhe rotulo="Profissional" valor={profissional.nome} />
              <Detalhe rotulo="Cliente" valor={nome.trim()} />
              <Detalhe rotulo="Telefone" valor={telefone.trim() || "—"} />
            </div>

            {/* Valor total */}
            <div className="mt-3 rounded-2xl gradient-primary text-on-primary px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-body opacity-90">Valor total</span>
              <span className="font-display text-xl font-bold">
                {brl(servico.preco)}
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant font-body text-center mt-4">
              Guarde esta confirmação. Em caso de imprevisto, avise com
              antecedência.
            </p>

            {/* Ações */}
            <button
              onClick={baixarICS}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Adicionar ao calendário
            </button>
            <button
              onClick={reiniciar}
              className="mt-2.5 w-full py-3 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              Fazer novo agendamento
            </button>
          </div>
        </div>
      </Fundo>
    );
  }

  // ─── Wizard ────────────────────────────────────────────────────────────────
  return (
    <Fundo>
      <div className="w-full max-w-[480px] lg:max-w-[1060px]">
        <div className="bg-surface-lowest rounded-[1.75rem] shadow-ambient overflow-hidden lg:grid lg:grid-cols-[300px_1fr]">
          {/* ══ Painel de marca (esquerda no PC, topo no mobile) ══ */}
          <div className="gradient-primary text-on-primary p-7 lg:p-8 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-on-primary/15 backdrop-blur flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold leading-tight truncate">
                  {clinicaNome}
                </h1>
                <p className="text-xs opacity-85 font-body">
                  Agende seu horário online
                </p>
              </div>
            </div>

            <p className="hidden lg:block font-display text-lg font-bold leading-snug mt-7">
              Reserve seu horário em poucos cliques.
            </p>

            {/* Stepper vertical — só PC */}
            <div className="hidden lg:flex lg:flex-col mt-7">
              {PASSOS.map((p, i) => {
                const n = i + 1;
                const ativo = n === step;
                const feito = n < step;
                return (
                  <div key={p}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-body shrink-0 transition-colors ${
                          ativo
                            ? "bg-on-primary text-primary"
                            : feito
                              ? "bg-on-primary/35 text-on-primary"
                              : "bg-on-primary/15 text-on-primary/70"
                        }`}
                      >
                        {feito ? <Check className="w-3.5 h-3.5" /> : n}
                      </div>
                      <span
                        className={`text-sm font-body transition-opacity ${
                          ativo
                            ? "font-bold opacity-100"
                            : "font-medium opacity-70"
                        }`}
                      >
                        {p}
                      </span>
                    </div>
                    {i < PASSOS.length - 1 && (
                      <div className="w-7 flex justify-center">
                        <div
                          className={`w-0.5 h-5 my-0.5 rounded-full ${
                            feito ? "bg-on-primary/60" : "bg-on-primary/20"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selos de confiança */}
            <div className="flex flex-wrap lg:flex-col gap-x-4 gap-y-2 mt-5 lg:mt-auto lg:pt-8 text-[11px] font-body opacity-95">
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                4,9 de avaliação
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                +500 clientes atendidas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" />
                Leva menos de 1 minuto
              </span>
            </div>
          </div>

          {/* ══ Lado do conteúdo ══ */}
          <div className="flex flex-col">
            {/* Progresso horizontal — só mobile */}
            <div className="lg:hidden px-7 py-4 border-b border-outline-variant/15 flex items-center gap-1.5">
              {PASSOS.map((p, i) => {
                const n = i + 1;
                const ativo = n === step;
                const feito = n < step;
                return (
                  <div key={p} className="flex items-center gap-1.5 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-body shrink-0 transition-colors ${
                        ativo
                          ? "gradient-primary text-on-primary"
                          : feito
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-surface-high text-on-surface-variant"
                      }`}
                    >
                      {feito ? <Check className="w-3.5 h-3.5" /> : n}
                    </div>
                    {i < PASSOS.length - 1 && (
                      <div
                        className={`h-0.5 rounded-full flex-1 ${
                          feito ? "bg-secondary" : "bg-outline-variant/25"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Conteúdo + resumo */}
            <div className="flex-1 lg:grid lg:grid-cols-[1fr_252px]">
              {/* Passo */}
              <div className="px-7 lg:px-8 py-7 lg:min-h-[420px]">
                {/* Passo 1 — Serviço */}
                {step === 1 && (
                  <Secao
                    icone={<Scissors className="w-4 h-4" />}
                    titulo="Escolha o serviço"
                    subtitulo="Qual cuidado você quer fazer?"
                  >
                    {servicos.length === 0 ? (
                      <Vazio texto="Nenhum serviço disponível no momento." />
                    ) : (
                      <div className="space-y-2.5">
                        {servicos.map((s) => {
                          const sel = servicoId === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => setServicoId(s.id)}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
                                sel
                                  ? "bg-primary/8 ring-2 ring-primary/40"
                                  : "bg-surface-low ring-1 ring-transparent hover:ring-outline-variant/30"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  sel
                                    ? "gradient-primary text-on-primary"
                                    : "bg-surface-high text-on-surface-variant"
                                }`}
                              >
                                {sel ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Scissors className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface font-body">
                                  {s.nome}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant font-body">
                                    <Clock3 className="w-3 h-3" />
                                    {s.duracao} min
                                  </span>
                                  {s.categoria && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold font-body bg-surface-high text-on-surface-variant">
                                      {s.categoria}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-display text-sm font-bold text-primary shrink-0">
                                {brl(s.preco)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Secao>
                )}

                {/* Passo 2 — Profissional */}
                {step === 2 && (
                  <Secao
                    icone={<UserRound className="w-4 h-4" />}
                    titulo="Escolha o profissional"
                    subtitulo="Quem vai cuidar de você?"
                  >
                    {profissionais.length === 0 ? (
                      <Vazio texto="Nenhum profissional disponível no momento." />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {profissionais.map((p) => {
                          const sel = profissionalId === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => selecionarProfissional(p.id)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
                                sel
                                  ? "bg-primary/8 ring-2 ring-primary/40"
                                  : "bg-surface-low ring-1 ring-transparent hover:ring-outline-variant/30"
                              }`}
                            >
                              <div
                                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shrink-0"
                                style={{ backgroundColor: p.cor }}
                              >
                                {p.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface font-body truncate">
                                  {p.nome}
                                </p>
                                <p className="text-xs text-on-surface-variant font-body truncate">
                                  {p.especialidade}
                                </p>
                              </div>
                              {sel && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Secao>
                )}

                {/* Passo 3 — Data e hora */}
                {step === 3 && (
                  <Secao
                    icone={<CalendarDays className="w-4 h-4" />}
                    titulo="Data e horário"
                    subtitulo="Escolha o melhor momento para você"
                  >
                    {!calendario ? (
                      <Vazio texto="Selecione um profissional primeiro." />
                    ) : (
                      <>
                        {/* Navegação de mês */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => mudarMes(-1)}
                            disabled={!podeVoltarMes}
                            aria-label="Mês anterior"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-low text-on-surface hover:bg-surface-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-on-surface font-display capitalize">
                            {calendario.label}
                          </span>
                          <button
                            onClick={() => mudarMes(1)}
                            disabled={!podeAvancarMes}
                            aria-label="Próximo mês"
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-low text-on-surface hover:bg-surface-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Cabeçalho dos dias da semana */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map(
                            (d) => (
                              <span
                                key={d}
                                className="text-center text-[10px] font-semibold text-on-surface-variant font-body uppercase"
                              >
                                {d}
                              </span>
                            ),
                          )}
                        </div>

                        {/* Grade de dias */}
                        <div className="space-y-1">
                          {calendario.semanas.map((semana, wi) => (
                            <div key={wi} className="grid grid-cols-7 gap-1">
                              {semana.map((c) => {
                                if (!c.doMes)
                                  return <div key={c.iso} aria-hidden />;
                                const sel = dataISO === c.iso;
                                return (
                                  <button
                                    key={c.iso}
                                    onClick={() => selecionarData(c.iso)}
                                    disabled={!c.disponivel}
                                    className={`aspect-square rounded-xl text-sm font-semibold font-body transition-all ${
                                      sel
                                        ? "gradient-primary text-on-primary"
                                        : c.disponivel
                                          ? "bg-surface-low text-on-surface hover:ring-1 hover:ring-primary/40"
                                          : "text-outline/40 cursor-not-allowed"
                                    }`}
                                  >
                                    {c.dia}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-body mt-2">
                          Dias sem horário livre aparecem apagados.
                        </p>

                        {/* Horários do dia escolhido */}
                        {dataISO && (
                          <>
                            <p className="text-[11px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mt-5 mb-2">
                              Horário
                            </p>
                            {slotsDisponiveis.length === 0 ? (
                              <Vazio texto="Sem horários livres neste dia. Escolha outra data." />
                            ) : (
                              <>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                  {slotsDisponiveis.map((h) => {
                                    const sel = horario === h;
                                    return (
                                      <button
                                        key={h}
                                        onClick={() => setHorario(h)}
                                        className={`py-2.5 rounded-xl text-sm font-semibold font-body transition-all ${
                                          sel
                                            ? "gradient-primary text-on-primary"
                                            : "bg-surface-low ring-1 ring-transparent hover:ring-outline-variant/30 text-on-surface"
                                        }`}
                                      >
                                        {h}
                                      </button>
                                    );
                                  })}
                                </div>
                                {slotsDisponiveis.length <= 3 && (
                                  <p className="text-[11px] text-primary font-semibold font-body mt-2.5">
                                    🔥 Últimos {slotsDisponiveis.length}{" "}
                                    horários para este dia!
                                  </p>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </Secao>
                )}

                {/* Passo 4 — Dados */}
                {step === 4 && (
                  <Secao
                    icone={<Phone className="w-4 h-4" />}
                    titulo="Seus dados"
                    subtitulo="Só falta confirmar quem é você"
                  >
                    <div className="space-y-4">
                      <Campo rotulo="Nome completo *">
                        <input
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Como podemos te chamar?"
                          className={inputCls}
                        />
                      </Campo>
                      <Campo rotulo="WhatsApp *">
                        <input
                          type="tel"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="(11) 90000-0000"
                          className={inputCls}
                        />
                      </Campo>
                      <Campo rotulo="Observações (opcional)">
                        <textarea
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          rows={3}
                          placeholder="Algo que a profissional precisa saber?"
                          className={`${inputCls} resize-none`}
                        />
                      </Campo>
                    </div>
                  </Secao>
                )}
              </div>

              {/* Resumo */}
              <aside className="bg-surface-low/50 border-t lg:border-t-0 lg:border-l border-outline-variant/15 px-7 lg:px-6 py-7">
                <h2 className="font-display text-sm font-bold text-on-surface mb-4">
                  Resumo
                </h2>
                {!servico && !profissional && !dataISO ? (
                  <p className="text-xs text-on-surface-variant font-body leading-relaxed">
                    Suas escolhas aparecem aqui conforme você avança.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {servico && (
                      <ResumoLinha rotulo="Serviço" valor={servico.nome} />
                    )}
                    {servico && (
                      <ResumoLinha
                        rotulo="Duração"
                        valor={`${servico.duracao} min`}
                      />
                    )}
                    {profissional && (
                      <ResumoLinha
                        rotulo="Profissional"
                        valor={profissional.nome}
                      />
                    )}
                    {dataISO && (
                      <ResumoLinha rotulo="Data" valor={dataLonga(dataISO)} />
                    )}
                    {horario && (
                      <ResumoLinha rotulo="Horário" valor={horario} />
                    )}
                    {servico && (
                      <div className="pt-3 mt-1 border-t border-outline-variant/15 flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
                          Total
                        </span>
                        <span className="font-display text-lg font-bold text-primary">
                          {brl(servico.preco)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </div>

            {/* Navegação */}
            <div className="px-7 lg:px-8 py-5 bg-surface-low border-t border-outline-variant/15 flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => podeAvancar() && setStep(step + 1)}
                  disabled={!podeAvancar()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={confirmar}
                  disabled={!podeAvancar()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Confirmar agendamento
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-on-surface-variant font-body mt-4">
          Powered by {clinicaNome} · Agendamento seguro
        </p>
      </div>
    </Fundo>
  );
}

// ─── Estilos & subcomponentes ────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";

// Fundo decorativo: gradiente suave + blobs desfocados
function Fundo({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}

function Secao({
  icone,
  titulo,
  subtitulo,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-primary">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          {icone}
        </div>
        <h2 className="font-display text-lg font-bold text-on-surface">
          {titulo}
        </h2>
      </div>
      <p className="text-xs text-on-surface-variant font-body mt-1 mb-5 ml-9">
        {subtitulo}
      </p>
      {children}
    </div>
  );
}

function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1.5">
        {rotulo}
      </label>
      {children}
    </div>
  );
}

function Detalhe({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-0.5">
        {rotulo}
      </p>
      <p className="text-sm font-bold text-on-surface font-body capitalize break-words">
        {valor}
      </p>
    </div>
  );
}

function ResumoLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-on-surface-variant font-body shrink-0">
        {rotulo}
      </span>
      <span className="text-xs font-semibold text-on-surface font-body text-right capitalize">
        {valor}
      </span>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/40 p-8 text-center">
      <p className="text-sm font-body text-on-surface-variant">{texto}</p>
    </div>
  );
}
