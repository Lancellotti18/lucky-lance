"use client";

import { cn } from "@/utils/cn";
import type { Card } from "@/engine/types";
import { parseCard } from "@/engine/deck";
import { RANK_VALUES, SUIT_SYMBOLS } from "@/engine/constants";

interface CardIconProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DISPLAY_RANKS: Record<string, string> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A",
};

export default function CardIcon({ card, size = "md", className }: CardIconProps) {
  const { rank, suit } = parseCard(card);
  const isRed = suit === "h" || suit === "d";
  const displayRank = DISPLAY_RANKS[rank] || rank;
  const suitSymbol = SUIT_SYMBOLS[suit];

  const sizeClasses = {
    sm: "w-10 h-14 text-xs",
    md: "w-14 h-20 text-sm",
    lg: "w-20 h-28 text-base",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg bg-white border border-gray-200 shadow-md",
        "flex flex-col items-center justify-center",
        "select-none",
        sizeClasses[size],
        className
      )}
    >
      {/* Top-left rank and suit */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span
          className={cn(
            "font-bold",
            isRed ? "text-red-600" : "text-gray-900",
            size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
          )}
        >
          {displayRank}
        </span>
        <span
          className={cn(
            isRed ? "text-red-600" : "text-gray-900",
            size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
          )}
        >
          {suitSymbol}
        </span>
      </div>

      {/* Center suit */}
      <span
        className={cn(
          "font-bold",
          isRed ? "text-red-600" : "text-gray-900",
          size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-4xl"
        )}
      >
        {suitSymbol}
      </span>

      {/* Bottom-right rank and suit (rotated) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
        <span
          className={cn(
            "font-bold",
            isRed ? "text-red-600" : "text-gray-900",
            size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
          )}
        >
          {displayRank}
        </span>
        <span
          className={cn(
            isRed ? "text-red-600" : "text-gray-900",
            size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
          )}
        >
          {suitSymbol}
        </span>
      </div>
    </div>
  );
}
