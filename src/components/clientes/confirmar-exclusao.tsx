"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmarExclusao({
  clienteName,
  onCancel,
  onConfirm,
}: {
  clienteName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          className="bg-surface-lowest rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-7 pt-7 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-error-container flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-on-error-container" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">Excluir cliente</h2>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors text-on-surface-variant">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-7 py-4">
            <p className="text-sm text-on-surface font-body">
              Tem certeza que deseja excluir <span className="font-bold">{clienteName}</span>? Os atendimentos já registrados serão mantidos no histórico, mas a ficha será removida permanentemente.
            </p>
          </div>

          <div className="px-7 py-5 border-t border-outline-variant/15 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-full text-sm font-semibold font-body bg-error text-on-error hover:opacity-90 transition-opacity"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
