"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Tag, CreditCard } from "lucide-react";
import {
  getCategorias,
  adicionarCategoria,
  editarCategoria,
  removerCategoria,
  getFormas,
  adicionarForma,
  editarForma,
  removerForma,
  PALETA_CORES,
  GESTAO_EVENT,
  type ItemRegistro,
} from "@/lib/gestao";

const inputCls =
  "w-full px-3.5 py-2 rounded-xl bg-surface-lowest text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";

// ─── Editor de um item (nome + cor) ──────────────────────────────────────────
function ItemEditor({
  inicial,
  onSalvar,
  onCancelar,
}: {
  inicial: { label: string; cor: string };
  onSalvar: (label: string, cor: string) => void;
  onCancelar: () => void;
}) {
  const [label, setLabel] = useState(inicial.label);
  const [cor, setCor] = useState(inicial.cor);

  return (
    <div className="rounded-2xl bg-surface-low p-3.5 space-y-3">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome"
        autoFocus
        className={inputCls}
        onKeyDown={(e) => {
          if (e.key === "Enter" && label.trim()) onSalvar(label.trim(), cor);
        }}
      />
      <div className="flex flex-wrap gap-1.5">
        {PALETA_CORES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCor(c)}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full transition-transform ${
              cor === c
                ? "ring-2 ring-offset-2 ring-on-surface/40 scale-110"
                : "hover:scale-110"
            }`}
          />
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold font-body text-on-surface-variant hover:bg-surface-high transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          type="button"
          disabled={!label.trim()}
          onClick={() => onSalvar(label.trim(), cor)}
          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Salvar
        </button>
      </div>
    </div>
  );
}

// ─── Lista editável (categorias ou formas) ───────────────────────────────────
function ListaEditavel({
  titulo,
  descricao,
  icone,
  itens,
  rotuloAdicionar,
  onAdicionar,
  onEditar,
  onRemover,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  itens: ItemRegistro[];
  rotuloAdicionar: string;
  onAdicionar: (label: string, cor: string) => void;
  onEditar: (id: string, label: string, cor: string) => void;
  onRemover: (id: string) => void;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);

  return (
    <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icone}</span>
          <h2 className="font-display text-lg font-bold text-on-surface">
            {titulo}
          </h2>
        </div>
        <span className="text-xs text-on-surface-variant font-body">
          {itens.length} {itens.length === 1 ? "item" : "itens"}
        </span>
      </div>
      <p className="text-xs text-on-surface-variant font-body mb-4">
        {descricao}
      </p>

      <div className="space-y-2">
        {itens.map((item) =>
          editandoId === item.id ? (
            <ItemEditor
              key={item.id}
              inicial={{ label: item.label, cor: item.cor }}
              onSalvar={(label, cor) => {
                onEditar(item.id, label, cor);
                setEditandoId(null);
              }}
              onCancelar={() => setEditandoId(null)}
            />
          ) : (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3"
            >
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: item.cor }}
              />
              <span className="flex-1 text-sm font-medium text-on-surface font-body truncate">
                {item.label}
              </span>
              <button
                onClick={() => setEditandoId(item.id)}
                title="Editar"
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high hover:text-on-surface transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir "${item.label}"?`)) onRemover(item.id);
                }}
                title="Excluir"
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ),
        )}

        {adicionando ? (
          <ItemEditor
            inicial={{ label: "", cor: PALETA_CORES[0] }}
            onSalvar={(label, cor) => {
              onAdicionar(label, cor);
              setAdicionando(false);
            }}
            onCancelar={() => setAdicionando(false)}
          />
        ) : (
          <button
            onClick={() => setAdicionando(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-dashed border-outline-variant/40 text-xs font-semibold font-body text-primary hover:bg-surface-high transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {rotuloAdicionar}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Painel ──────────────────────────────────────────────────────────────────
export function RegistrosPanel() {
  const [categorias, setCategorias] = useState<ItemRegistro[]>([]);
  const [formas, setFormas] = useState<ItemRegistro[]>([]);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const carregar = () => {
      setCategorias(getCategorias());
      setFormas(getFormas());
    };
    carregar();
    setMontado(true);
    window.addEventListener(GESTAO_EVENT, carregar);
    return () => window.removeEventListener(GESTAO_EVENT, carregar);
  }, []);

  if (!montado) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ListaEditavel
        titulo="Categorias de despesa"
        descricao="Aparecem ao lançar uma despesa na Gestão."
        icone={<Tag className="w-5 h-5" />}
        itens={categorias}
        rotuloAdicionar="Adicionar categoria"
        onAdicionar={(l, c) => setCategorias(adicionarCategoria(l, c))}
        onEditar={(id, l, c) => setCategorias(editarCategoria(id, l, c))}
        onRemover={(id) => setCategorias(removerCategoria(id))}
      />
      <ListaEditavel
        titulo="Formas de pagamento"
        descricao="Aparecem ao dar baixa no pagamento de um atendimento."
        icone={<CreditCard className="w-5 h-5" />}
        itens={formas}
        rotuloAdicionar="Adicionar forma"
        onAdicionar={(l, c) => setFormas(adicionarForma(l, c))}
        onEditar={(id, l, c) => setFormas(editarForma(id, l, c))}
        onRemover={(id) => setFormas(removerForma(id))}
      />
    </div>
  );
}
