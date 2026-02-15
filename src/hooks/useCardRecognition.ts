"use client";

import { useState, useCallback } from "react";
import type { Card } from "@/engine/types";
import { recognizeCardsAPI } from "@/lib/api-client";

interface UseCardRecognitionReturn {
  recognize: (handImage: string, boardImage?: string | null) => Promise<void>;
  holeCards: Card[] | null;
  boardCards: Card[] | null;
  confidence: "high" | "medium" | "low" | null;
  isLoading: boolean;
  isAmbiguous: boolean;
  message: string | null;
  error: string | null;
  retry: () => void;
}

export function useCardRecognition(): UseCardRecognitionReturn {
  const [holeCards, setHoleCards] = useState<Card[] | null>(null);
  const [boardCards, setBoardCards] = useState<Card[] | null>(null);
  const [confidence, setConfidence] = useState<
    "high" | "medium" | "low" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAmbiguous, setIsAmbiguous] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(
    async (handImage: string, boardImage?: string | null) => {
      setIsLoading(true);
      setError(null);
      setIsAmbiguous(false);
      setMessage(null);

      try {
        const result = await recognizeCardsAPI({
          handImage,
          boardImage: boardImage || null,
        });

        setHoleCards(result.holeCards);
        setBoardCards(result.boardCards);
        setConfidence(result.confidence);
        setIsAmbiguous(result.ambiguous);
        setMessage(result.message || null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Card recognition failed"
        );
        setHoleCards(null);
        setBoardCards(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const retry = useCallback(() => {
    setHoleCards(null);
    setBoardCards(null);
    setConfidence(null);
    setIsAmbiguous(false);
    setMessage(null);
    setError(null);
  }, []);

  return {
    recognize,
    holeCards,
    boardCards,
    confidence,
    isLoading,
    isAmbiguous,
    message,
    error,
    retry,
  };
}
