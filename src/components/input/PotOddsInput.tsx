"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/game-store";
import Button from "@/components/ui/Button";

interface PotOddsInputProps {
  onSubmit: () => void;
  onSkip: () => void;
}

export default function PotOddsInput({ onSubmit, onSkip }: PotOddsInputProps) {
  const { setPotInfo } = useGameStore();
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
    <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
      <div className="text-center">
        <h3 className="text-casino-text text-xl font-semibold mb-2">
          Pot Odds Calculator
        </h3>
        <p className="text-casino-muted text-sm">
          Enter the current pot and bet to calculate pot odds
        </p>
      </div>

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
          Calculate with Pot Odds
        </Button>
        <Button variant="ghost" fullWidth onClick={onSkip}>
          Skip (Equity Only)
        </Button>
      </div>
    </div>
  );
}
