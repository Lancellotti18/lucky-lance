"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function AnalysisLoader() {
  const [phase, setPhase] = useState<"spin" | "lightning" | "flash">("spin");

  useEffect(() => {
    const lightningTimer = setTimeout(() => setPhase("lightning"), 1500);
    const flashTimer = setTimeout(() => setPhase("flash"), 2000);

    return () => {
      clearTimeout(lightningTimer);
      clearTimeout(flashTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      {/* Spinner */}
      <AnimatePresence>
        {phase === "spin" && (
          <motion.div
            key="spinner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 border-3 border-casino-blue/30 border-t-casino-blue rounded-full animate-spin-slow" />
            <p className="text-casino-muted text-sm animate-pulse">
              Analyzing hand...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightning bolt */}
      <AnimatePresence>
        {(phase === "lightning" || phase === "flash") && (
          <motion.div
            key="lightning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 100 200"
              className="w-16 h-32"
              style={{ filter: "drop-shadow(0 0 10px #60a5fa) drop-shadow(0 0 20px #3b82f6)" }}
            >
              <defs>
                <filter id="lightningGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M55 0 L35 80 L55 80 L30 200 L70 100 L50 100 L75 0 Z"
                fill="#3b82f6"
                stroke="#60a5fa"
                strokeWidth="2"
                filter="url(#lightningGlow)"
                className="animate-lightning"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: 0,
                }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash effect */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
