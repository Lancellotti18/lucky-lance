"use client";

import { motion } from "motion/react";

interface UploadLimitModalProps {
  onUpgrade: () => void;
  onClose: () => void;
  uploadCount: number;
  monthlyLimit: number;
}

export default function UploadLimitModal({
  onUpgrade,
  onClose,
  uploadCount,
  monthlyLimit,
}: UploadLimitModalProps) {
  return (
    <div className="min-h-screen bg-casino-black flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-5xl mb-4">⛔</div>
        <h2 className="text-casino-text text-2xl font-bold mb-3">
          Monthly Limit Reached
        </h2>
        <p className="text-casino-muted text-sm mb-2 leading-relaxed">
          You&apos;ve reached your monthly upload limit ({uploadCount} /{" "}
          {monthlyLimit} uploads). Upgrade your plan or wait until your limit
          resets next month.
        </p>
        <p className="text-casino-muted text-xs mb-8">
          Limits reset on the 1st of each month.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-casino-red text-white font-bold py-3 rounded-xl shadow-lg shadow-casino-red/30 hover:bg-casino-red-glow active:scale-95 transition-all duration-150"
          >
            Upgrade My Plan
          </button>
          <button
            onClick={onClose}
            className="w-full bg-casino-dark border border-white/10 text-casino-muted font-semibold py-3 rounded-xl hover:text-casino-text active:scale-95 transition-all duration-150"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
