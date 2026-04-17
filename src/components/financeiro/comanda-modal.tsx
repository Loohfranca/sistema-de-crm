"use client";

import { useState, useEffect } from "react";
import {
  X, Check, CreditCard, Banknote, Smartphone, Building2, Receipt,
} from "lucide-react";
import type { Agendamento } from "@/lib/store";
import {
  calcTaxa, formatBRL, TAXAS_METODO, TAXA_CREDITO_PARCELAS,
  type Pagamento, type Parcela,
} from "@/lib/financeiro";

const PAYMENT_METHODS = [
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "pix", label: "PIX", icon: Smartphone },
  { id: "debito", label: "Débito", icon: CreditCard },
  { id: "credito", label: "Crédito", icon: CreditCard },
];

export function ComandaModal({ apt, onClose, onConfirm }: {
  apt: Agendamento;
  onClose: () => void;
  onConfirm: (pag: Pagamento) => void;
}) {
  const [method, setMethod] = useState("pix");
  const [parcelas, setParcelas] = useState(1);
  const [desconto, setDesconto] = useState(0);
  const [useMaquininha, setUseMaquininha] = useState(false);

  const totalBruto = Math.max(apt.valor - desconto, 0);

  const canUseMaquininha = method === "credito" || method === "debito";
  const taxaPct =
    (canUseMaquininha && useMaquininha)
      ? (method === "credito" ? (TAXA_CREDITO_PARCELAS[parcelas] ?? 3.99) : TAXAS_METODO.debito)
      : (method === "pix" ? TAXAS_METODO.pix : 0);

  const taxaValor = calcTaxa(totalBruto, taxaPct);
  const liquido = totalBruto - taxaValor;
  const temTaxa = taxaPct > 0;

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function gerarParcelas(): Parcela[] {
    const vp = Math.floor((totalBruto / parcelas) * 100) / 100;
    const hoje = new Date();
    return Array.from({ length: parcelas }, (_, i) => {
      const venc = new Date(hoje); venc.setMonth(venc.getMonth() + i + 1);
      return {
        numero: i + 1,
        valor: i === parcelas - 1 ? totalBruto - vp * (parcelas - 1) : vp,
        vencimento: `${String(venc.getDate()).padStart(2, "0")}/${String(venc.getMonth() + 1).padStart(2, "0")}/${venc.getFullYear()}`,
        pago: false,
      };
    });
  }

  function handleConfirm() {
    const hoje = new Date();
    const dataHoje = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
    const pag: Pagamento =
      method === "credito"
        ? { metodo: "credito", total: totalBruto, taxa: taxaPct, taxaValor, liquido, numeroParcelas: parcelas, parcelas: gerarParcelas() }
        : { metodo: method as "dinheiro" | "pix" | "debito", total: totalBruto, taxa: taxaPct, taxaValor, liquido, dataPagamento: dataHoje };
    onConfirm(pag);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-lowest rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" style={{ animation: "tooltipIn 0.2s ease both" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center">
              <Receipt className="w-4 h-4 text-on-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-on-surface">Registrar Pagamento</h2>
              <p className="text-xs text-on-surface-variant font-body">{apt.cliente} · {apt.procedimento}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          {/* Desconto */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold font-display text-on-surface">Valor do atendimento</p>
              <p className="text-2xl font-bold font-display text-primary">{formatBRL(apt.valor)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant font-body">Desconto R$</span>
              <input type="number" value={desconto} onChange={e => setDesconto(Number(e.target.value))} min={0} max={apt.valor}
                className="w-20 px-3 py-2 rounded-xl bg-surface-high text-on-surface text-sm font-body text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* Formas de pagamento */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-body mb-3">Forma de Recebimento</p>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setMethod(id); if (id !== "credito") setParcelas(1); if (id === "pix" || id === "dinheiro") setUseMaquininha(false); }}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl text-xs font-semibold font-body transition-all border-2 ${method === id
                      ? "gradient-primary text-on-primary shadow-ambient border-transparent"
                      : "bg-surface-high text-on-surface-variant hover:bg-surface-highest border-transparent"
                    }`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle maquininha */}
          {canUseMaquininha && (
            <button onClick={() => setUseMaquininha(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all border ${useMaquininha ? "bg-primary-container border-primary/30" : "bg-surface-high border-outline-variant/20 hover:bg-surface-highest"
                }`}>
              <div className="flex items-center gap-3">
                <Building2 className={`w-4 h-4 ${useMaquininha ? "text-primary" : "text-on-surface-variant"}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold font-body ${useMaquininha ? "text-on-primary-container" : "text-on-surface"}`}>
                    Cobrado via maquininha (PagSeguro)
                  </p>
                  {useMaquininha && (
                    <p className="text-[10px] text-on-primary-container/70 font-body">
                      Taxa de {taxaPct.toFixed(2)}% será descontada
                    </p>
                  )}
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${useMaquininha ? "bg-primary" : "bg-outline-variant"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${useMaquininha ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </button>
          )}

          {/* Parcelamento */}
          {method === "credito" && useMaquininha && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-body mb-3">Parcelamento</p>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <button key={n} onClick={() => setParcelas(n)}
                    className={`py-2 rounded-xl text-xs font-semibold font-body transition-all flex flex-col items-center ${parcelas === n ? "bg-primary text-on-primary" : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                      }`}>
                    <span>{n}x</span>
                    <span className={`text-[8px] mt-0.5 ${parcelas === n ? "text-on-primary/70" : "text-outline"}`}>
                      {TAXA_CREDITO_PARCELAS[n]}%
                    </span>
                  </button>
                ))}
              </div>
              {parcelas > 1 && (
                <p className="text-xs text-on-surface-variant font-body ml-1">
                  {parcelas}x de {formatBRL(totalBruto / parcelas)} · Taxa: {taxaPct.toFixed(2)}%
                </p>
              )}
            </div>
          )}

          {/* Resumo financeiro */}
          <div className={`rounded-2xl p-4 space-y-2 ${temTaxa ? "bg-error-container/20" : "bg-secondary-fixed/40"}`}>
            <div className="flex justify-between text-sm font-body">
              <span className="text-on-surface-variant">Total a cobrar</span>
              <span className="font-semibold text-on-surface">{formatBRL(totalBruto)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-sm font-body">
                <span className="text-on-surface-variant">Desconto aplicado</span>
                <span className="font-semibold text-error">− {formatBRL(desconto)}</span>
              </div>
            )}
            {temTaxa && (
              <div className="flex justify-between text-sm font-body">
                <span className="text-on-surface-variant flex items-center gap-1">
                  Taxa maquininha
                  <span className="text-[10px] bg-error-container text-on-error-container px-1.5 py-0.5 rounded-full font-semibold">{taxaPct.toFixed(2)}%</span>
                </span>
                <span className="font-semibold text-error">− {formatBRL(taxaValor)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-outline-variant/20">
              <span className="text-sm font-bold font-body text-on-surface">{temTaxa ? "Você recebe (líquido)" : "Você recebe"}</span>
              <span className="font-display text-xl font-bold text-on-surface">{formatBRL(temTaxa ? liquido : totalBruto)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-outline-variant/20 shrink-0">
          <button onClick={handleConfirm} className="w-full py-3.5 rounded-2xl gradient-primary text-on-primary text-base font-bold font-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Check className="w-5 h-5" />
            Confirmar · receber {formatBRL(temTaxa ? liquido : totalBruto)}
          </button>
        </div>
      </div>
    </div>
  );
}
