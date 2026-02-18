"use client";

import { create } from "zustand";
import type { AnalysisResult, Card, PokerVariant, Position } from "@/engine/types";

interface GameState {
  variant: PokerVariant;
  holeCards: Card[];
  boardCards: Card[];
  potSize: number | null;
  amountToCall: number | null;
  analysisResult: AnalysisResult | null;
  gtoMode: boolean;
  position: Position | null;
  numPlayers: number;

  setVariant: (v: PokerVariant) => void;
  setHoleCards: (cards: Card[]) => void;
  setBoardCards: (cards: Card[]) => void;
  setPotInfo: (pot: number, call: number) => void;
  setAnalysisResult: (r: AnalysisResult) => void;
  setGtoMode: (enabled: boolean) => void;
  setPosition: (p: Position | null) => void;
  setNumPlayers: (n: number) => void;
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
  position: null,
  numPlayers: 6,

  setVariant: (variant) => set({ variant }),
  setHoleCards: (holeCards) => set({ holeCards }),
  setBoardCards: (boardCards) => set({ boardCards }),
  setPotInfo: (potSize, amountToCall) => set({ potSize, amountToCall }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setGtoMode: (gtoMode) => set({ gtoMode }),
  setPosition: (position) => set({ position }),
  setNumPlayers: (numPlayers) => set({ numPlayers }),
  resetHand: () =>
    set({
      holeCards: [],
      boardCards: [],
      potSize: null,
      amountToCall: null,
      analysisResult: null,
      position: null,
      numPlayers: 6,
    }),
}));
