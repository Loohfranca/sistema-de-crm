"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useSidebarCollapsed } from "@/lib/sidebar-state";
import { EASE_OUT_EXPO } from "@/lib/motion";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Atendimentos", href: "/atendimentos", icon: CalendarPlus },
  { name: "Procedimentos", href: "/procedimentos", icon: Sparkles },
  { name: "Financeiro", href: "/financeiro", icon: BarChart3 },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
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
    nome: "Gabelia Beauty",
    subtitulo: "Beauty Studio",
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
          subtitulo: partes.slice(2).join(" ") || "Studio",
        });
      } catch {}
    };
    carregar();
    window.addEventListener("crm_settings_updated", carregar);
    return () => window.removeEventListener("crm_settings_updated", carregar);
  }, []);

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
          className={`pt-7 pb-6 ${collapsed ? "md:flex md:justify-center px-5" : "px-5"}`}
        >
          <Link
            href="/"
            className={`flex items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}
          >
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-ambient">
              <Image
                src="/gabelia-logo-v2.png"
                alt={clinica.nome}
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`min-w-0 overflow-hidden ${collapsed ? "md:hidden" : ""}`}>
              <h1 className="font-display text-base font-bold text-on-surface tracking-tight leading-tight whitespace-nowrap">
                {clinica.nome}
              </h1>
              <p className="text-[11px] text-on-surface-variant font-body whitespace-nowrap">
                {clinica.subtitulo}
              </p>
            </div>
          </Link>
        </div>

        {/* Navegação */}
        <nav
          className={`flex-1 space-y-1 pb-6 overflow-y-auto ${collapsed ? "md:px-3 px-4" : "px-4"}`}
        >
          {navigation.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            const collapsedIconOnly = collapsed; // apenas visual em md+

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center rounded-2xl transition-all duration-150 ease-out gap-3 px-4 py-3 ${
                  collapsedIconOnly
                    ? "md:justify-center md:w-14 md:h-14 md:mx-auto md:gap-0 md:px-0 md:py-0"
                    : ""
                } ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-high/70 hover:text-on-surface"
                }`}
              >
                <item.icon
                  className="shrink-0 w-[20px] h-[20px]"
                  strokeWidth={isActive ? 2.2 : 1.8}
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
          })}
        </nav>
      </aside>
    </>
  );
}
