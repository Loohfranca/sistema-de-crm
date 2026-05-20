"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Smartphone,
  Banknote,
  CreditCard,
  Check,
} from "lucide-react";
import {
  atualizarAgendamento,
  type Agendamento,
} from "@/lib/store";
import { getProfissionais } from "@/lib/profissionais";

// ─── Tipos de pagamento (modelo simples — financeiro será revisto depois) ─────
export type FormaPagamento = "pix" | "dinheiro" | "cartao";

export interface Recebimento {
  valor: number;
  forma: FormaPagamento;
  data: string; // YYYY-MM-DD
  anotacoes?: string;
}

const FORMAS: { id: FormaPagamento; label: string; icon: typeof Smartphone }[] = [
  { id: "pix", label: "Pix", icon: Smartphone },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "cartao", label: "Cartão", icon: CreditCard },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";
const labelCls =
  "block text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1.5";

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formaLabel(f: FormaPagamento): string {
  return FORMAS.find((x) => x.id === f)?.label ?? f;
}

// Lê recebimentos já gravados no pagamento do agendamento
function lerRecebimentos(apt: Agendamento): Recebimento[] {
  if (!apt.pagamento) return [];
  const p = apt.pagamento as Record<string, unknown>;
  if (Array.isArray(p.recebimentos)) return p.recebimentos as Recebimento[];
  // Pagamento antigo (modelo financeiro): converte em 1 recebimento
  const total = Number(p.liquido ?? p.total ?? 0);
  if (total > 0) {
    return [
      {
        valor: total,
        forma: "pix",
        data: new Date().toISOString().slice(0, 10),
      },
    ];
  }
  return [];
}

// ─── Sub-formulário: inserir um pagamento ────────────────────────────────────
function InserirPagamento({
  sugestao,
  onInserir,
  onCancelar,
}: {
  sugestao: number;
  onInserir: (r: Recebimento) => void;
  onCancelar: () => void;
}) {
  const [valor, setValor] = useState(sugestao > 0 ? String(sugestao) : "");
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [anotacoes, setAnotacoes] = useState("");

  const valorNum = Number(valor) || 0;

  return (
    <div className="rounded-2xl bg-surface-high p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Valor recebido</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className={`${inputCls} bg-surface-lowest`}
          />
        </div>
        <div>
          <label className={labelCls}>Forma de pagamento</label>
          <select
            value={forma}
            onChange={(e) => setForma(e.target.value as FormaPagamento)}
            className={`${inputCls} bg-surface-lowest`}
          >
            {FORMAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Data</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={`${inputCls} bg-surface-lowest`}
        />
      </div>
      <div>
        <label className={labelCls}>Anotações</label>
        <input
          type="text"
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
          placeholder="Opcional"
          className={`${inputCls} bg-surface-lowest`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 py-2.5 rounded-full text-xs font-semibold font-body bg-surface-lowest text-on-surface hover:bg-surface-low transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={valorNum <= 0}
          onClick={() =>
            onInserir({
              valor: valorNum,
              forma,
              data,
              anotacoes: anotacoes.trim() || undefined,
            })
          }
          className="flex-1 py-2.5 rounded-full text-xs font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Inserir
        </button>
      </div>
    </div>
  );
}

// ─── Modal principal ─────────────────────────────────────────────────────────
export function EditarAtendimentoModal({
  apt,
  onClose,
  onSaved,
}: {
  apt: Agendamento;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [procedimento, setProcedimento] = useState(apt.procedimento);
  const [profissional, setProfissional] = useState(apt.profissional);
  const [status, setStatus] = useState<Agendamento["status"]>(apt.status);
  const [data, setData] = useState(apt.data);
  const [hora, setHora] = useState(
    `${String(apt.horaInicio).padStart(2, "0")}:${String(apt.minutoInicio).padStart(2, "0")}`,
  );
  const [cliente, setCliente] = useState(apt.cliente);
  const [telefone, setTelefone] = useState(apt.telefone ?? "");
  const [valor, setValor] = useState(String(apt.valor));
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>(() =>
    lerRecebimentos(apt),
  );
  const [inserindo, setInserindo] = useState(false);

  const profissionais = getProfissionais().filter((p) => p.ativo);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const preco = Number(valor) || 0;
  const totalRecebido = recebimentos.reduce((s, r) => s + r.valor, 0);
  const saldo = Math.max(preco - totalRecebido, 0);

  function handleSalvar() {
    if (!cliente.trim() || !procedimento.trim()) return;
    const [h, m] = hora.split(":").map(Number);
    const pagamento =
      recebimentos.length === 0
        ? null
        : {
            total: totalRecebido,
            liquido: totalRecebido,
            recebimentos,
          };
    atualizarAgendamento(apt.id, {
      procedimento: procedimento.trim(),
      profissional,
      status,
      data,
      horaInicio: h || 0,
      minutoInicio: m || 0,
      cliente: cliente.trim(),
      telefone: telefone.trim() || undefined,
      valor: preco,
      pagamento,
    });
    onSaved();
  }

  const statusOpcoes: { id: Agendamento["status"]; label: string }[] = [
    { id: "agendado", label: "Agendado" },
    { id: "realizado", label: "Realizado" },
    { id: "cancelado", label: "Cancelado" },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-7 pb-2">
            <div>
              <h2 className="font-display text-xl font-bold text-on-surface">
                Editar agendamento
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                #{apt.id} · {cliente || "Cliente"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-7 py-5 space-y-5">
            {/* Dados do atendimento */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Serviço</label>
                <input
                  type="text"
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Profissional</label>
                  <select
                    value={profissional}
                    onChange={(e) => setProfissional(e.target.value)}
                    className={inputCls}
                  >
                    {!profissionais.some((p) => p.nome === profissional) && (
                      <option value={profissional}>{profissional}</option>
                    )}
                    {profissionais.map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as Agendamento["status"])
                    }
                    className={inputCls}
                  >
                    {statusOpcoes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Data</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Horário</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-on-surface font-display">
                Dados do cliente
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nome</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-on-surface font-display">
                Informações de pagamento
              </p>
              <div>
                <label className={labelCls}>Preço do atendimento</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="rounded-2xl bg-surface-low p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                    Valores recebidos
                  </span>
                  <span className="text-xs font-bold text-on-surface font-body">
                    {brl(totalRecebido)}
                    <span className="text-on-surface-variant font-medium">
                      {" "}
                      / {brl(preco)}
                    </span>
                  </span>
                </div>

                {recebimentos.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {recebimentos.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl bg-surface-lowest px-3 py-2"
                      >
                        <span className="text-sm font-bold text-on-surface font-body">
                          {brl(r.valor)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body bg-primary/10 text-primary">
                          {formaLabel(r.forma)}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-body">
                          {r.data.split("-").reverse().join("/")}
                        </span>
                        {r.anotacoes && (
                          <span className="text-[11px] text-on-surface-variant font-body truncate">
                            · {r.anotacoes}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setRecebimentos(
                              recebimentos.filter((_, j) => j !== i),
                            )
                          }
                          className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {inserindo ? (
                  <InserirPagamento
                    sugestao={saldo}
                    onInserir={(r) => {
                      setRecebimentos([...recebimentos, r]);
                      setInserindo(false);
                    }}
                    onCancelar={() => setInserindo(false)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setInserindo(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-outline-variant/40 text-xs font-semibold font-body text-primary hover:bg-surface-high transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Inserir um pagamento
                  </button>
                )}

                {recebimentos.length > 0 && saldo > 0 && (
                  <p className="text-[11px] text-on-surface-variant font-body mt-2">
                    Falta receber {brl(saldo)}.
                  </p>
                )}
                {recebimentos.length > 0 && saldo === 0 && (
                  <p className="text-[11px] text-secondary font-semibold font-body mt-2 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Pago por completo.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-outline-variant/15 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={!cliente.trim() || !procedimento.trim()}
              className="flex-1 py-3 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
