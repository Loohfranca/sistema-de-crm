"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  CalendarPlus,
  Calendar,
  Users,
  DollarSign,
  Package,
  Sparkles,
  Settings,
  CornerDownLeft,
  Menu,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { getClientes } from "@/lib/clientes";
import type { Cliente } from "@/lib/clientes";
import { PrismaMark } from "./topbar/prisma-mark";
import { NotificationsBell } from "./topbar/notifications-bell";
import { ProfileMenu } from "./topbar/profile-menu";
import { ThemeToggle } from "./theme-toggle";

interface Atalho {
  label: string;
  descricao: string;
  icon: typeof CalendarPlus;
  iconBg: string;
  iconColor: string;
  href: string;
}

const ATALHOS: Atalho[] = [
  { label: "Novo atendimento", descricao: "Agendar uma cliente", icon: CalendarPlus, iconBg: "bg-primary-fixed", iconColor: "text-on-primary-fixed", href: "/atendimentos/novo" },
  { label: "Agenda", descricao: "Ver calendário", icon: Calendar, iconBg: "bg-secondary-fixed", iconColor: "text-on-secondary-container", href: "/agenda" },
  { label: "Clientes", descricao: "Lista completa", icon: Users, iconBg: "bg-tertiary-fixed", iconColor: "text-on-tertiary-container", href: "/clientes" },
  { label: "Financeiro", descricao: "Lançamentos do mês", icon: DollarSign, iconBg: "bg-primary-fixed-dim", iconColor: "text-on-primary-fixed", href: "/financeiro" },
  { label: "Procedimentos", descricao: "Catálogo de serviços", icon: Sparkles, iconBg: "bg-primary/10", iconColor: "text-primary", href: "/procedimentos" },
  { label: "Estoque", descricao: "Produtos e alertas", icon: Package, iconBg: "bg-surface-high", iconColor: "text-on-surface", href: "/estoque" },
  { label: "Configurações", descricao: "Perfil e integrações", icon: Settings, iconBg: "bg-surface-high", iconColor: "text-on-surface-variant", href: "/configuracoes" },
];

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClientes(getClientes());
    const sync = () => setClientes(getClientes());
    window.addEventListener("crm_clientes_updated", sync);
    return () => window.removeEventListener("crm_clientes_updated", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const termo = query.trim().toLowerCase();
  const atalhosFiltrados = termo
    ? ATALHOS.filter((a) => a.label.toLowerCase().includes(termo))
    : ATALHOS;
  const clientesFiltrados = termo
    ? clientes.filter((c) => c.name.toLowerCase().includes(termo)).slice(0, 5)
    : [];
  const totalItems = atalhosFiltrados.length + clientesFiltrados.length;

  useEffect(() => {
    setFocusIndex(0);
  }, [termo]);

  function executar(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIndex < atalhosFiltrados.length) {
        const a = atalhosFiltrados[focusIndex];
        if (a) executar(a.href);
      } else {
        const c = clientesFiltrados[focusIndex - atalhosFiltrados.length];
        if (c) executar(`/clientes/${c.id}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 md:gap-6">
        {/* Hamburger (mobile apenas) */}
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-high/70 transition-colors md:hidden"
        >
          <Menu className="w-[20px] h-[20px]" strokeWidth={1.8} />
        </button>

        {/* Esquerda — marca Prisma */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group"
          aria-label="Prisma — início"
        >
          <PrismaMark className="w-6 h-6 transition-transform group-hover:rotate-6" />
          <span className="hidden sm:inline font-display text-lg font-bold text-on-surface tracking-tight">
            Prisma
          </span>
        </Link>

        {/* Centro — busca */}
        <div ref={searchRef} className="flex-1 max-w-xl mx-auto relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cliente, procedimento..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-surface-high/60 backdrop-blur text-on-surface text-sm font-body focus:bg-surface-lowest focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                style={{ transformOrigin: "top" }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface-lowest rounded-3xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
              >
                {atalhosFiltrados.length > 0 && (
                  <div className="px-2 py-2">
                    <p className="px-3 py-2 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                      {termo ? "Ações" : "Atalhos rápidos"}
                    </p>
                    {atalhosFiltrados.map((a, idx) => {
                      const isFocused = idx === focusIndex;
                      return (
                        <button
                          key={a.label}
                          onMouseEnter={() => setFocusIndex(idx)}
                          onClick={() => executar(a.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left ${
                            isFocused ? "bg-surface-high/70" : "hover:bg-surface-high/50"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 ${a.iconBg} rounded-xl flex items-center justify-center shrink-0`}
                          >
                            <a.icon className={`w-4 h-4 ${a.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface font-body truncate">
                              {a.label}
                            </p>
                            <p className="text-[11px] text-on-surface-variant font-body truncate">
                              {a.descricao}
                            </p>
                          </div>
                          {isFocused && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {clientesFiltrados.length > 0 && (
                  <div className="px-2 py-2 border-t border-outline-variant/15">
                    <p className="px-3 py-2 text-[10px] font-bold text-on-surface-variant font-body uppercase tracking-widest">
                      Clientes
                    </p>
                    {clientesFiltrados.map((c, idx) => {
                      const globalIdx = atalhosFiltrados.length + idx;
                      const isFocused = globalIdx === focusIndex;
                      return (
                        <button
                          key={c.id}
                          onMouseEnter={() => setFocusIndex(globalIdx)}
                          onClick={() => executar(`/clientes/${c.id}`)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left ${
                            isFocused ? "bg-surface-high/70" : "hover:bg-surface-high/50"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-on-primary-fixed font-display">
                              {c.avatar}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface font-body truncate">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-on-surface-variant font-body truncate">
                              {c.phone ?? c.email}
                            </p>
                          </div>
                          {isFocused && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {termo && totalItems === 0 && (
                  <div className="py-8 text-center text-sm text-on-surface-variant font-body">
                    Nenhum resultado para &ldquo;{query}&rdquo;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direita — tema + notificações + CTA + perfil */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <NotificationsBell />

          <Link
            href="/atendimentos/novo"
            aria-label="Novo atendimento"
            className="ml-1 flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full gradient-primary text-on-primary text-sm font-semibold font-body hover:opacity-90 transition-opacity"
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden lg:inline">Novo Atendimento</span>
          </Link>

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
