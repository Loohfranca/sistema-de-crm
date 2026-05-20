"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarCheck,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { getAgendamentos, type Agendamento } from "@/lib/store";
import {
  getDespesas,
  excluirDespesa,
  coletarReceitas,
  categoriaInfo,
  FORMAS,
  PERIODOS,
  noPeriodo,
  mesesRecentes,
  brl,
  GESTAO_EVENT,
  type Despesa,
  type Periodo,
} from "@/lib/gestao";
import {
  GraficoBarras,
  GraficoLinhas,
  GraficoRosca,
} from "@/components/gestao/graficos";
import { DespesaModal } from "@/components/gestao/despesa-modal";

type SubAba = "gestao" | "caixa" | "registros";

const COR_RECEITA = "#b9657f";
const COR_DESPESA = "#da432d";
const COR_LUCRO = "#5a8a7d";

function mesmoMes(dataISO: string, ano: number, mes: number): boolean {
  return (
    Number(dataISO.slice(0, 4)) === ano &&
    Number(dataISO.slice(5, 7)) - 1 === mes
  );
}

// ─── Card base ───────────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface-lowest rounded-3xl p-6 shadow-ambient ${className}`}
    >
      {children}
    </div>
  );
}

// ─── KPI ─────────────────────────────────────────────────────────────────────
function Kpi({
  icone,
  rotulo,
  valor,
  tom,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  tom: "receita" | "despesa" | "lucro" | "neutro";
}) {
  const cls = {
    receita: "bg-primary/10 text-primary",
    despesa: "bg-error-container text-on-error-container",
    lucro: "bg-secondary-container text-on-secondary-container",
    neutro: "bg-surface-high text-on-surface-variant",
  }[tom];
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls}`}
        >
          {icone}
        </div>
        <span className="text-xs text-on-surface-variant font-body">
          {rotulo}
        </span>
      </div>
      <p className="font-display text-2xl font-bold text-on-surface">{valor}</p>
    </Card>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function GestaoPage() {
  const [montado, setMontado] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [subAba, setSubAba] = useState<SubAba>("gestao");
  const [modalDespesa, setModalDespesa] = useState(false);

  const carregar = useCallback(() => {
    setAgendamentos(getAgendamentos());
    setDespesas(getDespesas());
  }, []);

  useEffect(() => {
    carregar();
    setMontado(true);
    window.addEventListener("crm_agenda_updated", carregar);
    window.addEventListener(GESTAO_EVENT, carregar);
    return () => {
      window.removeEventListener("crm_agenda_updated", carregar);
      window.removeEventListener(GESTAO_EVENT, carregar);
    };
  }, [carregar]);

  const receitas = useMemo(
    () => coletarReceitas(agendamentos),
    [agendamentos],
  );

  // Dados do período selecionado
  const periodoDados = useMemo(() => {
    const recP = receitas.filter((r) => noPeriodo(r.data, periodo));
    const despP = despesas.filter((d) => noPeriodo(d.data, periodo));
    const totalReceita = recP.reduce((s, r) => s + r.valor, 0);
    const totalDespesa = despP.reduce((s, d) => s + d.valor, 0);
    const lucro = totalReceita - totalDespesa;
    const margem = totalReceita > 0 ? (lucro / totalReceita) * 100 : 0;
    const agendados = agendamentos.filter((a) =>
      noPeriodo(a.data, periodo),
    ).length;

    const porForma = FORMAS.map((f) => ({
      ...f,
      valor: recP
        .filter((r) => r.forma === f.id)
        .reduce((s, r) => s + r.valor, 0),
    })).filter((f) => f.valor > 0);

    return {
      recP,
      despP,
      totalReceita,
      totalDespesa,
      lucro,
      margem,
      agendados,
      porForma,
    };
  }, [receitas, despesas, agendamentos, periodo]);

  // Série de 6 meses para os gráficos
  const serie6m = useMemo(() => {
    const meses = mesesRecentes(6);
    return meses.map((m) => {
      const rec = receitas
        .filter((r) => mesmoMes(r.data, m.ano, m.mes))
        .reduce((s, r) => s + r.valor, 0);
      const desp = despesas
        .filter((d) => mesmoMes(d.data, m.ano, m.mes))
        .reduce((s, d) => s + d.valor, 0);
      return { label: m.label, receita: rec, despesa: desp, lucro: rec - desp };
    });
  }, [receitas, despesas]);

  const total6mReceita = serie6m.reduce((s, m) => s + m.receita, 0);
  const total6mLucro = serie6m.reduce((s, m) => s + m.lucro, 0);
  const margem6m =
    total6mReceita > 0 ? (total6mLucro / total6mReceita) * 100 : 0;

  // Despesas por categoria (período)
  const despesasPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of periodoDados.despP) {
      map.set(d.categoria, (map.get(d.categoria) ?? 0) + d.valor);
    }
    return [...map.entries()]
      .map(([cat, valor]) => {
        const info = categoriaInfo(cat as Despesa["categoria"]);
        return { label: info.label, valor, cor: info.cor };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [periodoDados.despP]);

  if (!montado) return null;

  return (
    <div className="space-y-7">
      {modalDespesa && (
        <DespesaModal
          onClose={() => setModalDespesa(false)}
          onSaved={() => {
            setModalDespesa(false);
            carregar();
          }}
        />
      )}

      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Financeiro
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Gestão
        </h1>
        <p className="text-on-surface-variant font-body mt-1">
          Receitas entram automático quando você dá baixa nos atendimentos.
        </p>
      </div>

      {/* Sub-abas */}
      <div className="flex gap-2">
        {(
          [
            { id: "gestao", label: "Gestão" },
            { id: "caixa", label: "Caixa" },
            { id: "registros", label: "Registros" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubAba(t.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium font-body transition-all ${
              subAba === t.id
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subAba !== "gestao" ? (
        <Card className="py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-high flex items-center justify-center">
            <Lock className="w-5 h-5 text-on-surface-variant" />
          </div>
          <p className="font-display text-lg font-bold text-on-surface">
            {subAba === "caixa" ? "Caixa" : "Registros"}
          </p>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            Em breve — próxima etapa.
          </p>
        </Card>
      ) : (
        <>
          {/* Filtro de período + nova despesa */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium font-body transition-all whitespace-nowrap ${
                    periodo === p.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setModalDespesa(true)}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nova despesa
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              icone={<TrendingUp className="w-4 h-4" />}
              rotulo="Receitas"
              valor={brl(periodoDados.totalReceita)}
              tom="receita"
            />
            <Kpi
              icone={<TrendingDown className="w-4 h-4" />}
              rotulo="Despesas"
              valor={brl(periodoDados.totalDespesa)}
              tom="despesa"
            />
            <Kpi
              icone={<Wallet className="w-4 h-4" />}
              rotulo="Lucro"
              valor={brl(periodoDados.lucro)}
              tom="lucro"
            />
            <Kpi
              icone={<CalendarCheck className="w-4 h-4" />}
              rotulo="Agendamentos"
              valor={String(periodoDados.agendados)}
              tom="neutro"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Receitas — gráfico */}
            <Card>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-on-surface">
                    Receitas
                  </h2>
                  <p className="text-xs text-on-surface-variant font-body">
                    Últimos 6 meses
                  </p>
                </div>
                <span className="font-display text-xl font-bold text-primary">
                  {brl(total6mReceita)}
                </span>
              </div>
              <GraficoBarras
                dados={serie6m.map((m) => ({
                  label: m.label,
                  valor: m.receita,
                }))}
              />
            </Card>

            {/* Detalhes da receita */}
            <Card>
              <h2 className="font-display text-lg font-bold text-on-surface mb-1">
                Detalhes da receita
              </h2>
              <p className="text-xs text-on-surface-variant font-body mb-4">
                Por forma de pagamento — período selecionado
              </p>
              {periodoDados.porForma.length === 0 ? (
                <p className="text-sm text-on-surface-variant font-body py-6 text-center">
                  Sem receitas no período.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {periodoDados.porForma.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: f.cor }}
                      />
                      <span className="text-sm font-medium text-on-surface font-body flex-1">
                        {f.label}
                      </span>
                      <span className="text-sm font-bold text-on-surface font-body">
                        {brl(f.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Lucro — gráfico de linhas */}
            <Card className="lg:col-span-2">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
                <h2 className="font-display text-lg font-bold text-on-surface">
                  Lucro
                </h2>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-xl font-bold text-secondary">
                    {brl(total6mLucro)}
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant font-body">
                    margem {margem6m.toFixed(0)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-body mb-4">
                Receita, despesa e lucro — últimos 6 meses
              </p>
              <GraficoLinhas
                labels={serie6m.map((m) => m.label)}
                series={[
                  {
                    nome: "Receita",
                    cor: COR_RECEITA,
                    valores: serie6m.map((m) => m.receita),
                  },
                  {
                    nome: "Despesa",
                    cor: COR_DESPESA,
                    valores: serie6m.map((m) => m.despesa),
                  },
                  {
                    nome: "Lucro",
                    cor: COR_LUCRO,
                    valores: serie6m.map((m) => m.lucro),
                  },
                ]}
              />
            </Card>

            {/* Despesas — rosca */}
            <Card>
              <h2 className="font-display text-lg font-bold text-on-surface mb-1">
                Despesas
              </h2>
              <p className="text-xs text-on-surface-variant font-body mb-4">
                Por categoria — período selecionado
              </p>
              <GraficoRosca fatias={despesasPorCategoria} />
            </Card>

            {/* Detalhes de despesas */}
            <Card>
              <h2 className="font-display text-lg font-bold text-on-surface mb-1">
                Detalhes de despesas
              </h2>
              <p className="text-xs text-on-surface-variant font-body mb-4">
                Lançamentos do período
              </p>
              {periodoDados.despP.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-on-surface-variant font-body">
                    Nenhuma despesa lançada.
                  </p>
                  <button
                    onClick={() => setModalDespesa(true)}
                    className="mt-3 text-xs font-semibold text-primary font-body hover:opacity-80 transition-opacity"
                  >
                    Lançar primeira despesa
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {periodoDados.despP
                    .slice()
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((d) => {
                      const info = categoriaInfo(d.categoria);
                      return (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-2.5"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: info.cor }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-on-surface font-body truncate">
                              {d.descricao || info.label}
                            </p>
                            <p className="text-[11px] text-on-surface-variant font-body">
                              {info.label} ·{" "}
                              {d.data.split("-").reverse().join("/")}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-on-surface font-body shrink-0">
                            {brl(d.valor)}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("Excluir esta despesa?")) {
                                setDespesas(excluirDespesa(d.id));
                              }
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
