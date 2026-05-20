"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, AlertTriangle, Check, Circle, ChevronRight } from "lucide-react";
import { getClientes, type Cliente } from "@/lib/clientes";
import {
  type Anamnese,
  getTodasAnamneses,
  temAlertas,
  ANAMNESE_EVENT,
} from "@/lib/anamnese";

type StatusAnamnese = "atencao" | "pendente" | "ok";

interface LinhaAnamnese {
  id: string;
  nome: string;
  avatar: string;
  status: StatusAnamnese;
  data: string;
  alertas: string[];
}

// ordem de prioridade para o sort
const PESO: Record<StatusAnamnese, number> = { atencao: 0, pendente: 1, ok: 2 };

function formatarData(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function alertasDe(a: Anamnese): string[] {
  const out: string[] = [];
  if (a.gestante === "sim") out.push("Gestante");
  if (a.fumante === "sim") out.push("Fumante");
  out.push(...a.condicoes);
  return out;
}

export function AnamnesesLista() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [anamneses, setAnamneses] = useState<Record<string, Anamnese>>({});
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const carregar = () => {
      setClientes(getClientes());
      setAnamneses(getTodasAnamneses());
    };
    carregar();
    setMontado(true);
    window.addEventListener("crm_clientes_updated", carregar);
    window.addEventListener(ANAMNESE_EVENT, carregar);
    return () => {
      window.removeEventListener("crm_clientes_updated", carregar);
      window.removeEventListener(ANAMNESE_EVENT, carregar);
    };
  }, []);

  const linhas = useMemo<LinhaAnamnese[]>(() => {
    return clientes
      .map((c) => {
        const a = anamneses[c.id];
        let status: StatusAnamnese;
        if (!a) status = "pendente";
        else if (temAlertas(a)) status = "atencao";
        else status = "ok";
        return {
          id: c.id,
          nome: c.name,
          avatar: c.avatar,
          status,
          data: a ? formatarData(a.atualizadoEm) : "",
          alertas: a ? alertasDe(a) : [],
        };
      })
      .sort(
        (x, y) =>
          PESO[x.status] - PESO[y.status] || x.nome.localeCompare(y.nome),
      );
  }, [clientes, anamneses]);

  if (!montado) return null;

  const preenchidas = linhas.filter((l) => l.status !== "pendente").length;

  return (
    <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between gap-3 bg-surface-low">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-bold text-on-surface">
            Anamneses
          </h2>
        </div>
        <span className="text-xs font-semibold text-on-surface-variant font-body">
          {preenchidas} de {linhas.length} preenchidas
        </span>
      </div>

      {linhas.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-on-surface-variant font-body">
          Nenhuma cliente cadastrada.
        </p>
      ) : (
        <div className="divide-y divide-outline-variant/10">
          {linhas.map((l) => (
            <Link
              key={l.id}
              href={`/clientes/${l.id}`}
              className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-low transition-colors group"
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-on-primary font-display font-bold text-[11px]">
                {l.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface font-body group-hover:text-primary transition-colors truncate">
                  {l.nome}
                </p>
                {l.status === "atencao" && l.alertas.length > 0 && (
                  <p className="text-[11px] text-on-surface-variant font-body truncate">
                    {l.alertas.join(" · ")}
                  </p>
                )}
              </div>

              {l.status === "atencao" && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold font-body bg-error-container text-on-error-container">
                  <AlertTriangle className="w-3 h-3" />
                  Atenção
                </span>
              )}
              {l.status === "ok" && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold font-body bg-secondary-container text-on-secondary-container">
                  <Check className="w-3 h-3" />
                  Preenchida
                </span>
              )}
              {l.status === "pendente" && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold font-body bg-surface-high text-on-surface-variant">
                  <Circle className="w-3 h-3" />
                  Pendente
                </span>
              )}

              <span className="shrink-0 text-[11px] text-on-surface-variant font-body tabular-nums w-10 text-right">
                {l.data}
              </span>
              <ChevronRight className="w-4 h-4 text-outline-variant shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
