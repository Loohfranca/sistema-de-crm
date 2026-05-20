"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Calendar,
  Settings,
  Sparkles,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Flower2,
  UserCog,
  ScrollText,
  Stethoscope,
  FileText,
  Share2,
  PieChart,
} from "lucide-react";
import { useSidebarCollapsed } from "@/lib/sidebar-state";
import { EASE_OUT_EXPO } from "@/lib/motion";


/* ─── Seção MENU ─────────────────────────────────────────────────────────────── */
const menuNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Gestão", href: "/gestao", icon: PieChart },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Atendimentos", href: "/atendimentos", icon: CalendarPlus },
  { name: "Link de Agendamento", href: "/link-agendamento", icon: Share2 },
  { name: "Procedimentos", href: "/procedimentos", icon: Sparkles },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Relatório", href: "/relatorio", icon: FileText },
];

/* ─── Seção SISTEMA ──────────────────────────────────────────────────────────── */
const sistemaNavigation = [
  { name: "Usuários", href: "/sistema/usuarios", icon: UserCog },
  { name: "Logs", href: "/sistema/logs", icon: ScrollText },
  { name: "Profissionais", href: "/sistema/profissionais", icon: Stethoscope },
  { name: "Configuração", href: "/configuracoes", icon: Settings },
];

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  const [clinica, setClinica] = useState({
    nome: "Studio Estética",
    subtitulo: "Beauty",
  });

  useEffect(() => {
    const carregar = () => {
      const saved = localStorage.getItem("crm_clinica");
      if (!saved) return;
      try {
        const c = JSON.parse(saved);
        const partes = (c.nome ?? "").split(" ");
        setClinica({
          nome: partes.slice(0, 2).join(" ") || c.nome,
          subtitulo: partes.slice(2).join(" ") || "Beauty",
        });
      } catch {}
    };
    carregar();
    window.addEventListener("crm_settings_updated", carregar);
    return () => window.removeEventListener("crm_settings_updated", carregar);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  /* ─── Componente de item de navegação reutilizável ────────────────────────── */
  function NavItem({ item }: { item: (typeof menuNavigation)[number] }) {
    const active = isActive(item.href);
    const collapsedIconOnly = collapsed;

    return (
      <Link
        href={item.href}
        className={`group relative flex items-center rounded-xl transition-all duration-150 ease-out gap-3 px-3 py-2 ${
          collapsedIconOnly
            ? "md:justify-center md:w-12 md:h-12 md:mx-auto md:gap-0 md:px-0 md:py-0"
            : ""
        } ${
          active
            ? "bg-primary/10 text-primary font-semibold"
            : "text-on-surface-variant hover:bg-surface-high/70 hover:text-on-surface"
        }`}
      >
        <item.icon
          className="shrink-0 w-[20px] h-[20px]"
          strokeWidth={active ? 2.2 : 1.8}
        />
        <span
          className={`text-sm font-body whitespace-nowrap ${
            collapsedIconOnly ? "md:hidden" : ""
          }`}
        >
          {item.name}
        </span>

        {collapsedIconOnly && (
          <span className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-inverse-surface text-inverse-on-surface text-xs font-semibold font-body whitespace-nowrap opacity-0 group-hover:opacity-100 shadow-ambient transition-opacity duration-150 ease-out z-20 hidden md:block">
            {item.name}
          </span>
        )}
      </Link>
    );
  }

  /* ─── Render ──────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Backdrop do drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 bg-surface-lowest flex flex-col z-50
          transition-[transform,width] duration-300 ease-out
          w-72
          ${collapsed ? "md:w-20" : "md:w-72"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Fechar (mobile) */}
        <button
          onClick={onMobileClose}
          aria-label="Fechar menu"
          className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors md:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Toggle de colapso (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute -right-3 top-10 z-10 w-7 h-7 rounded-full bg-surface-lowest shadow-ambient items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-high transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Clínica */}
        <div
          className={`pt-5 pb-3 ${collapsed ? "md:flex md:justify-center px-5" : "px-5"}`}
        >
          <Link
            href="/"
            className={`flex items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}
          >
            <div
              aria-label={clinica.nome}
              className="w-11 h-11 rounded-full shrink-0 shadow-ambient gradient-primary flex items-center justify-center ring-1 ring-on-primary/10"
            >
              <Flower2 className="w-5 h-5 text-on-primary" strokeWidth={1.8} />
            </div>
            <div className={`min-w-0 overflow-hidden ${collapsed ? "md:hidden" : ""}`}>
              <h1 className="font-display text-base font-bold text-on-surface tracking-tight leading-tight whitespace-nowrap">
                {clinica.nome}
              </h1>
            </div>
          </Link>
        </div>

        {/* ═══ Área scrollável ═══ */}
        <div className={`flex-1 overflow-y-auto pb-2 ${collapsed ? "md:px-3 px-4" : "px-4"}`}>

          {/* ─── Seção MENU ───────────────────────────────────────────────────── */}
          <div className="mb-1">
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                Menu
              </p>
            )}
            <div className="space-y-0.5">
              {menuNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          {/* ─── Divider ──────────────────────────────────────────────────────── */}
          <div className={`my-2 border-t border-outline-variant/15 ${collapsed ? "md:mx-1" : ""}`} />

          {/* ─── Seção SISTEMA ────────────────────────────────────────────────── */}
          <div>
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                Sistema
              </p>
            )}
            <div className="space-y-0.5">
              {sistemaNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer — CTA + Tema */}
        <div className={`border-t border-outline-variant/15 ${collapsed ? "md:px-3 px-4 md:py-3" : "px-4"} py-3 space-y-1.5`}>
          {/* Novo Atendimento — CTA destaque */}
          <Link
            href="/atendimentos/novo"
            aria-label="Novo Atendimento"
            className={`group relative flex items-center gap-2 rounded-xl gradient-primary text-on-primary font-semibold font-body shadow-sm hover:opacity-90 transition-all ${
              collapsed
                ? "md:w-12 md:h-12 md:mx-auto md:justify-center md:px-0 md:py-0 px-4 py-2.5 justify-center"
                : "px-4 py-2.5 justify-center"
            }`}
          >
            <CalendarPlus className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            <span className={`text-sm whitespace-nowrap ${collapsed ? "md:hidden" : ""}`}>
              Novo Atendimento
            </span>
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-inverse-surface text-inverse-on-surface text-xs font-semibold font-body whitespace-nowrap opacity-0 group-hover:opacity-100 shadow-ambient transition-opacity duration-150 ease-out z-20 hidden md:block">
                Novo Atendimento
              </span>
            )}
          </Link>

        </div>
      </aside>
    </>
  );
}
