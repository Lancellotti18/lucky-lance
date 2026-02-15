"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import type { OutInfo } from "@/engine/types";
import { DRAW_TYPE_NAMES } from "@/engine/constants";

interface OutsDisplayProps {
  outs: OutInfo[];
  totalClean: number;
  totalDirty: number;
}

export default function OutsDisplay({
  outs,
  totalClean,
  totalDirty,
}: OutsDisplayProps) {
  if (outs.length === 0) {
    return (
      <div>
        <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
          Outs
        </h4>
        <p className="text-casino-muted text-sm">
          No drawing outs (made hand or preflop/river).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
        Outs
      </h4>

      {/* Outs grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {outs.map((out, idx) => (
          <motion.div
            key={out.type}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="bg-casino-dark rounded-lg p-3 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  out.isClean ? "bg-casino-green" : "bg-casino-gold"
                )}
              />
              <span className="text-casino-text text-xs font-medium">
                {DRAW_TYPE_NAMES[out.type] || out.type}
              </span>
            </div>
            <span className="text-casino-blue text-lg font-bold">
              {Math.round(out.count)}
            </span>
            <span className="text-casino-muted text-xs ml-1">outs</span>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <p className="text-casino-muted text-sm">
        <span className="text-casino-green font-medium">{totalClean}</span>{" "}
        clean outs
        {totalDirty > 0 && (
          <>
            , <span className="text-casino-gold font-medium">{totalDirty}</span>{" "}
            dirty outs
          </>
        )}
        {" "}({totalClean + totalDirty} total)
      </p>
    </div>
  );
}
