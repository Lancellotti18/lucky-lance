"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

interface LaunchScreenProps {
  onComplete: () => void;
}

export default function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const [phase, setPhase] = useState<"enter" | "glow" | "exit">("enter");

  useEffect(() => {
    // Check if launch was already seen this session
    if (typeof window !== "undefined" && sessionStorage.getItem("launchSeen")) {
      onComplete();
      return;
    }

    const glowTimer = setTimeout(() => setPhase("glow"), 500);
    const exitTimer = setTimeout(() => setPhase("exit"), 2500);
    const completeTimer = setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("launchSeen", "true");
      }
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="launch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
        >
          {/* Crown Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={phase === "glow" ? "animate-glow-pulse" : ""}
          >
            <Image
              src="/images/crown-logo.svg"
              alt="Lucky Lance Crown"
              width={80}
              height={64}
              priority
            />
          </motion.div>

          {/* Lucky Lance Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-6"
          >
            <h1
              className="lucky-lance-title shine-sweep"
              data-text="Lucky Lance"
            >
              Lucky Lance
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-3 text-casino-muted text-sm tracking-[0.3em] uppercase"
          >
            Poker Intelligence
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
