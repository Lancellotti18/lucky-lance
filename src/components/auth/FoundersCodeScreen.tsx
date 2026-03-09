"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface FoundersCodeScreenProps {
  firstName: string;
  onFounderActivated: () => void;
  onSkip: () => void;
}

export default function FoundersCodeScreen({
  firstName,
  onFounderActivated,
  onSkip,
}: FoundersCodeScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/founders-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code.");
      } else {
        onFounderActivated();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-casino-black flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        {/* Crown icon */}
        <div className="text-6xl mb-4">👑</div>

        <h2 className="text-casino-text text-2xl font-bold mb-1">
          Welcome, {firstName}
        </h2>
        <p className="text-casino-muted text-sm mb-8">
          Do you have a Founders Code? Founders get unlimited access — no
          subscription required.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter founders code"
            className="w-full bg-casino-dark border border-white/10 rounded-xl px-4 py-3 text-casino-text text-center text-base tracking-widest placeholder:tracking-normal placeholder:text-casino-muted/50 focus:outline-none focus:ring-2 focus:ring-casino-red/40 focus:border-casino-red/60 transition-all"
          />
          {error && <p className="text-casino-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-casino-gold text-black font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            {loading ? "Activating…" : "Activate Founders Access"}
          </button>
        </form>

        <button
          onClick={onSkip}
          className="text-casino-muted text-sm hover:text-casino-text transition-colors underline underline-offset-4"
        >
          I don&apos;t have a code — View Plans
        </button>
      </motion.div>
    </div>
  );
}
