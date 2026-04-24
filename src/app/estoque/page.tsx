"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Package, DollarSign } from "lucide-react";
import { getAlertas, getProdutos } from "@/lib/estoque";
import { formatBRL } from "@/lib/financeiro";
import type { Produto } from "@/types/produto";
import { EstoqueSection } from "@/components/configuracoes/estoque-section";

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const carregar = useCallback(() => setProdutos(getProdutos()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_estoque_updated", carregar);
    return () => window.removeEventListener("crm_estoque_updated", carregar);
  }, [carregar]);

  const alertas = getAlertas();
  const criticos = alertas.filter((a) => a.nivel === "critico").length;
  const valorTotal = produtos.reduce(
    (acc, p) => acc + p.quantidadeAtual * p.custoUnitario,
    0,
  );

  const stats = [
    {
      label: "Produtos cadastrados",
      value: String(produtos.length),
      icon: Package,
      color: "bg-primary-fixed",
      iconColor: "text-on-primary-fixed",
    },
    {
      label: alertas.length > 0 ? "Em alerta" : "Estoque saudável",
      value: alertas.length > 0 ? String(alertas.length) : "✓",
      icon: AlertTriangle,
      color: criticos > 0 ? "bg-error-container" : alertas.length > 0 ? "bg-tertiary-fixed" : "bg-secondary-fixed",
      iconColor:
        criticos > 0
          ? "text-on-error-container"
          : alertas.length > 0
            ? "text-on-tertiary-container"
            : "text-on-secondary-container",
    },
    {
      label: "Valor em estoque",
      value: formatBRL(valorTotal),
      icon: DollarSign,
      color: "bg-secondary-fixed",
      iconColor: "text-on-secondary-container",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Estoque
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Estoque
        </h1>
        <p className="text-on-surface-variant font-body mt-1">
          Controle de insumos descontados automaticamente a cada atendimento
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-lowest rounded-2xl p-5 shadow-ambient">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <p className="font-display text-lg font-bold text-on-surface leading-tight">
              {s.value}
            </p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Seção de produtos (reutiliza o componente já existente) */}
      <EstoqueSection />

      {/* Dica */}
      <p className="text-xs text-on-surface-variant font-body text-center">
        Para vincular materiais a um serviço, vá em <span className="font-semibold">Configurações → Serviços</span> e clique no ícone 📦
      </p>
    </div>
  );
}
