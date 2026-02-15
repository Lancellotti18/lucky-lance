"use client";

import { create } from "zustand";
import type { AnalysisResult, Card, PokerVariant } from "@/engine/types";

interface GameState {
  variant: PokerVariant;
  holeCards: Card[];
  boardCards: Card[];
  potSize: number | null;
  amountToCall: number | null;
  analysisResult: AnalysisResult | null;
  gtoMode: boolean;

  setVariant: (v: PokerVariant) => void;
  setHoleCards: (cards: Card[]) => void;
  setBoardCards: (cards: Card[]) => void;
  setPotInfo: (pot: number, call: number) => void;
  setAnalysisResult: (r: AnalysisResult) => void;
  setGtoMode: (enabled: boolean) => void;
  resetHand: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  variant: "texasHoldem",
  holeCards: [],
  boardCards: [],
  potSize: null,
  amountToCall: null,
  analysisResult: null,
  gtoMode: false,

  setVariant: (variant) => set({ variant }),
  setHoleCards: (holeCards) => set({ holeCards }),
  setBoardCards: (boardCards) => set({ boardCards }),
  setPotInfo: (potSize, amountToCall) => set({ potSize, amountToCall }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setGtoMode: (gtoMode) => set({ gtoMode }),
  resetHand: () =>
    set({
      holeCards: [],
      boardCards: [],
      potSize: null,
      amountToCall: null,
      analysisResult: null,
    }),
}));
