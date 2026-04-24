"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Heart,
  Clock,
  FileText,
  Sparkles,
  Star,
  Diamond,
} from "lucide-react";
import { GaleriaFotos } from "@/components/clientes/galeria-fotos";

const clientData = {
  id: "1",
  name: "Isabella Cavalcanti",
  email: "isabella@email.com",
  phone: "(11) 99876-5432",
  address: "Rua das Flores, 123 - São Paulo, SP",
  birthDate: "15/03/1992",
  age: 34,
  tier: "Paciente Diamante",
  since: "Janeiro 2023",
  totalProcedures: 34,
  avgFrequency: "Mensal",
  allergies: ["Látex", "Sulfonamidas"],
  preferences: [
    "Horários pela manhã",
    "Aromaterapia de lavanda",
    "Música ambiente suave",
  ],
  nextAppointment: {
    date: "22 de Outubro",
    time: "10:30",
    procedure: "Limpeza de Pele Profissional + Peeling",
  },
};

const treatmentHistory = [
  {
    id: 1,
    date: "09/04/2026",
    procedure: "Bioestimulador de Colágeno Radiesse",
    professional: "Dra. Helena",
    status: "realizado",
    notes: "Aplicação em malar e mandíbula. Paciente tolerou bem.",
  },
  {
    id: 2,
    date: "15/03/2026",
    procedure: "Aplicação de Botox - Frontal e Glabela",
    professional: "Dra. Helena",
    status: "realizado",
    notes: "40 unidades. Retorno em 15 dias para avaliação.",
  },
  {
    id: 3,
    date: "20/02/2026",
    procedure: "Preenchimento Labial com Ácido Hialurônico",
    professional: "Dra. Helena",
    status: "realizado",
    notes: "1ml Juvederm Ultra. Resultado natural conforme solicitado.",
  },
  {
    id: 4,
    date: "10/01/2026",
    procedure: "Limpeza de Pele Profissional",
    professional: "Dra. Helena",
    status: "realizado",
    notes: "Extração em zona T. Máscara calmante ao final.",
  },
  {
    id: 5,
    date: "15/12/2025",
    procedure: "Peeling Químico - Ácido Mandélico",
    professional: "Dra. Helena",
    status: "realizado",
    notes: "Sessão 3 de 4. Boa resposta ao tratamento.",
  },
];

export default function ClienteDetailPage() {
  const params = useParams();
  const clienteId = String(params?.id ?? "1");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant font-body hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para clientes
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-20 h-20 rounded-3xl bg-primary-fixed-dim flex items-center justify-center">
              <span className="text-2xl font-bold text-on-primary-fixed font-display">
                IC
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-on-surface">
                  {clientData.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container">
                  <Diamond className="w-3 h-3" />
                  {clientData.tier}
                </span>
              </div>
              <p className="text-on-surface-variant font-body mt-1">
                {clientData.age} anos &bull; Cliente desde {clientData.since}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-on-surface-variant font-body">
                  <Phone className="w-3.5 h-3.5" />
                  {clientData.phone}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-on-surface-variant font-body">
                  <Mail className="w-3.5 h-3.5" />
                  {clientData.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-lowest text-on-surface text-sm font-medium font-body ghost-border hover:bg-surface-high transition-colors">
              <FileText className="w-4 h-4" />
              Gerar PDF
            </button>
            <Link
              href="/atendimentos/novo"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity"
            >
              <Calendar className="w-4 h-4" />
              Agendar
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-secondary-fixed rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-on-secondary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">
            {clientData.since}
          </p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Cliente desde
          </p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-fixed rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-on-primary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">
            {clientData.totalProcedures}
          </p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Procedimentos
          </p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-2xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-on-tertiary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">
            {clientData.avgFrequency}
          </p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Frequência Média
          </p>
        </div>
        <div className="bg-surface-lowest rounded-3xl p-5 shadow-ambient">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-container rounded-2xl flex items-center justify-center">
              <Star className="w-5 h-5 text-on-primary-container" />
            </div>
          </div>
          <p className="font-display text-xl font-bold text-on-surface">4.9</p>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Satisfação
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatment History - 2 cols */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-3xl p-6 shadow-ambient">
          <h2 className="font-display text-lg font-bold text-on-surface mb-1">
            Histórico de Tratamentos
          </h2>
          <p className="text-sm text-on-surface-variant font-body mb-6">
            Todos os procedimentos realizados
          </p>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant/20" />
            <div className="space-y-6">
              {treatmentHistory.map((item) => (
                <div key={item.id} className="relative flex gap-4 pl-10">
                  <div className="absolute left-3.5 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-fixed" />
                  <div className="flex-1 p-4 rounded-2xl bg-surface-low">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-on-surface font-body">
                        {item.procedure}
                      </p>
                      <p className="text-xs text-on-surface-variant font-body mt-0.5">
                        {item.professional} &bull; {item.date}
                      </p>
                    </div>
                    <p className="text-xs text-outline font-body">
                      {item.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <GaleriaFotos clienteId={clienteId} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Next Appointment */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <h3 className="font-display text-base font-bold text-on-surface mb-4">
              Próximo Agendamento
            </h3>
            <div className="p-4 rounded-2xl gradient-primary text-on-primary">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold font-body">
                  {clientData.nextAppointment.date}
                </span>
                <span className="text-sm font-body opacity-80">
                  às {clientData.nextAppointment.time}
                </span>
              </div>
              <p className="text-sm font-body opacity-90">
                {clientData.nextAppointment.procedure}
              </p>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-error" />
              <h3 className="font-display text-base font-bold text-on-surface">
                Alergias Documentadas
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {clientData.allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container font-body"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-primary" />
              <h3 className="font-display text-base font-bold text-on-surface">
                Preferências
              </h3>
            </div>
            <div className="space-y-2">
              {clientData.preferences.map((pref) => (
                <div
                  key={pref}
                  className="px-4 py-2.5 rounded-2xl bg-surface-low text-sm text-on-surface-variant font-body"
                >
                  {pref}
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
            <h3 className="font-display text-base font-bold text-on-surface mb-4">
              Informações de Contato
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                <Phone className="w-4 h-4" />
                {clientData.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                <Mail className="w-4 h-4" />
                {clientData.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                <MapPin className="w-4 h-4" />
                {clientData.address}
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-body">
                <Calendar className="w-4 h-4" />
                {clientData.birthDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
