"use client";

import { useState, useEffect } from "react";
import {
  X, Star, Diamond, Crown, ChevronDown, AlertTriangle, Heart, User,
} from "lucide-react";
import type { Cliente } from "@/lib/clientes";

const inputCls = "w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline";
const labelCls = "block text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-1.5";

type Mode = "create" | "edit";

export function ClienteFormModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: Mode;
  initial?: Cliente;
  onClose: () => void;
  onSave: (c: Cliente) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    birthDate: initial?.birthDate ?? "",
    address: initial?.address ?? "",
    tier: initial?.tier ?? "silver",
  });
  const [allergies, setAllergies] = useState<string[]>(initial?.allergies ?? []);
  const [allergyInput, setAllergyInput] = useState("");
  const [preferences, setPreferences] = useState<string[]>(initial?.preferences ?? []);
  const [prefInput, setPrefInput] = useState("");
  const [showOptional, setShowOptional] = useState(
    !!(initial && (initial.allergies.length > 0 || initial.preferences.length > 0 || initial.address))
  );

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

    const initials = form.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    onSave({
      id: initial?.id ?? `c${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      birthDate: form.birthDate,
      address: form.address,
      tier: form.tier,
      allergies,
      preferences,
      lastVisit: initial?.lastVisit ?? "-",
      procedures: initial?.procedures ?? 0,
      avatar: initials,
      status: initial?.status ?? "active",
    });
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const initials = form.name
    ? form.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "";

  const titulo = mode === "edit" ? "Editar Cliente" : "Nova Cliente";
  const cta = mode === "edit" ? "Salvar Alterações" : "Cadastrar Cliente";

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
                <h2 className="font-display text-xl font-bold text-on-surface">{titulo}</h2>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  {form.name || (mode === "edit" ? "Atualize os dados" : "Preencha os dados da cliente")}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 py-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-on-surface font-display">Dados Pessoais</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome Completo *</label>
                  <input required type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Ex: Maria Silva" />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp *</label>
                  <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="(11) 90000-0000" />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="maria@email.com" />
                </div>
                <div>
                  <label className={labelCls}>Data de Nascimento</label>
                  <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Endereço</label>
                  <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} placeholder="Rua, número - Cidade" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Categoria</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: "silver", label: "Prata", Icon: Star, activeBg: "bg-surface-highest", activeText: "text-on-surface" },
                  { key: "gold", label: "Ouro", Icon: Crown, activeBg: "bg-secondary-container", activeText: "text-on-secondary-container" },
                  { key: "diamond", label: "Diamante", Icon: Diamond, activeBg: "bg-primary-container", activeText: "text-on-primary-container" },
                ] as const).map(({ key, label, Icon, activeBg, activeText }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => set("tier", key)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold font-body border-2 transition-all ${
                      form.tier === key
                        ? `${activeBg} ${activeText} border-primary/30 scale-[1.02]`
                        : "bg-surface-high text-on-surface-variant border-transparent hover:bg-surface-highest"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

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
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    <h3 className="text-sm font-bold text-on-surface font-display">Alergias</h3>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }}
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
                      {allergies.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container font-body">
                          {a}
                          <button type="button" onClick={() => setAllergies(allergies.filter((x) => x !== a))} className="hover:opacity-60 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface font-display">Preferências</h3>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={prefInput}
                      onChange={(e) => setPrefInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPref(); } }}
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
                      {preferences.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container font-body">
                          {p}
                          <button type="button" onClick={() => setPreferences(preferences.filter((x) => x !== p))} className="hover:opacity-60 transition-opacity">
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
              {cta}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
