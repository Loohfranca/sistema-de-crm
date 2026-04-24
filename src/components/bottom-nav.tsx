"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Users,
  Plus,
  Sparkles,
  BarChart3,
  CalendarPlus,
  UserPlus,
  Wand2,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";

type NavItem = { name: string; href: string; icon: typeof Calendar };

const ITEMS_LEFT: NavItem[] = [
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Clientes", href: "/clientes", icon: Users },
];

const ITEMS_RIGHT: NavItem[] = [
  { name: "Procedimentos", href: "/procedimentos", icon: Sparkles },
  { name: "Financeiro", href: "/financeiro", icon: BarChart3 },
];

interface QuickAction {
  label: string;
  icon: typeof CalendarPlus;
  href: string;
  iconBg: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Novo atendimento",
    icon: CalendarPlus,
    href: "/atendimentos/novo",
    iconBg: "bg-primary-fixed",
    iconColor: "text-on-primary-fixed",
  },
  {
    label: "Nova cliente",
    icon: UserPlus,
    href: "/clientes",
    iconBg: "bg-secondary-fixed",
    iconColor: "text-on-secondary-container",
  },
  {
    label: "Novo procedimento",
    icon: Wand2,
    href: "/procedimentos",
    iconBg: "bg-tertiary-fixed",
    iconColor: "text-on-tertiary-container",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fecha ao mudar de rota
  useEffect(() => {
    setActionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!actionsOpen) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setActionsOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [actionsOpen]);

  function ir(href: string) {
    setActionsOpen(false);
    router.push(href);
  }

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Backdrop do menu de ações */}
      <AnimatePresence>
        {actionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            onClick={() => setActionsOpen(false)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Bottom nav — só mobile */}
      <div
        ref={wrapRef}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none"
      >
        {/* Quick actions (aparecem acima do botão central) */}
        <AnimatePresence>
          {actionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              style={{ transformOrigin: "bottom center" }}
              className="absolute left-1/2 -translate-x-1/2 bottom-[92px] w-[280px] pointer-events-auto"
            >
              <div className="bg-surface-lowest rounded-3xl shadow-2xl overflow-hidden p-2">
                {QUICK_ACTIONS.map((a, idx) => (
                  <motion.button
                    key={a.label}
                    onClick={() => ir(a.href)}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: EASE_OUT_EXPO,
                      delay: 0.04 + idx * 0.03,
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-high/60 active:bg-surface-high/80 transition-colors text-left"
                  >
                    <div
                      className={`w-10 h-10 ${a.iconBg} rounded-xl flex items-center justify-center shrink-0`}
                    >
                      <a.icon className={`w-[18px] h-[18px] ${a.iconColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-on-surface font-body">
                      {a.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra inferior */}
        <nav
          className="pointer-events-auto bg-surface-lowest/92 backdrop-blur-xl border-t border-outline-variant/15"
          style={{
            boxShadow: "0 -6px 24px rgba(27,28,28,0.06)",
            paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
          }}
        >
          <div className="grid grid-cols-5 items-end pt-2">
            {ITEMS_LEFT.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 transition-colors duration-150 ease-out ${
                    active ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <item.icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span
                    className={`text-[10px] font-body leading-none ${
                      active ? "font-semibold" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* Slot central — botão + protrude */}
            <div className="flex justify-center relative">
              <motion.button
                onClick={() => setActionsOpen((o) => !o)}
                aria-label={actionsOpen ? "Fechar ações" : "Abrir ações rápidas"}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
                className="absolute -top-6 w-14 h-14 rounded-full gradient-primary text-on-primary shadow-xl flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: actionsOpen ? 45 : 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                >
                  <Plus className="w-6 h-6" strokeWidth={2.2} />
                </motion.div>
              </motion.button>
              {/* Placeholder pra manter a altura do grid */}
              <div className="h-[52px]" aria-hidden="true" />
            </div>

            {ITEMS_RIGHT.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 transition-colors duration-150 ease-out ${
                    active ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <item.icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span
                    className={`text-[10px] font-body leading-none ${
                      active ? "font-semibold" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
