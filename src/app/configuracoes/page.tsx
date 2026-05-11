"use client";

import {
  User,
  Building2,
  Bell,
  Shield,
  Save,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { WhatsAppSection } from "@/components/configuracoes/whatsapp-section";
import { AparenciaSection } from "@/components/configuracoes/aparencia-section";

export default function ConfiguracoesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form states — vazio por padrão; user preenche
  const [perfil, setPerfil] = useState({
    nome: "",
    especialidade: "",
    email: "",
    telefone: "",
  });

  const [clinica, setClinica] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    horario: "",
    telefone: "",
  });

  const iniciais = perfil.nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "—";

  // Carrega do localStorage no onMount
  useEffect(() => {
    const savedPerfil = localStorage.getItem("crm_perfil");
    const savedClinica = localStorage.getItem("crm_clinica");

    if (savedPerfil) setPerfil(JSON.parse(savedPerfil));
    if (savedClinica) setClinica(JSON.parse(savedClinica));
  }, []);

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

      {/* Aparência — full width acima do grid */}
      <AparenciaSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
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
                    {iniciais}
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={perfil.nome}
                    onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                    placeholder="Ex: Esteticista, Dermatologista"
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                    placeholder="(11) 99999-0000"
                    className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
                  Nome da Clínica
                </label>
                <input
                  type="text"
                  value={clinica.nome}
                  onChange={(e) => setClinica({ ...clinica, nome: e.target.value })}
                  placeholder="Nome do estúdio/clínica"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                  placeholder="Seg-Sex 09:00 - 18:00"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
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
                  placeholder="(11) 0000-0000"
                  className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:bg-surface-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/30"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <WhatsAppSection />

          {/* Integrations — futuras */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 17 5-5-5-5"/><path d="M13.8 3.2c-2.4 2.4-2.4 6.4 0 8.8l.2.2"/><path d="M10.2 20.8c2.4-2.4 2.4-6.4 0-8.8l-.2-.2"/></svg>
                <h2 className="font-display text-lg font-bold text-on-surface">
                  Integrações
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Google Calendar — em breve */}
              <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-low opacity-70">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M21.53 12.23c0-.8-.07-1.56-.2-2.3H12v4.35h5.34c-.23 1.13-.86 2.1-1.8 2.76v2.3h2.91c1.7-1.56 2.68-3.86 2.68-6.11z"/>
                      <path fill="#34A853" d="M12 21.93c2.68 0 4.93-.89 6.57-2.4l-2.91-2.3c-.89.6-2.03.95-3.66.95-2.82 0-5.21-1.91-6.07-4.47H2.9v2.38A10 10 0 0 0 12 21.93z"/>
                      <path fill="#FBBC05" d="M5.93 13.71A5.96 5.96 0 0 1 5.6 12c0-.6.11-1.18.33-1.71V7.9H2.9A9.97 9.97 0 0 0 2 12c0 1.62.39 3.16 1.07 4.54l3.03-2.35v-.48z"/>
                      <path fill="#EA4335" d="M12 5.07c1.46 0 2.77.5 3.8 1.49l2.85-2.84c-1.7-1.58-3.95-2.65-6.65-2.65A10 10 0 0 0 2.9 7.9l3.03 2.35c.86-2.56 3.25-4.47 6.07-4.47z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-high px-2 py-0.5 rounded-full font-body uppercase tracking-wider">Em breve</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface font-body mb-1">Google Agenda</h3>
                <p className="text-xs text-on-surface-variant font-body mb-4">Sincronização bidirecional com a agenda do seu celular.</p>
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-outline font-body bg-surface-lowest cursor-not-allowed"
                >
                  Disponível em breve
                </button>
              </div>

              {/* Email/SMS — placeholder honesto */}
              <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-low opacity-70">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-high px-2 py-0.5 rounded-full font-body uppercase tracking-wider">Em breve</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface font-body mb-1">Email & SMS</h3>
                <p className="text-xs text-on-surface-variant font-body mb-4">Lembretes automáticos por email e SMS.</p>
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-outline font-body bg-surface-lowest cursor-not-allowed"
                >
                  Disponível em breve
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
