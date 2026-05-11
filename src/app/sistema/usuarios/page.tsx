"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  UserPlus,
  Search,
  X,
  CheckCircle2,
  Shield,
} from "lucide-react";
import {
  getUsuarios,
  addUsuario,
  removeUsuario,
  subscribeUsuarios,
  getUsuariosServerSnapshot,
  type Usuario,
  type CargoUsuario,
} from "@/lib/usuarios";
import { addLog } from "@/lib/logs";
import { EASE_OUT_EXPO } from "@/lib/motion";

const CARGOS: CargoUsuario[] = ["Administrador", "Gerente", "Usuário"];

function cargoBadge(cargo: CargoUsuario) {
  const map: Record<CargoUsuario, string> = {
    Administrador: "bg-primary/15 text-primary",
    Gerente: "bg-tertiary/15 text-tertiary",
    Usuário: "bg-surface-high text-on-surface-variant",
  };
  return map[cargo] ?? map["Usuário"];
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function UsuariosPage() {
  const usuarios = useSyncExternalStore(
    subscribeUsuarios,
    getUsuarios,
    getUsuariosServerSnapshot,
  );
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", cargo: "Usuário" as CargoUsuario });

  const filtered = search.trim()
    ? usuarios.filter(
        (u) =>
          u.nome.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : usuarios;

  function handleAdd() {
    if (!form.nome.trim() || !form.email.trim()) return;
    addUsuario({ nome: form.nome.trim(), email: form.email.trim(), cargo: form.cargo });
    addLog({
      usuario: "Administrador",
      acao: "Criou",
      entidade: "usuario",
      descricao: `Criou o usuário ${form.nome.trim()}`,
    });
    setForm({ nome: "", email: "", cargo: "Usuário" });
    setShowModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  function handleRemove(u: Usuario) {
    if (!confirm(`Remover o usuário "${u.nome}"?`)) return;
    removeUsuario(u.id);
    addLog({
      usuario: "Administrador",
      acao: "Excluiu",
      entidade: "usuario",
      descricao: `Removeu o usuário ${u.nome}`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-surface-high text-on-surface flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-body text-sm font-semibold border border-outline-variant/30">
          <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
          Usuário adicionado com sucesso!
        </div>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Sistema
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Usuários
        </h1>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-surface-lowest text-on-surface text-sm font-body focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-ambient"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-on-primary text-sm font-semibold font-body shadow-sm hover:opacity-90 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                  Usuário
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden md:table-cell">
                  Cargo
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden lg:table-cell">
                  Cadastrado em
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03, ease: EASE_OUT_EXPO }}
                  className="border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-high/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-on-primary font-display">
                          {u.avatar}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface font-body truncate">
                          {u.nome}
                        </p>
                        <p className="text-xs text-on-surface-variant font-body sm:hidden truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-body hidden sm:table-cell">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-body ${cargoBadge(
                        u.cargo
                      )}`}
                    >
                      {u.cargo === "Administrador" && <Shield className="w-3 h-3" />}
                      {u.cargo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-body hidden lg:table-cell">
                    {formatDate(u.cadastradoEm)}
                  </td>
                  <td className="px-4 py-4">
                    {u.cargo !== "Administrador" && (
                      <button
                        onClick={() => handleRemove(u)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-on-surface-variant font-body">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-on-surface">
                    Adicionar Usuário
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome do usuário"
                      className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                      Cargo
                    </label>
                    <select
                      value={form.cargo}
                      onChange={(e) =>
                        setForm({ ...form, cargo: e.target.value as CargoUsuario })
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {CARGOS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold font-body text-on-surface-variant bg-surface-high hover:bg-surface-container transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!form.nome.trim() || !form.email.trim()}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold font-body text-on-primary gradient-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
