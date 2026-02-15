"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";

interface StrategyExplanationProps {
  explanation: string;
  isLoading?: boolean;
}

export default function StrategyExplanation({
  explanation,
  isLoading = false,
}: StrategyExplanationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
        Strategic Analysis
        {isLoading && (
          <span className="ml-2 text-casino-blue text-[10px]">
            AI generating...
          </span>
        )}
      </h4>
      <div
        className={cn(
          "bg-casino-dark border-l-2 border-casino-red rounded-r-lg p-4",
          isLoading && "animate-pulse"
        )}
      >
        <p className="text-casino-text text-sm leading-relaxed">
          {explanation || "Generating analysis..."}
        </p>
      </div>
    </motion.div>
  );
}
