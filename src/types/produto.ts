export type UnidadeMedida =
  | "un"
  | "ml"
  | "g"
  | "ampola"
  | "seringa"
  | "bisnaga"
  | "caixa"
  | "frasco";

export interface Produto {
  id: string;
  nome: string;
  unidade: UnidadeMedida;
  quantidadeAtual: number;
  quantidadeMinima: number;
  custoUnitario: number;
  categoria?: string;
}

export interface MaterialServico {
  servicoId: string;
  produtoId: string;
  quantidade: number;
}

export interface AlertaEstoque {
  produto: Produto;
  nivel: "critico" | "baixo";
}
