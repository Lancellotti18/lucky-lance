"use client";

import { create } from "zustand";

export interface AuthUser {
  userId: string;
  firstName: string;
  email: string;
  subscriptionPlan: string;
  uploadCount: number;
  monthlyUploadLimit: number | null; // null = unlimited (founder)
  founderStatus: boolean;
  paymentStatus: string;
}

export type PlanId = "pocket_pair" | "the_flop" | "the_nuts";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  selectedPlan: PlanId | null;
  selectedBillingCycle: "monthly" | "annual";

  setUser: (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  setSelectedPlan: (plan: PlanId | null) => void;
  setSelectedBillingCycle: (cycle: "monthly" | "annual") => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  selectedPlan: null,
  selectedBillingCycle: "monthly",

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedPlan: (selectedPlan) => set({ selectedPlan }),
  setSelectedBillingCycle: (selectedBillingCycle) =>
    set({ selectedBillingCycle }),
  logout: () => set({ user: null, selectedPlan: null }),
}));
