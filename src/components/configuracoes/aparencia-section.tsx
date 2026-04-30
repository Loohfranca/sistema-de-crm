"use client";

import { Palette as PaletteIcon, Check } from "lucide-react";
import { usePalette, PALETTES, type Palette } from "@/lib/palette";

export function AparenciaSection() {
  const { palette, setPalette } = usePalette();

  return (
    <div className="bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center gap-3 mb-1">
        <PaletteIcon className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-on-surface">Aparência</h2>
      </div>
      <p className="text-sm text-on-surface-variant font-body mb-6">
        Escolha o tema visual da plataforma — a mudança é aplicada na hora
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PALETTES.map((p) => {
          const ativo = palette === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPalette(p.id as Palette)}
              className={`group relative text-left rounded-2xl p-5 transition-all border-2 ${
                ativo
                  ? "border-primary shadow-ambient bg-surface-low/40"
                  : "border-outline-variant/20 bg-surface-low/20 hover:border-outline-variant/50 hover:bg-surface-low/40"
              }`}
            >
              {ativo && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full gradient-primary text-on-primary flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
              )}

              {/* Swatches */}
              <div className="flex items-center gap-1.5 mb-4">
                {p.cores.map((cor, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-xl ring-1 ring-black/5 shadow-sm"
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>

              <h3 className={`font-display text-base font-bold mb-1 ${ativo ? "text-primary" : "text-on-surface"}`}>
                {p.nome}
              </h3>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed">
                {p.descricao}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 px-4 py-3 rounded-2xl bg-surface-low/40 border border-outline-variant/15">
        <p className="text-[11px] text-on-surface-variant font-body">
          💡 A escolha é salva no navegador e persiste entre sessões. Modo escuro ainda usa paleta única — em breve cada tema terá variante dark dedicada.
        </p>
      </div>
    </div>
  );
}
