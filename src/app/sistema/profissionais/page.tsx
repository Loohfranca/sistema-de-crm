"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  UserPlus,
  Search,
  X,
  Pencil,
  CheckCircle2,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import {
  getProfissionais,
  addProfissional,
  toggleProfissionalAtivo,
  updateProfissional,
  removeProfissional,
  subscribeProfissionais,
  getProfissionaisServerSnapshot,
  type Profissional,
  type DiaSemana,
} from "@/lib/profissionais";
import { addLog } from "@/lib/logs";
import { EASE_OUT_EXPO } from "@/lib/motion";

const TODOS_DIAS: DiaSemana[] = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function ProfissionaisPage() {
  const profissionais = useSyncExternalStore(
    subscribeProfissionais,
    getProfissionais,
    getProfissionaisServerSnapshot,
  );
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isOnyx, setIsOnyx] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    especialidade: "",
    diasAtendimento: ["Seg", "Ter", "Qua", "Qui", "Sex"] as DiaSemana[],
  });

  useEffect(() => {
    const check = () => setIsOnyx(document.documentElement.dataset.palette === "onyx");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });
    return () => obs.disconnect();
  }, []);

  const filtered = search.trim()
    ? profissionais.filter((p) =>
      p.nome.toLowerCase().includes(search.toLowerCase())
    )
    : profissionais;

  function toast(msg: string) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  function toggleDia(dia: DiaSemana) {
    setForm((f) => ({
      ...f,
      diasAtendimento: f.diasAtendimento.includes(dia)
        ? f.diasAtendimento.filter((d) => d !== dia)
        : [...f.diasAtendimento, dia],
    }));
  }

  function openNew() {
    setEditId(null);
    setForm({ nome: "", especialidade: "", diasAtendimento: ["Seg", "Ter", "Qua", "Qui", "Sex"] });
    setShowModal(true);
  }

  function openEdit(p: Profissional) {
    setEditId(p.id);
    setForm({
      nome: p.nome,
      especialidade: p.especialidade,
      diasAtendimento: [...p.diasAtendimento],
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.nome.trim()) return;

    if (editId !== null) {
      updateProfissional(editId, {
        nome: form.nome.trim(),
        especialidade: form.especialidade.trim(),
        diasAtendimento: form.diasAtendimento,
        avatar: form.nome
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join(""),
      });
      addLog({
        usuario: "Administrador",
        acao: "Editou",
        entidade: "profissional",
        descricao: `Editou o profissional ${form.nome.trim()}`,
      });
      toast("Profissional atualizado!");
    } else {
      addProfissional({
        nome: form.nome.trim(),
        especialidade: form.especialidade.trim(),
        diasAtendimento: form.diasAtendimento,
      });
      addLog({
        usuario: "Administrador",
        acao: "Criou",
        entidade: "profissional",
        descricao: `Criou o profissional ${form.nome.trim()}`,
      });
      toast("Profissional adicionado!");
    }

    setShowModal(false);
  }

  function handleToggle(p: Profissional) {
    toggleProfissionalAtivo(p.id);
    addLog({
      usuario: "Administrador",
      acao: p.ativo ? "Desativou" : "Ativou",
      entidade: "profissional",
      descricao: `${p.ativo ? "Desativou" : "Ativou"} o profissional ${p.nome}`,
    });
    toast(p.ativo ? "Profissional desativado" : "Profissional ativado");
  }

  function handleDelete(p: Profissional) {
    if (!confirm(`Remover "${p.nome}" permanentemente?`)) return;
    removeProfissional(p.id);
    addLog({
      usuario: "Administrador",
      acao: "Excluiu",
      entidade: "profissional",
      descricao: `Removeu o profissional ${p.nome}`,
    });
    toast("Profissional removido");
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${showToast
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-surface-high text-on-surface flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-body text-sm font-semibold border border-outline-variant/30">
          <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
          {toastMsg}
        </div>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Sistema
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Profissionais
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
            placeholder="Buscar profissional..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-surface-lowest text-on-surface text-sm font-body focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-ambient"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-on-primary text-sm font-semibold font-body shadow-sm hover:opacity-90 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Profissional
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                  Profissional
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden lg:table-cell">
                  Dias de Atendimento
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest hidden sm:table-cell">
                  Status
                </th>
                <th className="w-40" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: idx * 0.03,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-high/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isOnyx ? "#6b7280" : (p.cor + "22") }}
                      >
                        <span
                          className="text-xs font-semibold font-display"
                          style={{ color: isOnyx ? "#ffffff" : p.cor }}
                        >
                          {p.avatar}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface font-body truncate">
                          {p.nome}
                        </p>
                        <p className="text-xs text-on-surface-variant font-body truncate">
                          {p.especialidade}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {p.diasAtendimento.map((dia) => (
                        <span
                          key={dia}
                          className="px-2.5 py-1 rounded-lg bg-surface-high text-[11px] font-semibold text-on-surface-variant font-body"
                        >
                          {dia}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold font-body ${p.ativo
                          ? "bg-[#059669]/12 text-[#059669]"
                          : "bg-surface-high text-on-surface-variant"
                        }`}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggle(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-colors ${p.ativo
                            ? "text-error hover:bg-error/10"
                            : "text-[#059669] hover:bg-[#059669]/10"
                          }`}
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-sm text-on-surface-variant font-body"
                  >
                    Nenhum profissional encontrado.
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
                    {editId !== null ? "Editar Profissional" : "Adicionar Profissional"}
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
                      placeholder="Nome do profissional"
                      className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                      Especialidade
                    </label>
                    <input
                      type="text"
                      value={form.especialidade}
                      onChange={(e) =>
                        setForm({ ...form, especialidade: e.target.value })
                      }
                      placeholder="Ex: Esteticista, Massoterapeuta..."
                      className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                      Dias de Atendimento
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TODOS_DIAS.map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDia(dia)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-body transition-all ${form.diasAtendimento.includes(dia)
                              ? "gradient-primary text-on-primary shadow-sm"
                              : "bg-surface-high text-on-surface-variant hover:bg-surface-container"
                            }`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
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
                    onClick={handleSave}
                    disabled={!form.nome.trim()}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold font-body text-on-primary gradient-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {editId !== null ? "Salvar" : "Adicionar"}
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
