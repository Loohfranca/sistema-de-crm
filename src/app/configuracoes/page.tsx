"use client";

import {
  User,
  Building2,
  Bell,
  Shield,
  Save,
  Camera,
  CheckCircle2,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  getServicos,
  adicionarServico,
  editarServico,
  removerServico,
} from "@/lib/servicos";
import type { Servico } from "@/types/servico";

export default function ConfiguracoesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Serviços
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [editandoServico, setEditandoServico] = useState<Servico | null>(null);
  const [novoServico, setNovoServico] = useState(false);
  const [formServico, setFormServico] = useState({ nome: "", preco: "", duracao: "" });

  const carregarServicos = useCallback(() => setServicos(getServicos()), []);

  // Form states com default
  const [perfil, setPerfil] = useState({
    nome: "Dra. Helena Martins",
    especialidade: "Dermatologista - CRM 12345/SP",
    email: "helena@lumiere.com.br",
    telefone: "(11) 99999-0000",
  });

  const [clinica, setClinica] = useState({
    nome: "Gabelia Beauty Studio",
    cnpj: "12.345.678/0001-90",
    endereco: "Rua Oscar Freire, 2000 - Jardins, São Paulo - SP",
    horario: "Seg-Sex 08:00 - 19:00",
    telefone: "(11) 3000-0000",
  });

  // Carrega do localStorage no onMount
  useEffect(() => {
    const savedPerfil = localStorage.getItem("crm_perfil");
    const savedClinica = localStorage.getItem("crm_clinica");

    if (savedPerfil) setPerfil(JSON.parse(savedPerfil));
    if (savedClinica) setClinica(JSON.parse(savedClinica));

    carregarServicos();
    window.addEventListener("crm_servicos_updated", carregarServicos);
    return () => window.removeEventListener("crm_servicos_updated", carregarServicos);
  }, [carregarServicos]);

  function abrirNovoServico() {
    setEditandoServico(null);
    setFormServico({ nome: "", preco: "", duracao: "" });
    setNovoServico(true);
  }

  function abrirEditarServico(s: Servico) {
    setNovoServico(false);
    setEditandoServico(s);
    setFormServico({ nome: s.nome, preco: String(s.preco), duracao: String(s.duracao) });
  }

  function salvarServico() {
    const preco = parseFloat(formServico.preco);
    const duracao = parseInt(formServico.duracao);
    if (!formServico.nome || isNaN(preco) || isNaN(duracao)) return;

    if (editandoServico) {
      setServicos(editarServico({ id: editandoServico.id, nome: formServico.nome, preco, duracao }));
    } else {
      setServicos(adicionarServico({ nome: formServico.nome, preco, duracao }));
    }
    setEditandoServico(null);
    setNovoServico(false);
    setFormServico({ nome: "", preco: "", duracao: "" });
  }

  function cancelarFormServico() {
    setEditandoServico(null);
    setNovoServico(false);
    setFormServico({ nome: "", preco: "", duracao: "" });
  }

  function handleRemoverServico(id: string) {
    setServicos(removerServico(id));
  }

  const handleSave = () => {
    setIsSaving(true);
    
    // Salva no localStorage
    localStorage.setItem("crm_perfil", JSON.stringify(perfil));
    localStorage.setItem("crm_clinica", JSON.stringify(clinica));
    
    // Dispara evento para outras partes do app (como a sidebar) saberem que mudou
    window.dispatchEvent(new Event("crm_settings_updated"));

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-surface-high text-on-surface flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-body text-sm font-semibold border border-outline-variant/30">
          <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
          Alterações salvas com sucesso!
        </div>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm text-on-surface-variant font-body uppercase tracking-widest mb-1">
          Configurações
        </p>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Configurações
        </h1>
        <p className="text-on-surface-variant font-body mt-1">
          Gerencie seu perfil e preferências do sistema
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="col-span-2 space-y-6">
          {/* Profile */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Perfil Profissional
              </h2>
            </div>
            <div className="flex items-start gap-6 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-primary-fixed-dim flex items-center justify-center">
                  <span className="text-2xl font-bold text-on-primary-fixed font-display">
                    DH
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={perfil.nome}
                    onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={perfil.especialidade}
                    onChange={(e) => setPerfil({ ...perfil, especialidade: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={perfil.telefone}
                    onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clinic */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-on-surface">
                Dados da Clínica
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Nome da Clínica
                </label>
                <input
                  type="text"
                  value={clinica.nome}
                  onChange={(e) => setClinica({ ...clinica, nome: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={clinica.cnpj}
                  onChange={(e) => setClinica({ ...clinica, cnpj: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={clinica.endereco}
                  onChange={(e) => setClinica({ ...clinica, endereco: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Horário de Funcionamento
                </label>
                <input
                  type="text"
                  value={clinica.horario}
                  onChange={(e) => setClinica({ ...clinica, horario: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Telefone da Clínica
                </label>
                <input
                  type="tel"
                  value={clinica.telefone}
                  onChange={(e) => setClinica({ ...clinica, telefone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                />
              </div>
            </div>
          </div>

          {/* Serviços / Procedimentos */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-on-surface">
                  Serviços / Procedimentos
                </h2>
              </div>
              <button
                onClick={abrirNovoServico}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full gradient-primary text-on-primary text-xs font-semibold font-body hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            {/* Form inline (novo ou edição) */}
            {(novoServico || editandoServico) && (
              <div className="mb-4 p-4 rounded-2xl bg-surface-low border border-outline-variant/20">
                <p className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-3">
                  {editandoServico ? "Editar serviço" : "Novo serviço"}
                </p>
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nome do serviço"
                    value={formServico.nome}
                    onChange={(e) => setFormServico({ ...formServico, nome: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Preço (R$)"
                    step="0.01"
                    min="0"
                    value={formServico.preco}
                    onChange={(e) => setFormServico({ ...formServico, preco: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Duração (min)"
                    min="1"
                    value={formServico.duracao}
                    onChange={(e) => setFormServico({ ...formServico, duracao: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={cancelarFormServico}
                    className="px-4 py-2 rounded-xl text-xs font-semibold font-body bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarServico}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {editandoServico ? "Salvar" : "Adicionar"}
                  </button>
                </div>
              </div>
            )}

            {/* Lista */}
            <div className="space-y-2">
              {servicos.length === 0 && (
                <p className="text-sm text-on-surface-variant font-body text-center py-6">
                  Nenhum serviço cadastrado. Adicione seus procedimentos acima.
                </p>
              )}
              {servicos.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-surface-low hover:bg-surface-container transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface font-body truncate">
                      {s.nome}
                    </p>
                    <p className="text-xs text-on-surface-variant font-body">
                      R$ {s.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {s.duracao} min
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => abrirEditarServico(s)}
                      title="Editar"
                      className="p-2 rounded-full text-on-surface-variant hover:bg-surface-high hover:text-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoverServico(s.id)}
                      title="Excluir"
                      className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 17 5-5-5-5"/><path d="M13.8 3.2c-2.4 2.4-2.4 6.4 0 8.8l.2.2"/><path d="M10.2 20.8c2.4-2.4 2.4-6.4 0-8.8l-.2-.2"/></svg>
                <h2 className="font-display text-lg font-bold text-on-surface">
                  Integrações
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Google Calendar */}
              <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-low hover:bg-surface-high transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M21.53 12.23c0-.8-.07-1.56-.2-2.3H12v4.35h5.34c-.23 1.13-.86 2.1-1.8 2.76v2.3h2.91c1.7-1.56 2.68-3.86 2.68-6.11z"/>
                      <path fill="#34A853" d="M12 21.93c2.68 0 4.93-.89 6.57-2.4l-2.91-2.3c-.89.6-2.03.95-3.66.95-2.82 0-5.21-1.91-6.07-4.47H2.9v2.38A10 10 0 0 0 12 21.93z"/>
                      <path fill="#FBBC05" d="M5.93 13.71A5.96 5.96 0 0 1 5.6 12c0-.6.11-1.18.33-1.71V7.9H2.9A9.97 9.97 0 0 0 2 12c0 1.62.39 3.16 1.07 4.54l3.03-2.35v-.48z"/>
                      <path fill="#EA4335" d="M12 5.07c1.46 0 2.77.5 3.8 1.49l2.85-2.84c-1.7-1.58-3.95-2.65-6.65-2.65A10 10 0 0 0 2.9 7.9l3.03 2.35c.86-2.56 3.25-4.47 6.07-4.47z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-on-primary-container bg-primary-container px-2 py-0.5 rounded-full font-body uppercase tracking-wider">Desconectado</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface font-body mb-1">Google Agenda</h3>
                <p className="text-xs text-on-surface-variant font-body mb-4">Sincronização bidirecional com a agenda do seu celular.</p>
                <button className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:border-primary/50 transition-colors font-body bg-surface-lowest shadow-sm flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Conectar Conta
                </button>
              </div>

              {/* WhatsApp */}
              <div className="p-5 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_2px_10px_rgba(37,211,102,0.3)]">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/20 px-2 py-0.5 rounded-full font-body uppercase tracking-wider">Conectado</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface font-body mb-1">API WhatsApp</h3>
                <p className="text-xs text-on-surface-variant font-body mb-4">Mensagens automáticas de aniversário e retorno.</p>
                <button className="w-full py-2.5 rounded-xl border border-[#25D366]/30 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10 transition-colors font-body bg-white/50 shadow-sm">
                  Configurar Mensagens
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-display text-base font-bold text-on-surface">
                Notificações
              </h3>
            </div>
            <div className="space-y-4">
              {[
                "Lembrete de agendamentos",
                "Novos clientes cadastrados",
                "Alertas de retorno",
                "Relatórios semanais",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-on-surface font-body">
                    {item}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-surface-highest rounded-full peer-checked:bg-primary transition-colors hover:ring-2 ring-primary/20" />
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow-sm" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display text-base font-bold text-on-surface">
                Segurança
              </h3>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-2xl bg-surface-low text-sm text-on-surface font-body hover:bg-surface-container transition-colors ring-1 ring-transparent hover:ring-outline-variant/20">
                Alterar Senha
              </button>
              <button className="w-full text-left px-4 py-3 rounded-2xl bg-surface-low text-sm text-on-surface font-body hover:bg-surface-container transition-colors ring-1 ring-transparent hover:ring-outline-variant/20">
                Autenticação em 2 Fatores
              </button>
              <button className="w-full text-left px-4 py-3 rounded-2xl bg-surface-low text-sm text-on-surface font-body hover:bg-surface-container transition-colors ring-1 ring-transparent hover:ring-outline-variant/20">
                Sessões Ativas
              </button>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-on-primary text-sm font-semibold font-body transition-all ${
              isSaving
                ? "bg-surface-variant text-white cursor-not-allowed"
                : "gradient-primary hover:opacity-90 hover:scale-[1.02] shadow-sm"
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
