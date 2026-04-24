// ─── Movimento — identidade editorial Lumière ────────────────────────────────
// Durações entre 180–260ms, easing ease-out-expo (desacelera no fim).
// Regra: nada mais chamativo que isso — animação aqui é sussurro, não estrela.

import type { Transition, Variants } from "motion/react";

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const DURATION = {
  fast: 0.18,
  base: 0.22,
  slow: 0.28,
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const backdropTransition: Transition = {
  duration: DURATION.fast,
  ease: "linear",
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 6 },
};

export const modalTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT_EXPO,
};

export const sidePanelVariants: Variants = {
  hidden: { x: 32, opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: 24, opacity: 0 },
};

export const sidePanelTransition: Transition = {
  duration: DURATION.slow,
  ease: EASE_OUT_EXPO,
};

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
};

export const pageTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT_EXPO,
};

// Stagger para listas (clientes, atendimentos, tabela financeira)
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT_EXPO },
  },
};
