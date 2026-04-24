"use client";

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { Agendamento } from "@/lib/store";
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
} from "@/lib/motion";

export function ConfirmModal({ apt, onClose }: { apt: Agendamento; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={backdropTransition}
      />
      <motion.div
        className="relative bg-surface-lowest rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
      >
        <div className="w-20 h-20 rounded-full bg-tertiary-fixed flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-on-tertiary-container" />
        </div>
        <h2 className="text-2xl font-bold font-display text-on-surface mb-2">Pagamento confirmado!</h2>
        <p className="text-sm text-on-surface-variant font-body mb-1">
          Atendimento de <strong>{apt.cliente}</strong> finalizado.
        </p>
        <p className="text-xs text-outline font-body mb-8">Status atualizado para <strong>Recebido</strong></p>
        <button onClick={onClose} className="w-full py-3.5 rounded-2xl gradient-primary text-on-primary text-base font-bold font-body hover:opacity-90 transition-opacity">
          OK, entendido!
        </button>
      </motion.div>
    </div>
  );
}
