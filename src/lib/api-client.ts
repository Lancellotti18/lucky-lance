import type { Card, PokerVariant, AnalysisResult } from "@/engine/types";

export interface RecognizeCardsResponse {
  holeCards: Card[];
  boardCards: Card[];
  confidence: "high" | "medium" | "low";
  ambiguous: boolean;
  message?: string;
  error?: string;
}

export interface RecognizeCardsRequest {
  handImage: string;
  boardImage?: string | null;
  holeCount?: number;
}

export interface AnalyzeHandRequest {
  holeCards: Card[];
  boardCards: Card[];
  variant: PokerVariant;
  potSize?: number;
  amountToCall?: number;
  gtoMode?: boolean;
}

export async function recognizeCardsAPI(
  params: RecognizeCardsRequest
): Promise<RecognizeCardsResponse> {
  const response = await fetch("/api/recognize-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function analyzeHandAPI(
  params: AnalyzeHandRequest
): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze-hand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface ExplainHandRequest {
  holeCards: Card[];
  boardCards: Card[];
  variant: PokerVariant;
  street: string;
  equity: number;
  outs: { type: string; count: number }[];
  potOdds: number | null;
  recommendedAction: string;
  handName: string;
}

export async function explainHandAPI(
  params: ExplainHandRequest
): Promise<{ explanation: string }> {
  const response = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    return { explanation: "" };
  }

  return response.json();
}
