"use client";

import { create } from "zustand";
import type { AppScreen } from "@/engine/types";

interface UIState {
  screen: AppScreen;
  isNavOpen: boolean;
  capturedImages: string[];
  isAnalyzing: boolean;
  isAddingBoardCards: boolean;
  error: string | null;

  setScreen: (s: AppScreen) => void;
  toggleNav: () => void;
  closeNav: () => void;
  addCapturedImage: (base64: string) => void;
  removeCapturedImage: (index: number) => void;
  clearCapturedImages: () => void;
  setAnalyzing: (analyzing: boolean) => void;
  setIsAddingBoardCards: (v: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  screen: "launch",
  isNavOpen: false,
  capturedImages: [],
  isAnalyzing: false,
  isAddingBoardCards: false,
  error: null,

  setScreen: (screen) => set({ screen }),
  toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
  closeNav: () => set({ isNavOpen: false }),
  addCapturedImage: (base64) =>
    set((state) => ({
      capturedImages: [...state.capturedImages, base64],
    })),
  removeCapturedImage: (index) =>
    set((state) => ({
      capturedImages: state.capturedImages.filter((_, i) => i !== index),
    })),
  clearCapturedImages: () => set({ capturedImages: [] }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setIsAddingBoardCards: (isAddingBoardCards) => set({ isAddingBoardCards }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      screen: "main",
      capturedImages: [],
      isAnalyzing: false,
      isAddingBoardCards: false,
      error: null,
    }),
}));
