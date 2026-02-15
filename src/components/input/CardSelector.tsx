"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import type { Card, Rank, Suit } from "@/engine/types";
import { RANKS, SUITS, SUIT_SYMBOLS, RANK_VALUES } from "@/engine/constants";
import Button from "@/components/ui/Button";

interface CardSelectorProps {
  label: string;
  maxCards: number;
  selectedCards: Card[];
  disabledCards: Card[];
  onCardsChange: (cards: Card[]) => void;
}

function CardSelectorGrid({
  label,
  maxCards,
  selectedCards,
  disabledCards,
  onCardsChange,
}: CardSelectorProps) {
  const toggleCard = (card: Card) => {
    if (selectedCards.includes(card)) {
      onCardsChange(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < maxCards) {
      onCardsChange([...selectedCards, card]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-casino-muted text-xs uppercase tracking-wider">
          {label}
        </h4>
        <span className="text-casino-muted text-xs">
          {selectedCards.length}/{maxCards}
        </span>
      </div>
      <div className="grid grid-cols-13 gap-0.5">
        {SUITS.map((suit) =>
          RANKS.map((rank) => {
            const card = `${rank}${suit}` as Card;
            const isSelected = selectedCards.includes(card);
            const isDisabled = disabledCards.includes(card);
            const isRed = suit === "h" || suit === "d";
            const displayRank = rank === "T" ? "10" : rank;

            return (
              <button
                key={card}
                onClick={() => toggleCard(card)}
                disabled={isDisabled && !isSelected}
                className={cn(
                  "w-full aspect-[3/4] rounded text-[10px] sm:text-xs font-bold",
                  "flex flex-col items-center justify-center leading-none",
                  "transition-all duration-100",
                  isSelected
                    ? "bg-casino-red text-white ring-2 ring-casino-red-glow scale-105"
                    : isDisabled
                      ? "bg-casino-dark/40 text-casino-muted/30 cursor-not-allowed"
                      : "bg-casino-dark hover:bg-casino-grey text-casino-text cursor-pointer border border-white/5 hover:border-white/20"
                )}
              >
                <span>{displayRank}</span>
                <span className={cn(isRed && !isSelected ? "text-red-500" : "")}>
                  {SUIT_SYMBOLS[suit]}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ManualCardInputProps {
  onSubmit: (holeCards: Card[], boardCards: Card[]) => void;
}

export default function ManualCardInput({ onSubmit }: ManualCardInputProps) {
  const [holeCards, setHoleCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);

  const allSelected = [...holeCards, ...boardCards];
  const canAnalyze = holeCards.length === 2;

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto">
      <div className="text-center">
        <h3 className="text-casino-text text-xl font-semibold mb-1">
          Select Your Cards
        </h3>
        <p className="text-casino-muted text-sm">
          Tap cards to select your hand and the board
        </p>
      </div>

      {/* Selected cards preview */}
      <div className="flex gap-6 justify-center">
        <div className="text-center">
          <span className="text-casino-muted text-xs uppercase tracking-wider">
            Hand
          </span>
          <div className="flex gap-1 mt-1 min-h-[40px] justify-center">
            {holeCards.length === 0 ? (
              <span className="text-casino-muted/40 text-xs mt-2">Select 2</span>
            ) : (
              holeCards.map((c) => (
                <MiniCard key={c} card={c} />
              ))
            )}
          </div>
        </div>
        <div className="text-center">
          <span className="text-casino-muted text-xs uppercase tracking-wider">
            Board
          </span>
          <div className="flex gap-1 mt-1 min-h-[40px] justify-center">
            {boardCards.length === 0 ? (
              <span className="text-casino-muted/40 text-xs mt-2">0-5 cards</span>
            ) : (
              boardCards.map((c) => (
                <MiniCard key={c} card={c} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hole cards selector */}
      <CardSelectorGrid
        label="Your Hole Cards (select 2)"
        maxCards={2}
        selectedCards={holeCards}
        disabledCards={boardCards}
        onCardsChange={setHoleCards}
      />

      {/* Board cards selector */}
      <CardSelectorGrid
        label="Board Cards (select 0, 3, 4, or 5)"
        maxCards={5}
        selectedCards={boardCards}
        disabledCards={holeCards}
        onCardsChange={setBoardCards}
      />

      {/* Validation message */}
      {boardCards.length > 0 &&
        boardCards.length < 3 && (
          <p className="text-casino-gold text-xs text-center">
            Board must have 0, 3, 4, or 5 cards
          </p>
        )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          fullWidth
          size="lg"
          disabled={
            !canAnalyze ||
            (boardCards.length > 0 && boardCards.length < 3)
          }
          onClick={() => onSubmit(holeCards, boardCards)}
        >
          Analyze Hand
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setHoleCards([]);
              setBoardCards([]);
            }}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ card }: { card: Card }) {
  const rank = card[0] as Rank;
  const suit = card[1] as Suit;
  const isRed = suit === "h" || suit === "d";
  const displayRank = rank === "T" ? "10" : rank;

  return (
    <div
      className={cn(
        "w-8 h-11 rounded bg-white flex flex-col items-center justify-center",
        "text-[10px] font-bold leading-none shadow-sm"
      )}
    >
      <span className={isRed ? "text-red-600" : "text-gray-900"}>
        {displayRank}
      </span>
      <span className={isRed ? "text-red-600" : "text-gray-900"}>
        {SUIT_SYMBOLS[suit]}
      </span>
    </div>
  );
}
