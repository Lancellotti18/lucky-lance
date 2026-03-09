"use client";

import { motion } from "motion/react";

const PLAN_NAMES: Record<string, string> = {
  pocket_pair: "The Pocket Pair",
  the_flop: "The Flop",
  the_nuts: "The Nuts",
};

interface PaymentSuccessProps {
  plan: string;
  onEnter: () => void;
}

export default function PaymentSuccess({ plan, onEnter }: PaymentSuccessProps) {
  return (
    <div className="min-h-screen bg-casino-black flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-7xl mb-6"
      >
        ✅
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="lucky-lance-title text-3xl mb-3">
          Welcome to {PLAN_NAMES[plan] || "Lucky Lance"}!
        </h2>
        <p className="text-casino-muted text-sm mb-8 max-w-xs">
          Your plan is now active. Time to sharpen your game.
        </p>

        <button
          onClick={onEnter}
          className="bg-casino-red text-white font-bold px-10 py-3.5 rounded-xl shadow-lg shadow-casino-red/30 hover:bg-casino-red-glow active:scale-95 transition-all duration-150 text-lg"
        >
          Let&apos;s Play →
        </button>
      </motion.div>
    </div>
  );
}
