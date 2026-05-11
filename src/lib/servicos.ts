import type { Servico } from "@/types/servico";
import { addLog } from "./logs";

const STORAGE_KEY = "crm_servicos_v1";

const SERVICOS_PADRAO: Servico[] = [
  { id: "s1", nome: "Limpeza de Pele Profissional", preco: 350, duracao: 60, categoria: "Pele" },
  { id: "s2", nome: "Aplicação de Botox — Frontal e Glabela", preco: 1500, duracao: 45, categoria: "Injetáveis" },
  { id: "s3", nome: "Preenchimento Labial com Ácido Hialurônico", preco: 2200, duracao: 30, categoria: "Injetáveis" },
  { id: "s4", nome: "Peeling Químico — Ácido Mandélico", preco: 450, duracao: 40, categoria: "Peeling" },
];

export function getServicos(): Servico[] {
  if (typeof window === "undefined") return SERVICOS_PADRAO;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SERVICOS_PADRAO));
    return SERVICOS_PADRAO;
  }
  try {
    const parsed = JSON.parse(raw) as Servico[];

    // ─── Migração: preencher `categoria` ausente em dados antigos ─────
    let dirty = false;
    const reparado = parsed.map((s) => {
      if (!s.categoria) {
        const padrao = SERVICOS_PADRAO.find((p) => p.id === s.id);
        if (padrao?.categoria) {
          dirty = true;
          return { ...s, categoria: padrao.categoria };
        }
        // Tenta inferir por nome
        const porNome = SERVICOS_PADRAO.find(
          (p) => p.nome.toLowerCase() === s.nome.toLowerCase(),
        );
        if (porNome?.categoria) {
          dirty = true;
          return { ...s, categoria: porNome.categoria };
        }
      }
      return s;
    });
    if (dirty) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reparado));
    }

    return reparado;
  } catch {
    return SERVICOS_PADRAO;
  }
}

export function salvarServicos(dados: Servico[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  window.dispatchEvent(new Event("crm_servicos_updated"));
}

export function adicionarServico(servico: Omit<Servico, "id">): Servico[] {
  const lista = getServicos();
  const novo: Servico = { ...servico, id: `s${Date.now()}` };
  const atualizada = [...lista, novo];
  salvarServicos(atualizada);
  addLog({
    usuario: "Administrador",
    acao: "Criou",
    entidade: "servico",
    descricao: `Criou serviço ${novo.nome}`,
  });
  return atualizada;
}

export function editarServico(servico: Servico): Servico[] {
  const lista = getServicos();
  const atualizada = lista.map((s) => (s.id === servico.id ? servico : s));
  salvarServicos(atualizada);
  addLog({
    usuario: "Administrador",
    acao: "Editou",
    entidade: "servico",
    descricao: `Editou serviço ${servico.nome}`,
  });
  return atualizada;
}

export function removerServico(id: string): Servico[] {
  const lista = getServicos();
  const alvo = lista.find((s) => s.id === id);
  const atualizada = lista.filter((s) => s.id !== id);
  salvarServicos(atualizada);
  if (alvo) {
    addLog({
      usuario: "Administrador",
      acao: "Excluiu",
      entidade: "servico",
      descricao: `Removeu serviço ${alvo.nome}`,
    });
  }
  return atualizada;
}
