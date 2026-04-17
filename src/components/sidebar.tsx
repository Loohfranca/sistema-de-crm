"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  Bell,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Atendimentos", href: "/atendimentos", icon: CalendarPlus },
  { name: "Financeiro", href: "/financeiro", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const [perfil, setPerfil] = useState({
    nome: "Dra. Helena",
    especialidade: "Dermatologista",
    iniciais: "DH",
  });

  useEffect(() => {
    const carregarPerfil = () => {
      const savedPerfil = localStorage.getItem("crm_perfil");
      if (savedPerfil) {
        const parsed = JSON.parse(savedPerfil);
        const nameParts = parsed.nome.split(" ");
        // Tenta pegar: Primeira letra + Primeira letra do último nome ou segunda palavra
        const iniciais = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : nameParts[0].substring(0, 2).toUpperCase();

        setPerfil({
          nome: parsed.nome,
          especialidade: parsed.especialidade.split(" -")[0], // Pega apenas a primeira parte
          iniciais,
        });
      }
    };

    carregarPerfil();
    window.addEventListener("crm_settings_updated", carregarPerfil);
    return () => window.removeEventListener("crm_settings_updated", carregarPerfil);
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-surface-lowest flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-ambient">
            <Image
              src="/gabelia-logo-v2.png"
              alt="Gabelia Beauty Studio"
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-on-surface tracking-tight leading-tight">
              Gabelia Beauty
            </h1>
            <p className="text-[11px] text-on-surface-variant font-body">
              Beauty Studio
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-high"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-body">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-4 pb-4 space-y-2">
        <Link
          href="/atendimentos/novo"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body transition-all duration-200 hover:opacity-90"
        >
          <CalendarPlus className="w-4 h-4" />
          Novo Atendimento
        </Link>
      </div>

      {/* User */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-low">
          <div className="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-on-primary-fixed">
              {perfil.iniciais}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate font-body" title={perfil.nome}>
              {perfil.nome}
            </p>
            <p className="text-xs text-on-surface-variant font-body truncate" title={perfil.especialidade}>
              {perfil.especialidade}
            </p>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
