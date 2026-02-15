"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult, Card, PokerVariant } from "@/engine/types";
import { analyzeHandAPI } from "@/lib/api-client";

interface AnalysisParams {
  holeCards: Card[];
  boardCards: Card[];
  variant: PokerVariant;
  potSize?: number;
  amountToCall?: number;
  gtoMode?: boolean;
}

interface UseAnalysisReturn {
  analyze: (params: AnalysisParams) => Promise<AnalysisResult | null>;
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (params: AnalysisParams): Promise<AnalysisResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const analysisResult = await analyzeHandAPI(params);
        setResult(analysisResult);
        return analysisResult;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Analysis failed";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    analyze,
    result,
    isLoading,
    error,
  };
}
