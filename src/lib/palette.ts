"use client";

import { useCallback, useEffect, useState } from "react";

export type Palette = "sunset" | "rose" | "onyx" | "ocean";

export const PALETTES: { id: Palette; nome: string; descricao: string; cores: string[] }[] = [
  {
    id: "sunset",
    nome: "Sunset",
    descricao: "Cream + laranja vibrante — calma e premium warm",
    cores: ["#db6e2d", "#f5e8d8", "#2d2519", "#6b4f2a"],
  },
  {
    id: "rose",
    nome: "Rosé Original",
    descricao: "Suave e feminina — rose + dourado vibrante",
    cores: ["#815252", "#fdbfbf", "#fed65b", "#f1c87d"],
  },
  {
    id: "onyx",
    nome: "Onyx",
    descricao: "Minimalista — preto, branco e azul com toque emerald",
    cores: ["#1a1a1a", "#ffffff", "#2563eb", "#059669"],
  },
  {
    id: "ocean",
    nome: "Ocean",
    descricao: "Wellness premium — teal + mint + verde-claro",
    cores: ["#1f192f", "#2d6073", "#65b8a6", "#b5e8c3"],
  },
];

const STORAGE_KEY = "crm_palette";
const EVENT = "crm_palette_updated";

function readStored(): Palette {
  if (typeof window === "undefined") return "sunset";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "rose" || raw === "onyx" || raw === "ocean" || raw === "sunset"
    ? raw
    : "sunset";
}

export function applyPalette(p: Palette): void {
  if (typeof document === "undefined") return;
  if (p === "sunset") {
    document.documentElement.removeAttribute("data-palette");
  } else {
    document.documentElement.setAttribute("data-palette", p);
  }
}

export function usePalette(): { palette: Palette; setPalette: (p: Palette) => void } {
  const [palette, setPaletteState] = useState<Palette>("sunset");

  useEffect(() => {
    const initial = readStored();
    setPaletteState(initial);
    applyPalette(initial);

    const onEvent = () => {
      const next = readStored();
      setPaletteState(next);
      applyPalette(next);
    };
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
  }, []);

  const setPalette = useCallback((next: Palette) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyPalette(next);
    setPaletteState(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { palette, setPalette };
}

// Snippet inline pro <head> — evita flash de paleta errada
export const PALETTE_INIT_SCRIPT = `
(function() {
  try {
    var p = localStorage.getItem('${STORAGE_KEY}');
    if (p === 'rose' || p === 'onyx' || p === 'ocean') {
      document.documentElement.setAttribute('data-palette', p);
    }
  } catch (e) {}
})();
`.trim();
