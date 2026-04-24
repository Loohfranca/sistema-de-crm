"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Camera } from "lucide-react";
import { listarFotos } from "@/lib/fotos";
import type { FotoRegistro } from "@/types/foto";
import { FotoCard } from "./foto-card";
import { FotoUploadModal } from "./foto-upload-modal";
import { FotoViewModal } from "./foto-view-modal";

export function GaleriaFotos({ clienteId }: { clienteId: string }) {
  const [fotos, setFotos] = useState<FotoRegistro[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<FotoRegistro | null>(null);

  const carregar = useCallback(() => {
    listarFotos(clienteId).then((lista) => {
      setFotos(lista);
      setCarregado(true);
    });
  }, [clienteId]);

  useEffect(() => {
    carregar();
    window.addEventListener("crm_fotos_updated", carregar);
    return () => window.removeEventListener("crm_fotos_updated", carregar);
  }, [carregar]);

  return (
    <div className="mt-6 bg-surface-lowest rounded-3xl p-6 shadow-ambient">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">
            Evolução Fotográfica
          </h2>
          <p className="text-sm text-on-surface-variant font-body mt-0.5">
            {fotos.length > 0
              ? `${fotos.length} ${fotos.length === 1 ? "registro" : "registros"} de antes e depois`
              : "Registros de antes e depois dos procedimentos"}
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-semibold font-body text-on-surface hover:bg-surface-high transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          Adicionar Foto
        </button>
      </div>

      {carregado && fotos.length === 0 ? (
        <button
          onClick={() => setUploadOpen(true)}
          className="w-full py-16 rounded-2xl bg-surface-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center gap-3 hover:bg-surface-high hover:border-primary/30 transition-all"
        >
          <div className="w-14 h-14 rounded-full bg-surface-high flex items-center justify-center">
            <Camera className="w-6 h-6 text-on-surface-variant" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface font-body">
              Adicionar primeira foto
            </p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Antes e depois, progresso, resultados
            </p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {fotos.map((f) => (
            <FotoCard key={f.id} foto={f} onClick={() => setViewing(f)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {uploadOpen && (
          <FotoUploadModal
            clienteId={clienteId}
            onClose={() => setUploadOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewing && <FotoViewModal foto={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>
    </div>
  );
}
