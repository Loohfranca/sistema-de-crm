export type FormaPagamento = "pix" | "debito" | "credito" | "dinheiro";

export type QuemPagaTaxa = "estabelecimento" | "cliente";

export type DadosCartao = {
  maquininha: string;
  parcelas: number;
  taxaPercentual: number;
  valorBruto: number;
  valorLiquidoPrevisto: number;
  quemPagaTaxa: QuemPagaTaxa;
  valorCobradoCliente: number;
};

export type Lancamento = {
  id: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  data: string;
  categoria?: string;
  formaPagamento?: FormaPagamento;
  dadosCartao?: DadosCartao;
  observacao?: string;
  atendimentoId?: string;
};
