import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";

const SYSTEM_PROMPT = `You are a professional poker strategy advisor. Given the game state, provide a concise (2-4 sentences) strategic explanation for the recommended action. Be specific about equity, pot odds, and draw strength. Use poker terminology but keep it accessible. Do not use markdown formatting.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      holeCards,
      boardCards,
      variant,
      street,
      equity,
      outs,
      potOdds,
      recommendedAction,
      handName,
    } = body;

    const outsDescription =
      outs && outs.length > 0
        ? outs.map((o: { type: string; count: number }) => `${o.type}: ${o.count}`).join(", ")
        : "None";

    const userPrompt = `Game: ${variant}
Street: ${street}
Hole cards: ${holeCards?.join(", ") || "unknown"}
Board: ${boardCards?.join(", ") || "none"}
Current hand: ${handName || "unknown"}
Equity: ${equity != null ? (equity * 100).toFixed(1) + "%" : "N/A"}
Pot odds: ${potOdds != null ? (potOdds * 100).toFixed(1) + "%" : "N/A"}
Outs: ${outsDescription}
Recommended action: ${recommendedAction || "unknown"}

Explain why this action is correct and what the player should consider.`;

    const response = await openai.chat.completions.create({
      model: "grok-3-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const explanation = response.choices[0]?.message?.content || "";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate explanation";

    return NextResponse.json(
      { error: message, explanation: "" },
      { status: 500 }
    );
  }
}
