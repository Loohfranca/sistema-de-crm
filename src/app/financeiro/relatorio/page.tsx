"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { getLancamentos, formatBRL } from "@/lib/financeiro";
import type { Lancamento } from "@/types/financeiro";
import {
  calcularResumo,
  filtrarPorMes,
  isoToBR,
  FORMA_LABEL,
  MESES_LONGOS,
} from "@/lib/export/contador";

interface Perfil {
  nome: string;
  especialidade: string;
  email?: string;
  telefone?: string;
}

interface Clinica {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
}

const PERFIL_PADRAO: Perfil = {
  nome: "Dra. Helena Martins",
  especialidade: "Dermatologista - CRM 12345/SP",
};

const CLINICA_PADRAO: Clinica = {
  nome: "Gabelia Beauty Studio",
  cnpj: "12.345.678/0001-90",
  endereco: "Rua Oscar Freire, 2000 - Jardins, São Paulo - SP",
  telefone: "(11) 3000-0000",
};

function RelatorioContent() {
  const search = useSearchParams();
  const router = useRouter();

  const hoje = new Date();
  const mes = Number(search.get("mes") ?? hoje.getMonth());
  const ano = Number(search.get("ano") ?? hoje.getFullYear());
  const autoPrint = search.get("print") === "1";

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO);
  const [clinica, setClinica] = useState<Clinica>(CLINICA_PADRAO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setLancamentos(getLancamentos());
    try {
      const rawPerfil = localStorage.getItem("crm_perfil");
      if (rawPerfil) setPerfil(JSON.parse(rawPerfil));
      const rawClinica = localStorage.getItem("crm_clinica");
      if (rawClinica) setClinica(JSON.parse(rawClinica));
    } catch {
      // mantém defaults
    }
    setCarregado(true);
  }, []);

  const doMes = useMemo(
    () => filtrarPorMes(lancamentos, mes, ano),
    [lancamentos, mes, ano],
  );
  const resumo = useMemo(() => calcularResumo(doMes), [doMes]);
  const entradas = useMemo(() => doMes.filter((l) => l.tipo === "entrada"), [doMes]);
  const saidas = useMemo(() => doMes.filter((l) => l.tipo === "saida"), [doMes]);

  useEffect(() => {
    if (!carregado || !autoPrint) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [carregado, autoPrint]);

  const geradoEm = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-surface-low print:bg-white">
      {/* Barra de ações — escondida na impressão */}
      <div className="no-print sticky top-0 z-10 bg-surface-lowest/90 backdrop-blur border-b border-outline-variant/20">
        <div className="max-w-[900px] mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/financeiro")}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface font-body transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Folha do relatório */}
      <div className="relatorio max-w-[900px] mx-auto px-12 py-12 print:p-0 print:max-w-none">
        {/* Cabeçalho */}
        <header className="mb-10 pb-8 border-b border-outline-variant/30">
          <p className="text-[11px] text-on-surface-variant font-body uppercase tracking-[0.25em] mb-2">
            Relatório Financeiro Mensal
          </p>
          <h1 className="font-display text-4xl font-bold text-on-surface leading-tight mb-1">
            {clinica.nome}
          </h1>
          <p className="text-sm text-on-surface-variant font-body">
            CNPJ {clinica.cnpj} · {clinica.endereco}
          </p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-on-surface-variant font-body uppercase tracking-wider mb-1">
                Período
              </p>
              <p className="font-display text-2xl font-bold text-primary">
                {MESES_LONGOS[mes]} {ano}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-on-surface-variant font-body uppercase tracking-wider mb-1">
                Responsável
              </p>
              <p className="text-sm font-semibold text-on-surface font-body">{perfil.nome}</p>
              <p className="text-xs text-on-surface-variant font-body">{perfil.especialidade}</p>
            </div>
          </div>
        </header>

        {/* Resumo principal */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold text-on-surface mb-4">Resumo</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-2xl bg-surface-lowest p-5 shadow-ambient print:shadow-none print:border print:border-outline-variant/30">
              <p className="text-[10px] text-on-surface-variant font-body uppercase tracking-wider mb-1.5">
                Faturamento bruto
              </p>
              <p className="font-display text-lg font-bold text-on-surface">
                {formatBRL(resumo.totalBruto)}
              </p>
              <p className="text-[11px] text-on-surface-variant font-body mt-0.5">
                {resumo.quantidadeEntradas} {resumo.quantidadeEntradas === 1 ? "entrada" : "entradas"}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-lowest p-5 shadow-ambient print:shadow-none print:border print:border-outline-variant/30">
              <p className="text-[10px] text-on-surface-variant font-body uppercase tracking-wider mb-1.5">
                Taxas de cartão
              </p>
              <p className="font-display text-lg font-bold text-error">
                − {formatBRL(resumo.totalTaxas)}
              </p>
              <p className="text-[11px] text-on-surface-variant font-body mt-0.5">
                Deduzidas das entradas
              </p>
            </div>
            <div className="rounded-2xl bg-surface-lowest p-5 shadow-ambient print:shadow-none print:border print:border-outline-variant/30">
              <p className="text-[10px] text-on-surface-variant font-body uppercase tracking-wider mb-1.5">
                Despesas
              </p>
              <p className="font-display text-lg font-bold text-on-surface">
                − {formatBRL(resumo.totalSaidas)}
              </p>
              <p className="text-[11px] text-on-surface-variant font-body mt-0.5">
                {resumo.quantidadeSaidas} {resumo.quantidadeSaidas === 1 ? "saída" : "saídas"}
              </p>
            </div>
            <div className="rounded-2xl bg-primary-fixed p-5 shadow-ambient print:shadow-none print:border print:border-primary/30">
              <p className="text-[10px] text-on-primary-fixed font-body uppercase tracking-wider mb-1.5">
                Saldo líquido
              </p>
              <p
                className={`font-display text-lg font-bold ${
                  resumo.saldo >= 0 ? "text-on-primary-fixed" : "text-error"
                }`}
              >
                {formatBRL(resumo.saldo)}
              </p>
              <p className="text-[11px] text-on-primary-fixed/80 font-body mt-0.5">
                Resultado do mês
              </p>
            </div>
          </div>
        </section>

        {/* Entradas por método */}
        {resumo.entradasPorMetodo.length > 0 && (
          <section className="mb-10 break-inside-avoid">
            <h2 className="font-display text-lg font-bold text-on-surface mb-4">
              Entradas por forma de pagamento
            </h2>
            <div className="rounded-2xl bg-surface-lowest overflow-hidden print:border print:border-outline-variant/30">
              <table className="w-full text-sm font-body">
                <thead className="bg-surface-high print:bg-surface-low">
                  <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Método</th>
                    <th className="px-5 py-3 font-semibold text-center">Qtd.</th>
                    <th className="px-5 py-3 font-semibold text-right">Bruto</th>
                    <th className="px-5 py-3 font-semibold text-right">Taxa</th>
                    <th className="px-5 py-3 font-semibold text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.entradasPorMetodo.map((e) => (
                    <tr
                      key={e.metodo}
                      className="border-t border-outline-variant/15 text-on-surface"
                    >
                      <td className="px-5 py-3 font-semibold">{e.metodo}</td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {e.quantidade}
                      </td>
                      <td className="px-5 py-3 text-right">{formatBRL(e.bruto)}</td>
                      <td className="px-5 py-3 text-right text-error">
                        {e.taxa > 0 ? `− ${formatBRL(e.taxa)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {formatBRL(e.liquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-outline-variant/30 bg-surface-low">
                    <td className="px-5 py-3 font-bold font-display text-on-surface" colSpan={2}>
                      Total
                    </td>
                    <td className="px-5 py-3 text-right font-bold">
                      {formatBRL(resumo.totalBruto)}
                    </td>
                    <td className="px-5 py-3 text-right text-error font-bold">
                      − {formatBRL(resumo.totalTaxas)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold font-display text-primary">
                      {formatBRL(resumo.totalEntradas)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Saídas por categoria */}
        {resumo.saidasPorCategoria.length > 0 && (
          <section className="mb-10 break-inside-avoid">
            <h2 className="font-display text-lg font-bold text-on-surface mb-4">
              Despesas por categoria
            </h2>
            <div className="rounded-2xl bg-surface-lowest overflow-hidden print:border print:border-outline-variant/30">
              <table className="w-full text-sm font-body">
                <thead className="bg-surface-high print:bg-surface-low">
                  <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Categoria</th>
                    <th className="px-5 py-3 font-semibold text-center">Qtd.</th>
                    <th className="px-5 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.saidasPorCategoria.map((s) => (
                    <tr
                      key={s.categoria}
                      className="border-t border-outline-variant/15 text-on-surface"
                    >
                      <td className="px-5 py-3 font-semibold">{s.categoria}</td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {s.quantidade}
                      </td>
                      <td className="px-5 py-3 text-right">{formatBRL(s.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-outline-variant/30 bg-surface-low">
                    <td className="px-5 py-3 font-bold font-display text-on-surface" colSpan={2}>
                      Total
                    </td>
                    <td className="px-5 py-3 text-right font-bold font-display text-error">
                      {formatBRL(resumo.totalSaidas)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Detalhamento completo */}
        {entradas.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-lg font-bold text-on-surface mb-4">
              Detalhamento — Entradas
            </h2>
            <div className="rounded-2xl bg-surface-lowest overflow-hidden print:border print:border-outline-variant/30">
              <table className="w-full text-xs font-body">
                <thead className="bg-surface-high print:bg-surface-low">
                  <tr className="text-left text-[10px] text-on-surface-variant uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-semibold">Data</th>
                    <th className="px-4 py-2.5 font-semibold">Descrição</th>
                    <th className="px-4 py-2.5 font-semibold">Categoria</th>
                    <th className="px-4 py-2.5 font-semibold">Pagto.</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Bruto</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((l) => {
                    const liquido = l.dadosCartao?.valorLiquidoPrevisto ?? l.valor;
                    const forma = l.formaPagamento
                      ? `${FORMA_LABEL[l.formaPagamento]}${l.dadosCartao?.parcelas ? ` ${l.dadosCartao.parcelas}x` : ""}`
                      : "—";
                    return (
                      <tr
                        key={l.id}
                        className="border-t border-outline-variant/15 text-on-surface"
                      >
                        <td className="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">
                          {isoToBR(l.data)}
                        </td>
                        <td className="px-4 py-2.5 font-medium">{l.descricao}</td>
                        <td className="px-4 py-2.5 text-on-surface-variant">
                          {l.categoria ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-on-surface-variant">{forma}</td>
                        <td className="px-4 py-2.5 text-right">{formatBRL(l.valor)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          {formatBRL(liquido)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {saidas.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-lg font-bold text-on-surface mb-4">
              Detalhamento — Saídas
            </h2>
            <div className="rounded-2xl bg-surface-lowest overflow-hidden print:border print:border-outline-variant/30">
              <table className="w-full text-xs font-body">
                <thead className="bg-surface-high print:bg-surface-low">
                  <tr className="text-left text-[10px] text-on-surface-variant uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-semibold">Data</th>
                    <th className="px-4 py-2.5 font-semibold">Descrição</th>
                    <th className="px-4 py-2.5 font-semibold">Categoria</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {saidas.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-outline-variant/15 text-on-surface"
                    >
                      <td className="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">
                        {isoToBR(l.data)}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{l.descricao}</td>
                      <td className="px-4 py-2.5 text-on-surface-variant">
                        {l.categoria ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-error font-semibold">
                        − {formatBRL(l.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="pt-6 mt-10 border-t border-outline-variant/30 text-[11px] text-on-surface-variant font-body flex items-center justify-between">
          <span>Gerado em {geradoEm}</span>
          <span>{clinica.nome} · {clinica.telefone}</span>
        </footer>

        {doMes.length === 0 && carregado && (
          <div className="text-center py-16 text-on-surface-variant font-body">
            Nenhum lançamento encontrado para {MESES_LONGOS[mes]} de {ano}.
          </div>
        )}
      </div>
    </div>
  );
}

export default function RelatorioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-low" />}>
      <RelatorioContent />
    </Suspense>
  );
}
