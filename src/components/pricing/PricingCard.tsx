"use client";

import { cn } from "@/utils/cn";

interface PricingCardProps {
  name: string;
  tagline: string;
  price: number;
  annualPrice?: number;
  uploadsPerMonth: number | string;
  features: string[];
  isPopular?: boolean;
  billingCycle: "monthly" | "annual";
  onSelect: () => void;
}

export default function PricingCard({
  name,
  tagline,
  price,
  annualPrice,
  uploadsPerMonth,
  features,
  isPopular,
  billingCycle,
  onSelect,
}: PricingCardProps) {
  const displayPrice =
    billingCycle === "annual" && annualPrice ? annualPrice : price;
  const priceLabel =
    billingCycle === "annual" && annualPrice
      ? `$${annualPrice}/yr`
      : `$${price}/mo`;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
        "bg-casino-dark",
        isPopular
          ? "border-casino-gold shadow-lg shadow-casino-gold/20"
          : "border-white/10"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-casino-gold text-black text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-casino-text font-bold text-lg">{name}</h3>
        <p className="text-casino-muted text-sm mt-1 leading-relaxed">
          {tagline}
        </p>
      </div>

      <div className="mb-5">
        <span className="text-casino-text text-4xl font-bold">
          {priceLabel.split("/")[0]}
        </span>
        <span className="text-casino-muted text-sm">
          /{priceLabel.split("/")[1]}
        </span>
        {billingCycle === "annual" && annualPrice && (
          <p className="text-casino-green text-xs mt-1">
            Save ${price * 12 - annualPrice}/yr vs monthly
          </p>
        )}
      </div>

      <div className="mb-5">
        <div className="text-casino-red font-bold text-sm mb-2">
          {uploadsPerMonth === "Unlimited"
            ? "♾ Unlimited uploads/mo"
            : `${uploadsPerMonth} uploads/month`}
        </div>
        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-casino-muted">
              <span className="text-casino-green mt-0.5">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSelect}
        className={cn(
          "mt-auto w-full font-bold py-3 rounded-xl transition-all duration-150 active:scale-95",
          isPopular
            ? "bg-casino-gold text-black shadow-lg shadow-casino-gold/30 hover:brightness-110"
            : "bg-casino-red text-white shadow-lg shadow-casino-red/30 hover:bg-casino-red-glow"
        )}
      >
        Select {name}
      </button>
    </div>
  );
}
