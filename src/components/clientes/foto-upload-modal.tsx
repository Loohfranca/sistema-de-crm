"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { redimensionarImagem, salvarFoto } from "@/lib/fotos";
import type { FotoRegistro } from "@/types/foto";
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
} from "@/lib/motion";

export function FotoUploadModal({
  clienteId,
  onClose,
}: {
  clienteId: string;
  onClose: () => void;
}) {
  const [procedimento, setProcedimento] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");
  const [antesFile, setAntesFile] = useState<File | null>(null);
  const [depoisFile, setDepoisFile] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!procedimento || (!antesFile && !depoisFile)) return;
    setSalvando(true);
    try {
      const foto: FotoRegistro = {
        id: `f${Date.now()}`,
        clienteId,
        procedimento,
        data,
        observacao: observacao || undefined,
        antes: antesFile ? await redimensionarImagem(antesFile) : undefined,
        depois: depoisFile ? await redimensionarImagem(depoisFile) : undefined,
        createdAt: Date.now(),
      };
      await salvarFoto(foto);
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  const podeEnviar = !!procedimento && (!!antesFile || !!depoisFile);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={backdropTransition}
      />
      <motion.div
        className="relative bg-surface-lowest rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/20 shrink-0">
          <div>
            <h2 className="text-lg font-bold font-display text-on-surface">Nova foto</h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Adicione antes, depois, ou só uma
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <UploadSlot label="Antes" file={antesFile} onChange={setAntesFile} />
            <UploadSlot label="Depois" file={depoisFile} onChange={setDepoisFile} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
              Procedimento
            </label>
            <input
              required
              type="text"
              value={procedimento}
              onChange={(e) => setProcedimento(e.target.value)}
              placeholder="Ex: Limpeza de Pele, Botox..."
              className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
              Data
            </label>
            <input
              required
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
              Observação <span className="text-outline font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Produtos usados, reação da pele, resultado..."
              className="w-full px-4 py-3 rounded-2xl bg-surface-high text-on-surface text-sm font-body border border-transparent focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeEnviar || salvando}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold font-body gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {salvando ? "Salvando..." : (<><Check className="w-4 h-4" />Salvar</>)}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function UploadSlot({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div>
      <p className="text-[10px] font-semibold text-on-surface-variant font-body uppercase tracking-wider mb-2">
        {label}
      </p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative w-full aspect-[4/3] rounded-2xl bg-surface-high hover:bg-surface-highest border-2 border-dashed border-outline-variant/30 hover:border-primary/30 overflow-hidden transition-all flex items-center justify-center"
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-on-surface-variant">
            <Camera className="w-6 h-6" />
            <span className="text-xs font-semibold font-body">Adicionar</span>
          </div>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
