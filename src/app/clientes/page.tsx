"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronRight,
  Phone,
  Mail,
  X,
  Star,
  Diamond,
  Crown,
  ChevronDown,
  AlertTriangle,
  Heart,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { getClientes, adicionarCliente, type Cliente as Client } from "@/lib/clientes";

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

// ─── Input component (reusable styling) ──────────────────────────────────────
const inputCls = "w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";
const labelCls = "block text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1.5";

// ─── New Client Modal ────────────────────────────────────────────────────────
function NovaClienteModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Client) => void }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", birthDate: "", address: "", tier: "silver",
  });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [prefInput, setPrefInput] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function addAllergy() {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) setAllergies([...allergies, v]);
    setAllergyInput("");
  }

  function addPref() {
    const v = prefInput.trim();
    if (v && !preferences.includes(v)) setPreferences([...preferences, v]);
    setPrefInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    const initials = form.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

    onSave({
      id: `c${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      birthDate: form.birthDate,
      address: form.address,
      tier: form.tier,
      allergies,
      preferences,
      lastVisit: "-",
      procedures: 0,
      avatar: initials,
      status: "active",
    });
  }

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const initials = form.name
    ? form.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed-dim flex items-center justify-center shrink-0">
                {initials ? (
                  <span className="text-lg font-bold text-on-primary-fixed font-display">{initials}</span>
                ) : (
                  <User className="w-6 h-6 text-on-primary-fixed" />
                )}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-on-surface">Nova Cliente</h2>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  {form.name || "Preencha os dados da cliente"}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* ── Dados Pessoais ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-on-surface font-display">Dados Pessoais</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome Completo *</label>
                  <input required type="text" value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="Ex: Maria Silva" />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp *</label>
                  <input required type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} placeholder="(11) 90000-0000" />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} placeholder="maria@email.com" />
                </div>
                <div>
                  <label className={labelCls}>Data de Nascimento</label>
                  <input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Endereço</label>
                  <input type="text" value={form.address} onChange={e => set("address", e.target.value)} className={inputCls} placeholder="Rua, número - Cidade" />
                </div>
              </div>
            </div>

            {/* ── Categoria ── */}
            <div>
              <label className={labelCls}>Categoria</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: "silver", label: "Prata", Icon: Star, bg: "bg-surface-highest", activeBg: "bg-surface-highest", activeText: "text-on-surface" },
                  { key: "gold", label: "Ouro", Icon: Crown, bg: "bg-secondary-container/40", activeBg: "bg-secondary-container", activeText: "text-on-secondary-container" },
                  { key: "diamond", label: "Diamante", Icon: Diamond, bg: "bg-primary-container/40", activeBg: "bg-primary-container", activeText: "text-on-primary-container" },
                ] as const).map(({ key, label, Icon, activeBg, activeText }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => set("tier", key)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold font-body border-2 transition-all ${form.tier === key
                        ? `${activeBg} ${activeText} border-primary/30 scale-[1.02]`
                        : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Seção Opcional (toggle) ── */}
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-2 w-full text-left py-3 border-t border-outline-variant/15"
            >
              <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${showOptional ? "rotate-180" : ""}`} />
              <span className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-widest">
                Informações adicionais
              </span>
              <span className="text-[10px] text-outline font-body ml-1">(opcional)</span>
            </button>

            {showOptional && (
              <div className="space-y-6">
                {/* Alergias */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    <h3 className="text-sm font-bold text-on-surface font-display">Alergias</h3>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={e => setAllergyInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }}
                      className={inputCls}
                      placeholder="Ex: Látex, Dipirona..."
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      disabled={!allergyInput.trim()}
                      className="px-4 rounded-2xl bg-error-container/60 text-on-error-container text-xs font-semibold font-body hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allergies.map(a => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container font-body">
                          {a}
                          <button type="button" onClick={() => setAllergies(allergies.filter(x => x !== a))} className="hover:opacity-60 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preferências */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface font-display">Preferências</h3>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={prefInput}
                      onChange={e => setPrefInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPref(); } }}
                      className={inputCls}
                      placeholder="Ex: Horários pela manhã, Aromaterapia..."
                    />
                    <button
                      type="button"
                      onClick={addPref}
                      disabled={!prefInput.trim()}
                      className="px-4 rounded-2xl bg-primary-container text-on-primary-container text-xs font-semibold font-body hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                  {preferences.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferences.map(p => (
                        <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container font-body">
                          {p}
                          <button type="button" onClick={() => setPreferences(preferences.filter(x => x !== p))} className="hover:opacity-60 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-outline-variant/15 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.name || !form.phone}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cadastrar Cliente
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [clientList, setClientList] = useState<Client[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setClientList(getClientes());
    const sync = () => setClientList(getClientes());
    window.addEventListener("crm_clientes_updated", sync);
    return () => window.removeEventListener("crm_clientes_updated", sync);
  }, []);

  const filtered = clientList.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === "all" || c.tier === filterTier;
    return matchSearch && matchTier;
  });

  function handleSave(client: Client) {
    const { id, ...rest } = client;
    const atualizada = adicionarCliente(rest);
    setClientList(atualizada);
    setModalOpen(false);
  }

  return (
    <div className="space-y-8">
      {/* Modal */}
      {modalOpen && (
        <NovaClienteModal onClose={() => setModalOpen(false)} onSave={handleSave} />
      )}

      {/* Header */}
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
          onClick={() => setModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Nova Cliente
        </button>
      </div>

      {/* Search & Filters */}
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

      {/* Client List */}
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
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-surface-low transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-on-primary-fixed">{client.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface font-body group-hover:text-primary transition-colors">{client.name}</p>
                  <p className="text-xs text-on-surface-variant font-body">{client.email}</p>
                </div>
              </div>
              <div>{getTierBadge(client.tier)}</div>
              <p className="text-sm text-on-surface-variant font-body">{client.procedures} sessões</p>
              <p className="text-sm text-on-surface-variant font-body">{client.lastVisit}</p>
              <div className="flex items-center gap-2">
                <button onClick={(e) => e.preventDefault()} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button onClick={(e) => e.preventDefault()} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                  <Mail className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
