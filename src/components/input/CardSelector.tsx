"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/utils/cn";
import type { Card, Rank, Suit } from "@/engine/types";
import { HOLE_CARD_COUNT } from "@/engine/types";
import { RANKS, SUITS, SUIT_SYMBOLS } from "@/engine/constants";
import { useGameStore } from "@/stores/game-store";
import CardIcon from "@/components/cards/CardIcon";
import Button from "@/components/ui/Button";

interface ManualCardInputProps {
  onSubmit: (holeCards: Card[], boardCards: Card[]) => void;
  onCancel: () => void;
  boardOnly?: boolean;
  existingHoleCards?: Card[];
  existingBoardCards?: Card[];
}

export default function ManualCardInput({
  onSubmit,
  onCancel,
  boardOnly = false,
  existingHoleCards = [],
  existingBoardCards = [],
}: ManualCardInputProps) {
  const variant = useGameStore((s) => s.variant);
  const maxHole = HOLE_CARD_COUNT[variant];

  const [holeCards, setHoleCards] = useState<Card[]>(
    boardOnly ? existingHoleCards : []
  );
  const [boardCards, setBoardCards] = useState<Card[]>(
    boardOnly ? existingBoardCards : []
  );
  const [selectingFor, setSelectingFor] = useState<"hole" | "board">(
    boardOnly ? "board" : "hole"
  );
  const [pendingRank, setPendingRank] = useState<Rank | null>(null);

  const allUsedCards = new Set([...holeCards, ...boardCards]);

  // Auto-advance from hole to board when hole cards are full
  useEffect(() => {
    if (!boardOnly && selectingFor === "hole" && holeCards.length >= maxHole) {
      setSelectingFor("board");
    }
  }, [holeCards.length, maxHole, selectingFor, boardOnly]);

  const handleRankTap = useCallback((rank: Rank) => {
    setPendingRank((prev) => (prev === rank ? null : rank));
  }, []);

  const handleSuitTap = useCallback(
    (suit: Suit) => {
      if (!pendingRank) return;
      const card = `${pendingRank}${suit}` as Card;
      if (allUsedCards.has(card)) return;

      if (selectingFor === "hole" && !boardOnly) {
        if (holeCards.length < maxHole) {
          setHoleCards((prev) => [...prev, card]);
        }
      } else {
        if (boardCards.length < 5) {
          setBoardCards((prev) => [...prev, card]);
        }
      }
      setPendingRank(null);
    },
    [pendingRank, selectingFor, boardOnly, holeCards.length, boardCards.length, maxHole, allUsedCards]
  );

  const removeCard = useCallback(
    (card: Card, from: "hole" | "board") => {
      if (from === "hole" && !boardOnly) {
        setHoleCards((prev) => prev.filter((c) => c !== card));
        setSelectingFor("hole");
      } else if (from === "board") {
        setBoardCards((prev) => prev.filter((c) => c !== card));
        setSelectingFor("board");
      }
      setPendingRank(null);
    },
    [boardOnly]
  );

  const clearAll = useCallback(() => {
    if (boardOnly) {
      setBoardCards(existingBoardCards);
    } else {
      setHoleCards([]);
      setBoardCards([]);
      setSelectingFor("hole");
    }
    setPendingRank(null);
  }, [boardOnly, existingBoardCards]);

  const holeComplete = holeCards.length >= maxHole;
  const validBoard =
    boardCards.length === 0 ||
    boardCards.length === 3 ||
    boardCards.length === 4 ||
    boardCards.length === 5;
  const canAnalyze = holeComplete && validBoard;

  // Board-only labels
  const streetLabel =
    boardOnly && existingBoardCards.length === 3
      ? "Turn"
      : boardOnly && existingBoardCards.length === 4
        ? "River"
        : null;

  const analyzeLabel = boardOnly
    ? `Analyze ${streetLabel || "Hand"}`
    : boardCards.length > 0
      ? "Analyze Hand"
      : "Analyze Preflop";

  // Check if rank has any available suits left
  const isRankFullyUsed = (rank: Rank) =>
    SUITS.every((s) => allUsedCards.has(`${rank}${s}` as Card));

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-casino-text text-xl font-semibold mb-1">
          {boardOnly ? `Add the ${streetLabel}` : "Select Your Cards"}
        </h3>
        <p className="text-casino-muted text-sm">
          {boardOnly
            ? `Tap a rank, then a suit to add the ${streetLabel?.toLowerCase()} card`
            : "Tap a rank, then a suit to build your hand"}
        </p>
      </div>

      {/* Selected cards display */}
      <div className="flex gap-6 justify-center">
        {/* Hole cards */}
        <button
          type="button"
          onClick={() => {
            if (!boardOnly) {
              setSelectingFor("hole");
              setPendingRank(null);
            }
          }}
          className={cn(
            "text-center p-2 rounded-lg transition-colors",
            selectingFor === "hole" && !boardOnly
              ? "bg-casino-blue/10 ring-1 ring-casino-blue/40"
              : "bg-transparent",
            boardOnly && "opacity-60 cursor-default"
          )}
        >
          <span className="text-casino-muted text-xs uppercase tracking-wider block mb-1.5">
            Your Hand
          </span>
          <div className="flex gap-1 justify-center min-h-[56px] items-center">
            {Array.from({ length: maxHole }).map((_, i) =>
              holeCards[i] ? (
                <button
                  key={holeCards[i]}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCard(holeCards[i], "hole");
                  }}
                  className="relative group"
                  disabled={boardOnly}
                >
                  <CardIcon card={holeCards[i]} size="sm" />
                  {!boardOnly && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">X</span>
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={`hole-empty-${i}`}
                  className="w-10 h-14 rounded-lg border-2 border-dashed border-white/15 flex items-center justify-center"
                >
                  <span className="text-casino-muted/30 text-[10px]">
                    {i + 1}
                  </span>
                </div>
              )
            )}
          </div>
        </button>

        {/* Board cards */}
        <button
          type="button"
          onClick={() => {
            setSelectingFor("board");
            setPendingRank(null);
          }}
          className={cn(
            "text-center p-2 rounded-lg transition-colors",
            selectingFor === "board"
              ? "bg-casino-gold/10 ring-1 ring-casino-gold/40"
              : "bg-transparent"
          )}
        >
          <span className="text-casino-muted text-xs uppercase tracking-wider block mb-1.5">
            Board
          </span>
          <div className="flex gap-1 justify-center min-h-[56px] items-center">
            {boardCards.length === 0 && !boardOnly ? (
              <span className="text-casino-muted/30 text-xs">Optional</span>
            ) : (
              <>
                {boardCards.map((card) => (
                  <button
                    key={card}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!boardOnly || !existingBoardCards.includes(card)) {
                        removeCard(card, "board");
                      }
                    }}
                    className="relative group"
                    disabled={boardOnly && existingBoardCards.includes(card)}
                  >
                    <CardIcon card={card} size="sm" />
                    {!(boardOnly && existingBoardCards.includes(card)) && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">X</span>
                      </div>
                    )}
                  </button>
                ))}
                {boardCards.length < 5 &&
                  Array.from({ length: Math.min(5 - boardCards.length, 2) }).map(
                    (_, i) => (
                      <div
                        key={`board-empty-${i}`}
                        className="w-10 h-14 rounded-lg border-2 border-dashed border-white/15 flex items-center justify-center"
                      >
                        <span className="text-casino-muted/20 text-lg">+</span>
                      </div>
                    )
                  )}
              </>
            )}
          </div>
        </button>
      </div>

      {/* Rank picker */}
      <div>
        <span className="text-casino-muted text-xs uppercase tracking-wider mb-2 block text-center">
          {pendingRank
            ? `Pick suit for ${pendingRank === "T" ? "10" : pendingRank}`
            : "Pick a rank"}
        </span>
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-13">
          {RANKS.map((rank) => {
            const fullyUsed = isRankFullyUsed(rank);
            const isActive = pendingRank === rank;
            const displayRank = rank === "T" ? "10" : rank;

            return (
              <button
                key={rank}
                type="button"
                onClick={() => handleRankTap(rank)}
                disabled={fullyUsed}
                className={cn(
                  "aspect-square rounded-lg font-bold text-lg transition-all duration-100",
                  "flex items-center justify-center",
                  isActive
                    ? "bg-casino-red text-white ring-2 ring-casino-red shadow-lg shadow-casino-red/30 scale-105"
                    : fullyUsed
                      ? "bg-casino-dark/40 text-casino-muted/20 cursor-not-allowed"
                      : "bg-casino-dark text-casino-text hover:bg-casino-grey border border-white/10 hover:border-white/25 active:scale-95"
                )}
              >
                {displayRank}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suit picker - shows when a rank is selected */}
      <div
        className={cn(
          "transition-all duration-150 overflow-hidden",
          pendingRank ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="grid grid-cols-4 gap-2">
          {SUITS.map((suit) => {
            const card = pendingRank
              ? (`${pendingRank}${suit}` as Card)
              : null;
            const isUsed = card ? allUsedCards.has(card) : false;
            const isRed = suit === "h" || suit === "d";

            return (
              <button
                key={suit}
                type="button"
                onClick={() => handleSuitTap(suit)}
                disabled={isUsed || !pendingRank}
                className={cn(
                  "py-3 rounded-lg font-bold text-2xl transition-all duration-100",
                  "flex items-center justify-center gap-2",
                  isUsed
                    ? "bg-casino-dark/40 text-casino-muted/20 cursor-not-allowed"
                    : isRed
                      ? "bg-casino-dark text-red-500 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/50 active:scale-95"
                      : "bg-casino-dark text-white hover:bg-white/10 border border-white/15 hover:border-white/30 active:scale-95"
                )}
              >
                {SUIT_SYMBOLS[suit]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Board validation warning */}
      {boardCards.length > 0 && boardCards.length < 3 && (
        <p className="text-casino-gold text-xs text-center">
          Board must have 0, 3, 4, or 5 cards
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          fullWidth
          size="lg"
          disabled={!canAnalyze}
          onClick={() => onSubmit(holeCards, boardCards)}
        >
          {analyzeLabel}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={clearAll}>
            Clear All
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
