"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, ChevronRight, Phone, Mail,
  Star, Diamond, Crown, Pencil, Trash2,
} from "lucide-react";
import {
  getClientes, adicionarCliente, atualizarCliente, excluirCliente,
  type Cliente as Client,
} from "@/lib/clientes";
import { getAgendamentos, isoParaBR, type Agendamento } from "@/lib/store";
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal";
import { ConfirmarExclusao } from "@/components/clientes/confirmar-exclusao";

function deriveStats(nome: string, agendamentos: Agendamento[]) {
  const alvo = nome.trim().toLowerCase();
  const meus = agendamentos.filter((a) => a.cliente.trim().toLowerCase() === alvo);
  const realizados = meus.filter((a) => a.status === "realizado");
  const ultima = realizados.sort((a, b) => b.data.localeCompare(a.data))[0];
  const tier =
    realizados.length >= 30 ? "diamond" :
    realizados.length >= 10 ? "gold" : "silver";
  return {
    procedures: realizados.length,
    lastVisit: ultima ? isoParaBR(ultima.data) : null,
    tier,
  };
}

function getTierBadge(tier: string) {
  switch (tier) {
    case "diamond":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container">
          <Diamond className="w-3 h-3" />Diamante
        </span>
      );
    case "gold":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container">
          <Crown className="w-3 h-3" />Ouro
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-highest text-on-surface-variant">
          <Star className="w-3 h-3" />Prata
        </span>
      );
  }
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [clientList, setClientList] = useState<Client[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<Client | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Client | null>(null);

  useEffect(() => {
    setClientList(getClientes());
    setAgendamentos(getAgendamentos());
    const syncC = () => setClientList(getClientes());
    const syncA = () => setAgendamentos(getAgendamentos());
    window.addEventListener("crm_clientes_updated", syncC);
    window.addEventListener("crm_agenda_updated", syncA);
    return () => {
      window.removeEventListener("crm_clientes_updated", syncC);
      window.removeEventListener("crm_agenda_updated", syncA);
    };
  }, []);

  const enriched = useMemo(
    () => clientList.map((c) => {
      const stats = deriveStats(c.name, agendamentos);
      return { ...c, ...stats, lastVisit: stats.lastVisit ?? "—" };
    }),
    [clientList, agendamentos]
  );

  const filtered = enriched.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === "all" || c.tier === filterTier;
    return matchSearch && matchTier;
  });

  function handleCriar(client: Client) {
    const { id: _id, ...rest } = client;
    void _id;
    setClientList(adicionarCliente(rest));
    setModalCriar(false);
  }

  function handleEditar(client: Client) {
    const { id, ...rest } = client;
    setClientList(atualizarCliente(id, rest));
    setModalEditar(null);
  }

  function handleExcluir() {
    if (!modalExcluir) return;
    setClientList(excluirCliente(modalExcluir.id));
    setModalExcluir(null);
  }

  return (
    <div className="space-y-8">
      {modalCriar && (
        <ClienteFormModal mode="create" onClose={() => setModalCriar(false)} onSave={handleCriar} />
      )}
      {modalEditar && (
        <ClienteFormModal
          mode="edit"
          initial={modalEditar}
          onClose={() => setModalEditar(null)}
          onSave={handleEditar}
        />
      )}
      {modalExcluir && (
        <ConfirmarExclusao
          clienteName={modalExcluir.name}
          onCancel={() => setModalExcluir(null)}
          onConfirm={handleExcluir}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
            Clientes
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Lista de Clientes
          </h1>
          <p className="text-on-surface-variant font-body mt-1">
            {clientList.length} clientes cadastradas
          </p>
        </div>
        <button
          onClick={() => setModalCriar(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Nova Cliente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
          {["all", "diamond", "gold", "silver"].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-4 py-3 rounded-2xl text-sm font-medium font-body transition-all ${filterTier === tier
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                }`}
            >
              {tier === "all" ? "Todos" : tier === "diamond" ? "Diamante" : tier === "gold" ? "Ouro" : "Prata"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 bg-surface-low">
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">Cliente</span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">Categoria</span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">Procedimentos</span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">Última Visita</span>
          <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">Ações</span>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-surface-low transition-colors group"
            >
              <Link href={`/clientes/${client.id}`} className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-on-primary-fixed">{client.avatar}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface font-body group-hover:text-primary transition-colors truncate">{client.name}</p>
                  <p className="text-xs text-on-surface-variant font-body truncate">{client.email}</p>
                </div>
              </Link>
              <div>{getTierBadge(client.tier)}</div>
              <p className="text-sm text-on-surface-variant font-body">{client.procedures} sessões</p>
              <p className="text-sm text-on-surface-variant font-body">{client.lastVisit}</p>
              <div className="flex items-center gap-1">
                {client.phone && (
                  <a
                    href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="p-2 rounded-full hover:bg-surface-high text-on-surface-variant hover:text-[#25D366] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    title="Email"
                    className="p-2 rounded-full hover:bg-surface-high text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setModalEditar(client)}
                  title="Editar"
                  className="p-2 rounded-full hover:bg-primary-container/60 text-on-surface-variant hover:text-on-primary-container transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setModalExcluir(client)}
                  title="Excluir"
                  className="p-2 rounded-full hover:bg-error-container text-on-surface-variant hover:text-on-error-container transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link
                  href={`/clientes/${client.id}`}
                  className="p-2 rounded-full hover:bg-surface-high text-outline-variant transition-colors"
                  title="Abrir ficha"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-on-surface-variant font-body">
              Nenhuma cliente encontrada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
