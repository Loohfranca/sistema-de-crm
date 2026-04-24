export interface FotoRegistro {
  id: string;
  clienteId: string;
  procedimento: string;
  data: string;
  observacao?: string;
  antes?: Blob;
  depois?: Blob;
  createdAt: number;
}
