"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { useGameStore } from "@/stores/game-store";
import { POSITIONS } from "@/engine/types";
import type { Position } from "@/engine/types";
import Button from "@/components/ui/Button";

interface PotOddsInputProps {
  onSubmit: () => void;
  onSkip: () => void;
}

const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9];

export default function PotOddsInput({ onSubmit, onSkip }: PotOddsInputProps) {
  const { setPotInfo, setPosition, setNumPlayers, position, numPlayers } =
    useGameStore();
  const [pot, setPot] = useState("");
  const [call, setCall] = useState("");

  const handleSubmit = () => {
    const potNum = parseFloat(pot);
    const callNum = parseFloat(call);
    if (!isNaN(potNum) && potNum > 0 && !isNaN(callNum) && callNum > 0) {
      setPotInfo(potNum, callNum);
    }
    onSubmit();
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm px-4">
      <div className="text-center">
        <h3 className="text-casino-text text-xl font-semibold mb-2">
          Game Info
        </h3>
        <p className="text-casino-muted text-sm">
          Enter position, players, and pot details
        </p>
      </div>

      {/* Position selector */}
      <div className="w-full">
        <label className="text-casino-muted text-xs uppercase tracking-wider mb-1.5 block">
          Your Position
        </label>
        <div className="grid grid-cols-6 gap-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosition(position === pos ? null : pos)}
              className={cn(
                "py-2 rounded-lg text-xs font-bold transition-all duration-100",
                position === pos
                  ? "bg-casino-red text-white shadow-lg shadow-casino-red/30"
                  : "bg-casino-dark text-casino-muted border border-white/10 hover:border-white/25 active:scale-95"
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Players remaining */}
      <div className="w-full">
        <label className="text-casino-muted text-xs uppercase tracking-wider mb-1.5 block">
          Players in Hand
        </label>
        <div className="grid grid-cols-8 gap-1">
          {PLAYER_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumPlayers(n)}
              className={cn(
                "py-2 rounded-lg text-sm font-bold transition-all duration-100",
                numPlayers === n
                  ? "bg-casino-blue text-white shadow-lg shadow-casino-blue/30"
                  : "bg-casino-dark text-casino-muted border border-white/10 hover:border-white/25 active:scale-95"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Pot and call inputs */}
      <div className="flex flex-col gap-4 w-full">
        <div>
          <label className="text-casino-muted text-xs uppercase tracking-wider mb-1.5 block">
            Current Pot Size
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-muted">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={pot}
              onChange={(e) => setPot(e.target.value)}
              placeholder="0"
              className="w-full bg-casino-dark border border-white/10 text-casino-text rounded-lg
                pl-7 pr-3 py-3 text-lg
                focus:outline-none focus:ring-2 focus:ring-casino-red/50 focus:border-casino-red
                placeholder:text-casino-muted/40"
            />
          </div>
        </div>

        <div>
          <label className="text-casino-muted text-xs uppercase tracking-wider mb-1.5 block">
            Amount to Call
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-muted">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={call}
              onChange={(e) => setCall(e.target.value)}
              placeholder="0"
              className="w-full bg-casino-dark border border-white/10 text-casino-text rounded-lg
                pl-7 pr-3 py-3 text-lg
                focus:outline-none focus:ring-2 focus:ring-casino-red/50 focus:border-casino-red
                placeholder:text-casino-muted/40"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Button fullWidth onClick={handleSubmit}>
          Analyze Hand
        </Button>
        <Button variant="ghost" fullWidth onClick={onSkip}>
          Skip (Equity Only)
        </Button>
      </div>
    </div>
  );
}
