import type { Card } from "@/engine/types";
import { isValidCard } from "@/engine/validation";
import openai from "./openai";

export interface RecognitionResult {
  holeCards: Card[];
  boardCards: Card[];
  confidence: "high" | "medium" | "low";
  ambiguous: boolean;
  message?: string;
}

const SYSTEM_PROMPT = `You are a precise playing card identification system. You analyze photographs of playing cards and return their exact rank and suit. You MUST correctly identify the suit by looking at the symbol shape:
- Hearts: red, rounded bottom curving inward to a point at the top (♥)
- Diamonds: red, rotated square / rhombus shape (♦)
- Clubs: black, three-leaf clover shape with a stem (♣)
- Spades: black, pointed top with rounded bottom lobes and a stem (♠)

Pay careful attention to the suit symbol shape, not just color. Red cards are hearts OR diamonds. Black cards are clubs OR spades. Distinguish between them by shape.

You never guess - if a card is unclear, you report it as unidentified.`;

function buildPrompt(imageType: "hand" | "board", holeCount: number): string {
  if (imageType === "hand") {
    return `This photo shows the player's HOLE CARDS (the ${holeCount} private cards dealt to the player). Identify exactly the ${holeCount} cards you see.

Return your answer as a JSON object with this exact structure:
{
  "cards": ["Xs", "Xh"],
  "confidence": "high",
  "notes": ""
}

Rules:
- Rank codes: 2, 3, 4, 5, 6, 7, 8, 9, T (for 10), J, Q, K, A
- Suit codes: h (hearts), d (diamonds), c (clubs), s (spades)
- Look at the suit SYMBOL SHAPE carefully to distinguish hearts from diamonds and clubs from spades
- Only include cards you can clearly identify
- If ANY card is partially obscured or unclear, set confidence to "low"
- Return ONLY the JSON object, no other text`;
  }

  return `This photo shows the COMMUNITY BOARD CARDS (the shared cards dealt face-up on the table). Identify all visible board cards (3 for flop, 4 for turn, or 5 for river).

Return your answer as a JSON object with this exact structure:
{
  "cards": ["Xs", "Xh", "Xc"],
  "confidence": "high",
  "notes": ""
}

Rules:
- Rank codes: 2, 3, 4, 5, 6, 7, 8, 9, T (for 10), J, Q, K, A
- Suit codes: h (hearts), d (diamonds), c (clubs), s (spades)
- Look at the suit SYMBOL SHAPE carefully to distinguish hearts from diamonds and clubs from spades
- Only include cards you can clearly identify
- If ANY card is partially obscured or unclear, set confidence to "low"
- Return ONLY the JSON object, no other text`;
}

async function recognizeSingleImage(
  base64Image: string,
  imageType: "hand" | "board",
  holeCount: number
): Promise<{ cards: Card[]; confidence: string; notes?: string }> {
  const base64Data = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;
  const mediaType = base64Image.startsWith("data:image/png")
    ? "image/png"
    : "image/jpeg";

  const response = await openai.chat.completions.create({
    model: "grok-2-vision-latest",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(imageType, holeCount) },
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${base64Data}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content || "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { cards: [], confidence: "low", notes: "Could not parse response" };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const cards: Card[] = [];

  for (const cardStr of parsed.cards || []) {
    if (isValidCard(cardStr)) {
      cards.push(cardStr as Card);
    }
  }

  return {
    cards,
    confidence: parsed.confidence || "low",
    notes: parsed.notes,
  };
}

export async function recognizeCards(
  handImage: string,
  boardImage: string | null,
  holeCount: number = 2
): Promise<RecognitionResult> {
  try {
    // Recognize hole cards from the first image
    const handResult = await recognizeSingleImage(handImage, "hand", holeCount);

    if (handResult.cards.length === 0 || handResult.confidence === "low") {
      return {
        holeCards: [],
        boardCards: [],
        confidence: "low",
        ambiguous: true,
        message:
          handResult.notes ||
          "Could not clearly identify your hole cards. Please retake the photo with both cards fully visible and well-lit.",
      };
    }

    // If no board image, return just the hole cards
    if (!boardImage) {
      return {
        holeCards: handResult.cards,
        boardCards: [],
        confidence: handResult.confidence as "high" | "medium" | "low",
        ambiguous: false,
      };
    }

    // Recognize board cards from the second image
    const boardResult = await recognizeSingleImage(
      boardImage,
      "board",
      holeCount
    );

    if (boardResult.cards.length === 0 || boardResult.confidence === "low") {
      return {
        holeCards: handResult.cards,
        boardCards: [],
        confidence: "low",
        ambiguous: true,
        message:
          boardResult.notes ||
          "Could not clearly identify the board cards. Please retake the photo with all board cards fully visible.",
      };
    }

    // Check for duplicate cards between hand and board
    const allCards = [...handResult.cards, ...boardResult.cards];
    const cardSet = new Set(allCards);
    if (cardSet.size < allCards.length) {
      const duplicates = allCards.filter(
        (card, index) => allCards.indexOf(card) !== index
      );
      return {
        holeCards: handResult.cards,
        boardCards: boardResult.cards,
        confidence: "low",
        ambiguous: true,
        message: `Duplicate card(s) detected: ${duplicates.join(", ")}. Please check your photos - the same card cannot appear in both your hand and the board.`,
      };
    }

    // Determine overall confidence
    const overallConfidence =
      handResult.confidence === "high" && boardResult.confidence === "high"
        ? "high"
        : "medium";

    return {
      holeCards: handResult.cards,
      boardCards: boardResult.cards,
      confidence: overallConfidence as "high" | "medium" | "low",
      ambiguous: false,
    };
  } catch (error) {
    return {
      holeCards: [],
      boardCards: [],
      confidence: "low",
      ambiguous: true,
      message:
        error instanceof Error
          ? error.message
          : "Failed to recognize cards. Please try again.",
    };
  }
}
