// ─── Controle de estoque ─────────────────────────────────────────────────────
// Produtos (insumos) + vínculo produto ↔ serviço.
// Quando atendimento vira "realizado", consumirMateriais é chamado pelo store.

import type { Produto, MaterialServico, AlertaEstoque } from "@/types/produto";
import { getServicos } from "./servicos";

const PRODUTOS_KEY = "crm_produtos_v1";
const MATERIAIS_KEY = "crm_materiais_servico_v1";
const EVENT = "crm_estoque_updated";

const PRODUTOS_PADRAO: Produto[] = [
  { id: "p1", nome: "Allergan Botox 100U", unidade: "ampola", quantidadeAtual: 3, quantidadeMinima: 2, custoUnitario: 2000, categoria: "Injetável" },
  { id: "p2", nome: "Juvederm Ultra Plus 1ml", unidade: "seringa", quantidadeAtual: 2, quantidadeMinima: 2, custoUnitario: 1200, categoria: "Injetável" },
  { id: "p3", nome: "Agulha 30G", unidade: "un", quantidadeAtual: 450, quantidadeMinima: 100, custoUnitario: 2, categoria: "Descartável" },
  { id: "p4", nome: "Luva nitrila P", unidade: "caixa", quantidadeAtual: 8, quantidadeMinima: 3, custoUnitario: 60, categoria: "Descartável" },
  { id: "p5", nome: "Anestésico EMLA 30g", unidade: "bisnaga", quantidadeAtual: 4, quantidadeMinima: 2, custoUnitario: 45, categoria: "Tópico" },
  { id: "p6", nome: "Ácido Mandélico 20%", unidade: "frasco", quantidadeAtual: 1, quantidadeMinima: 2, custoUnitario: 180, categoria: "Peeling" },
];

// Vínculos padrão: associa os serviços seed aos produtos seed
const MATERIAIS_PADRAO: MaterialServico[] = [
  // s1 — Limpeza de Pele Profissional
  { servicoId: "s1", produtoId: "p4", quantidade: 0.02 },
  // s2 — Botox Frontal e Glabela
  { servicoId: "s2", produtoId: "p1", quantidade: 0.4 },
  { servicoId: "s2", produtoId: "p3", quantidade: 3 },
  { servicoId: "s2", produtoId: "p4", quantidade: 0.02 },
  { servicoId: "s2", produtoId: "p5", quantidade: 0.1 },
  // s3 — Preenchimento Labial
  { servicoId: "s3", produtoId: "p2", quantidade: 1 },
  { servicoId: "s3", produtoId: "p3", quantidade: 2 },
  { servicoId: "s3", produtoId: "p4", quantidade: 0.02 },
  { servicoId: "s3", produtoId: "p5", quantidade: 0.15 },
  // s4 — Peeling Químico Mandélico
  { servicoId: "s4", produtoId: "p6", quantidade: 0.15 },
  { servicoId: "s4", produtoId: "p4", quantidade: 0.01 },
];

// ─── Produtos ───────────────────────────────────────────────────────────────
export function getProdutos(): Produto[] {
  if (typeof window === "undefined") return PRODUTOS_PADRAO;
  const raw = localStorage.getItem(PRODUTOS_KEY);
  if (!raw) {
    localStorage.setItem(PRODUTOS_KEY, JSON.stringify(PRODUTOS_PADRAO));
    return PRODUTOS_PADRAO;
  }
  try {
    return JSON.parse(raw) as Produto[];
  } catch {
    return PRODUTOS_PADRAO;
  }
}

function salvarProdutos(dados: Produto[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUTOS_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event(EVENT));
}

export function adicionarProduto(produto: Omit<Produto, "id">): Produto[] {
  const lista = getProdutos();
  const novo: Produto = { ...produto, id: `p${Date.now()}` };
  const atualizada = [...lista, novo];
  salvarProdutos(atualizada);
  return atualizada;
}

export function editarProduto(produto: Produto): Produto[] {
  const lista = getProdutos();
  const atualizada = lista.map((p) => (p.id === produto.id ? produto : p));
  salvarProdutos(atualizada);
  return atualizada;
}

export function removerProduto(id: string): Produto[] {
  const lista = getProdutos().filter((p) => p.id !== id);
  salvarProdutos(lista);
  const vinculos = getMateriais().filter((m) => m.produtoId !== id);
  salvarMateriais(vinculos);
  return lista;
}

// ─── Materiais (vínculos) ───────────────────────────────────────────────────
export function getMateriais(): MaterialServico[] {
  if (typeof window === "undefined") return MATERIAIS_PADRAO;
  const raw = localStorage.getItem(MATERIAIS_KEY);
  if (!raw) {
    localStorage.setItem(MATERIAIS_KEY, JSON.stringify(MATERIAIS_PADRAO));
    return MATERIAIS_PADRAO;
  }
  try {
    return JSON.parse(raw) as MaterialServico[];
  } catch {
    return MATERIAIS_PADRAO;
  }
}

function salvarMateriais(dados: MaterialServico[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MATERIAIS_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event(EVENT));
}

export function getMateriaisPorServico(servicoId: string): MaterialServico[] {
  return getMateriais().filter((m) => m.servicoId === servicoId);
}

export function setMateriaisDeServico(
  servicoId: string,
  materiais: Array<Omit<MaterialServico, "servicoId">>,
): void {
  const outros = getMateriais().filter((m) => m.servicoId !== servicoId);
  const novos: MaterialServico[] = materiais.map((m) => ({ ...m, servicoId }));
  salvarMateriais([...outros, ...novos]);
}

// ─── Consumo automático ─────────────────────────────────────────────────────
// Chamado pelo store.ts quando atendimento vira "realizado".
// Match por NOME do serviço (procedimento é texto livre no agendamento).
export function consumirMateriais(procedimentoNome: string): void {
  if (typeof window === "undefined") return;
  const servico = getServicos().find((s) => s.nome === procedimentoNome);
  if (!servico) return;

  const vinculos = getMateriaisPorServico(servico.id);
  if (vinculos.length === 0) return;

  const produtos = getProdutos();
  const atualizados = produtos.map((p) => {
    const v = vinculos.find((vv) => vv.produtoId === p.id);
    if (!v) return p;
    return {
      ...p,
      quantidadeAtual: Math.max(0, p.quantidadeAtual - v.quantidade),
    };
  });
  salvarProdutos(atualizados);
}

// ─── Custo e margem ─────────────────────────────────────────────────────────
export function calcularCustoMateriais(servicoId: string): number {
  const vinculos = getMateriaisPorServico(servicoId);
  const produtos = getProdutos();
  return vinculos.reduce((acc, v) => {
    const p = produtos.find((pp) => pp.id === v.produtoId);
    return p ? acc + p.custoUnitario * v.quantidade : acc;
  }, 0);
}

// ─── Alertas ────────────────────────────────────────────────────────────────
export function getAlertas(): AlertaEstoque[] {
  const produtos = getProdutos();
  const alertas: AlertaEstoque[] = [];
  for (const p of produtos) {
    if (p.quantidadeAtual <= 0 || p.quantidadeAtual < p.quantidadeMinima) {
      alertas.push({ produto: p, nivel: "critico" });
    } else if (p.quantidadeAtual < p.quantidadeMinima * 1.5) {
      alertas.push({ produto: p, nivel: "baixo" });
    }
  }
  return alertas.sort((a, b) => {
    if (a.nivel !== b.nivel) return a.nivel === "critico" ? -1 : 1;
    return a.produto.quantidadeAtual - b.produto.quantidadeAtual;
  });
}
