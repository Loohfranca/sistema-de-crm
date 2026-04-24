"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [perfil, setPerfil] = useState({
    nome: "Dra. Helena Martins",
    especialidade: "Dermatologista",
    iniciais: "DH",
  });
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const carregar = () => {
      const saved = localStorage.getItem("crm_perfil");
      if (!saved) return;
      try {
        const p = JSON.parse(saved);
        const parts = p.nome.split(" ");
        const iniciais =
          parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();
        setPerfil({
          nome: p.nome,
          especialidade: (p.especialidade ?? "").split(" -")[0],
          iniciais,
        });
      } catch {}
    };
    carregar();
    window.addEventListener("crm_settings_updated", carregar);
    return () => window.removeEventListener("crm_settings_updated", carregar);
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Perfil"
        className="w-10 h-10 rounded-full bg-primary-fixed-dim hover:scale-105 transition-transform flex items-center justify-center"
      >
        <span className="text-xs font-semibold text-on-primary-fixed font-display">
          {perfil.iniciais}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-12 w-64 bg-surface-lowest rounded-3xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant/10">
              <div className="w-11 h-11 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-on-primary-fixed font-display">
                  {perfil.iniciais}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface font-body truncate">
                  {perfil.nome}
                </p>
                <p className="text-[11px] text-on-surface-variant font-body truncate">
                  {perfil.especialidade}
                </p>
              </div>
            </div>

            <div className="px-2 py-2">
              <button
                onClick={() => {
                  toggle();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-high/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-high flex items-center justify-center shrink-0">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-on-surface-variant" />
                  ) : (
                    <Moon className="w-4 h-4 text-on-surface-variant" />
                  )}
                </div>
                <span className="text-sm text-on-surface font-body">
                  {isDark ? "Modo claro" : "Modo escuro"}
                </span>
              </button>

              <Link
                href="/configuracoes"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-high/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-high flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-on-surface-variant" />
                </div>
                <span className="text-sm text-on-surface font-body">
                  Configurações
                </span>
              </Link>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-error-container/30 transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-surface-high flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4 text-error" />
                </div>
                <span className="text-sm text-error font-body">Sair</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
