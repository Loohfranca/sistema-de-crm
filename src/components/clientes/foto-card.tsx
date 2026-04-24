"use client";

import { useEffect, useState } from "react";
import type { FotoRegistro } from "@/types/foto";

export function FotoCard({ foto, onClick }: { foto: FotoRegistro; onClick: () => void }) {
  const [antesUrl, setAntesUrl] = useState<string | null>(null);
  const [depoisUrl, setDepoisUrl] = useState<string | null>(null);

  useEffect(() => {
    const urls: string[] = [];
    if (foto.antes) {
      const u = URL.createObjectURL(foto.antes);
      setAntesUrl(u);
      urls.push(u);
    }
    if (foto.depois) {
      const u = URL.createObjectURL(foto.depois);
      setDepoisUrl(u);
      urls.push(u);
    }
    return () => {
      urls.forEach(URL.revokeObjectURL);
    };
  }, [foto]);

  const dataBR = foto.data.split("-").reverse().join("/");
  const temAmbas = Boolean(foto.antes) && Boolean(foto.depois);

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden bg-surface-high text-left aspect-[4/3]"
    >
      <div className="flex w-full h-full">
        {temAmbas ? (
          <>
            <div className="w-1/2 relative bg-surface-highest overflow-hidden border-r border-white/20">
              {antesUrl && (
                <img
                  src={antesUrl}
                  alt="Antes"
                  className="w-full h-full object-cover grayscale opacity-80"
                />
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] text-white font-semibold font-body">
                Antes
              </div>
            </div>
            <div className="w-1/2 relative bg-surface-highest overflow-hidden">
              {depoisUrl && (
                <img
                  src={depoisUrl}
                  alt="Depois"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-primary/80 backdrop-blur-md rounded-md text-[10px] text-white font-semibold font-body">
                Depois
              </div>
            </div>
          </>
        ) : (
          <div className="w-full relative bg-surface-highest overflow-hidden">
            {(antesUrl || depoisUrl) && (
              <img
                src={(antesUrl ?? depoisUrl)!}
                alt={foto.procedimento}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] text-white font-semibold font-body">
              {foto.antes ? "Antes" : "Depois"}
            </div>
          </div>
        )}
      </div>
      <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white font-semibold font-body">{foto.procedimento}</p>
        <p className="text-[10px] text-white/80 font-body">{dataBR}</p>
      </div>
    </button>
  );
}
