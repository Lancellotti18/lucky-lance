"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";

interface EquityDisplayProps {
  equity: number;
}

export default function EquityDisplay({ equity }: EquityDisplayProps) {
  const pct = (equity * 100).toFixed(1);
  const color =
    equity > 0.55
      ? "text-casino-green"
      : equity > 0.4
        ? "text-casino-gold"
        : "text-casino-red";
  const barColor =
    equity > 0.55
      ? "bg-casino-green"
      : equity > 0.4
        ? "bg-casino-gold"
        : "bg-casino-red";

  return (
    <div>
      <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
        Win Probability vs. Balanced Range
      </h4>
      <div className="flex items-baseline gap-2 mb-2">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
          className={cn("text-4xl font-bold", color)}
        >
          {pct}%
        </motion.span>
        <span className="text-casino-muted text-sm">equity</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-casino-dark rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${equity * 100}%` }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>
    </div>
  );
}
