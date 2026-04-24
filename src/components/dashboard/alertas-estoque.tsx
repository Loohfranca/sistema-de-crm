"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Package, ChevronRight } from "lucide-react";
import { getAlertas } from "@/lib/estoque";
import type { AlertaEstoque } from "@/types/produto";

export function AlertasEstoque() {
  const [alertas, setAlertas] = useState<AlertaEstoque[]>([]);

  const carregar = useCallback(() => setAlertas(getAlertas()), []);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_estoque_updated", carregar);
    return () => window.removeEventListener("crm_estoque_updated", carregar);
  }, [carregar]);

  if (alertas.length === 0) return null;

  const criticos = alertas.filter((a) => a.nivel === "critico");
  const baixos = alertas.filter((a) => a.nivel === "baixo");

  return (
    <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
              criticos.length > 0 ? "bg-error-container" : "bg-tertiary-fixed"
            }`}
          >
            {criticos.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-on-error-container" />
            ) : (
              <Package className="w-4 h-4 text-on-tertiary-container" />
            )}
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-on-surface">
              Estoque
            </h3>
            <p className="text-xs text-on-surface-variant font-body">
              {criticos.length > 0
                ? `${criticos.length} ${criticos.length === 1 ? "produto crítico" : "produtos críticos"}${baixos.length ? ` · ${baixos.length} baixo${baixos.length === 1 ? "" : "s"}` : ""}`
                : `${baixos.length} ${baixos.length === 1 ? "produto em nível baixo" : "produtos em nível baixo"}`}
            </p>
          </div>
        </div>
        <Link
          href="/configuracoes"
          className="text-on-surface-variant hover:text-primary transition-colors"
          aria-label="Ir para estoque"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {alertas.slice(0, 5).map((a) => (
          <div
            key={a.produto.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-surface-low"
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                a.nivel === "critico" ? "bg-error" : "bg-tertiary"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface font-body truncate">
                {a.produto.nome}
              </p>
              <p className="text-[11px] text-on-surface-variant font-body">
                {a.produto.quantidadeAtual} {a.produto.unidade} · mín. {a.produto.quantidadeMinima}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold font-body px-2 py-0.5 rounded-full ${
                a.nivel === "critico"
                  ? "bg-error-container text-on-error-container"
                  : "bg-tertiary-container text-on-tertiary-container"
              }`}
            >
              {a.nivel === "critico" ? "CRÍTICO" : "BAIXO"}
            </span>
          </div>
        ))}
        {alertas.length > 5 && (
          <p className="text-[11px] text-on-surface-variant font-body text-center pt-1">
            + {alertas.length - 5} outros produtos
          </p>
        )}
      </div>
    </div>
  );
}
