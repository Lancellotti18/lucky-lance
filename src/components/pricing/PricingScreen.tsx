"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import PricingCard from "./PricingCard";
import type { PlanId } from "@/stores/auth-store";

const PLANS: {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  annualPrice?: number;
  uploadsPerMonth: number | string;
  features: string[];
  isPopular?: boolean;
}[] = [
  {
    id: "pocket_pair",
    name: "The Pocket Pair",
    tagline:
      "Perfect for casual players looking to review and improve their poker strategy consistently.",
    price: 10,
    annualPrice: 100,
    uploadsPerMonth: 75,
    features: [
      "75 uploads per month",
      "Basic hand analysis tools",
      "Hold'em and PLO modes",
      "Email support",
    ],
  },
  {
    id: "the_flop",
    name: "The Flop",
    tagline:
      "Built for serious players who regularly study their hands and want deeper insight.",
    price: 20,
    uploadsPerMonth: 175,
    isPopular: true,
    features: [
      "175 uploads per month",
      "Advanced analysis tools",
      "Hold'em and PLO modes",
      "Faster processing priority",
    ],
  },
  {
    id: "the_nuts",
    name: "The Nuts",
    tagline:
      "Maximum upload power for grinders, coaches, and high-volume hand reviewers.",
    price: 30,
    uploadsPerMonth: 400,
    features: [
      "400 uploads per month",
      "Full advanced analysis suite",
      "Priority processing",
      "Future premium features included",
    ],
  },
];

interface PricingScreenProps {
  onSelectPlan: (plan: PlanId, billingCycle: "monthly" | "annual") => void;
}

export default function PricingScreen({ onSelectPlan }: PricingScreenProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  return (
    <div className="min-h-screen bg-casino-black px-4 py-10 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="lucky-lance-title text-3xl mb-2">Choose Your Plan</h2>
        <p className="text-casino-muted text-sm max-w-xs mx-auto">
          Unlock professional hand analysis. Cancel anytime.
        </p>

        {/* Billing cycle toggle */}
        <div className="flex bg-casino-dark border border-white/10 rounded-xl p-1 mt-5 inline-flex gap-1">
          {(["monthly", "annual"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setBillingCycle(c)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                billingCycle === c
                  ? "bg-casino-red text-white"
                  : "text-casino-muted hover:text-casino-text"
              )}
            >
              {c === "monthly" ? "Monthly" : "Annual (save more)"}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex flex-col gap-5 w-full max-w-sm">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <PricingCard
              {...plan}
              billingCycle={billingCycle}
              onSelect={() => onSelectPlan(plan.id, billingCycle)}
            />
          </motion.div>
        ))}
      </div>

      <p className="text-casino-muted text-xs text-center max-w-xs mt-8 leading-relaxed">
        Lucky Lance provides poker analysis for educational purposes only.
        Not responsible for financial losses incurred while gambling.
        Must be 18+ to use this service.
      </p>
    </div>
  );
}
