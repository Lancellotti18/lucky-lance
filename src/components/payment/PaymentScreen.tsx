"use client";

import { useState } from "react";
import { motion } from "motion/react";
import CardInput from "./CardInput";
import PaymentSuccess from "./PaymentSuccess";
import type { PlanId } from "@/stores/auth-store";

const PLAN_NAMES: Record<PlanId, string> = {
  pocket_pair: "The Pocket Pair",
  the_flop: "The Flop",
  the_nuts: "The Nuts",
};

const PLAN_PRICES: Record<PlanId, { monthly: number; annual?: number }> = {
  pocket_pair: { monthly: 10, annual: 100 },
  the_flop: { monthly: 20 },
  the_nuts: { monthly: 30 },
};

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

interface PaymentScreenProps {
  plan: PlanId;
  billingCycle: "monthly" | "annual";
  onSuccess: (plan: string) => void;
  onBack: () => void;
}

export default function PaymentScreen({
  plan,
  billingCycle,
  onSuccess,
  onBack,
}: PaymentScreenProps) {
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const priceDisplay =
    billingCycle === "annual" && PLAN_PRICES[plan].annual
      ? `$${PLAN_PRICES[plan].annual}/yr`
      : `$${PLAN_PRICES[plan].monthly}/mo`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!expiry.includes("/") || expiry.length < 5) {
      setError("Please enter a valid expiry date (MM/YY).");
      return;
    }
    if (cvc.length < 3) {
      setError("Please enter a valid CVC.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <PaymentSuccess plan={plan} onEnter={() => onSuccess(plan)} />;
  }

  return (
    <div className="min-h-screen bg-casino-black px-4 py-10 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <button
            onClick={onBack}
            className="text-casino-muted text-sm hover:text-casino-text transition-colors mb-4 flex items-center gap-1 mx-auto"
          >
            ← Back to plans
          </button>
          <h2 className="text-casino-text text-2xl font-bold">
            {PLAN_NAMES[plan]}
          </h2>
          <p className="text-casino-red font-bold text-lg mt-1">
            {priceDisplay}
          </p>
        </div>

        {/* Secure badge */}
        <div className="flex items-center justify-center gap-2 bg-casino-dark border border-white/10 rounded-xl py-2.5 px-4 mb-6">
          <span className="text-casino-green text-sm">🔒</span>
          <span className="text-casino-muted text-xs">
            Secure payment — 256-bit SSL encryption
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardInput
            label="Cardholder Name"
            value={cardholderName}
            onChange={setCardholderName}
            placeholder="Name on card"
          />

          <CardInput
            label="Card Number"
            value={cardNumber}
            onChange={(v) => setCardNumber(formatCardNumber(v))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            maxLength={19}
          />

          <div className="grid grid-cols-2 gap-3">
            <CardInput
              label="Expiry"
              value={expiry}
              onChange={(v) => setExpiry(formatExpiry(v))}
              placeholder="MM/YY"
              inputMode="numeric"
              maxLength={5}
            />
            <CardInput
              label="CVC"
              value={cvc}
              onChange={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))}
              placeholder="•••"
              inputMode="numeric"
              maxLength={4}
            />
          </div>

          <CardInput
            label="Billing Address"
            value={address}
            onChange={setAddress}
            placeholder="123 Main St"
          />

          <div className="grid grid-cols-2 gap-3">
            <CardInput
              label="City"
              value={city}
              onChange={setCity}
              placeholder="City"
            />
            <CardInput
              label="State"
              value={state}
              onChange={setState}
              placeholder="NC"
              maxLength={2}
            />
          </div>

          <CardInput
            label="ZIP Code"
            value={zip}
            onChange={(v) => setZip(v.replace(/\D/g, "").slice(0, 5))}
            placeholder="28401"
            inputMode="numeric"
            maxLength={5}
          />

          {error && (
            <p className="text-casino-red text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-casino-red text-white font-bold py-3.5 rounded-xl shadow-lg shadow-casino-red/30 hover:bg-casino-red-glow active:scale-95 transition-all duration-150 disabled:opacity-60 mt-2 text-lg"
          >
            {loading ? "Processing…" : `Subscribe — ${priceDisplay}`}
          </button>
        </form>

        <p className="text-casino-muted text-xs text-center mt-4 leading-relaxed">
          By subscribing you agree to our terms. Cancel anytime from your account.
          Lucky Lance is not responsible for gambling losses.
        </p>
      </motion.div>
    </div>
  );
}
