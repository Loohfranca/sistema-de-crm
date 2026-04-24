"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { removerFoto } from "@/lib/fotos";
import type { FotoRegistro } from "@/types/foto";
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
} from "@/lib/motion";

export function FotoViewModal({
  foto,
  onClose,
}: {
  foto: FotoRegistro;
  onClose: () => void;
}) {
  const [antesUrl, setAntesUrl] = useState<string | null>(null);
  const [depoisUrl, setDepoisUrl] = useState<string | null>(null);
  const [confirmaRemover, setConfirmaRemover] = useState(false);

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
    return () => urls.forEach(URL.revokeObjectURL);
  }, [foto]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleRemover() {
    await removerFoto(foto.id);
    onClose();
  }

  const dataBR = foto.data.split("-").reverse().join("/");
  const temAmbas = !!antesUrl && !!depoisUrl;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={backdropTransition}
      />
      <motion.div
        className="relative w-full max-w-5xl flex flex-col"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-white">{foto.procedimento}</h2>
            <p className="text-xs text-white/60 font-body">{dataBR}</p>
          </div>
          <div className="flex items-center gap-2">
            {!confirmaRemover ? (
              <button
                onClick={() => setConfirmaRemover(true)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-error/70 flex items-center justify-center text-white transition-colors"
                aria-label="Remover foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setConfirmaRemover(false)}
                  className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold font-body transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRemover}
                  className="px-3 h-9 rounded-full bg-error hover:opacity-90 text-on-error text-xs font-semibold font-body transition-colors"
                >
                  Confirmar remoção
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`grid ${temAmbas ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
          {antesUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <img
                src={antesUrl}
                alt="Antes"
                className="w-full h-full object-contain max-h-[70vh]"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-white font-semibold font-body">
                Antes
              </div>
            </div>
          )}
          {depoisUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <img
                src={depoisUrl}
                alt="Depois"
                className="w-full h-full object-contain max-h-[70vh]"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-primary/80 backdrop-blur-md rounded-full text-xs text-white font-semibold font-body">
                Depois
              </div>
            </div>
          )}
        </div>

        {foto.observacao && (
          <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md">
            <p className="text-[10px] text-white/60 font-body uppercase tracking-wider mb-1">
              Observação
            </p>
            <p className="text-sm text-white font-body leading-relaxed">{foto.observacao}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
