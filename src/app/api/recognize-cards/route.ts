import { NextRequest, NextResponse } from "next/server";
import { recognizeCards } from "@/lib/card-recognition";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handImage, boardImage, holeCount = 2 } = body;

    if (!handImage && !boardImage) {
      return NextResponse.json(
        {
          error: "No image provided. Please upload a photo of your cards.",
          code: "MISSING_IMAGE",
        },
        { status: 400 }
      );
    }

    if (handImage && typeof handImage !== "string") {
      return NextResponse.json(
        { error: "Invalid hand image format", code: "INVALID_IMAGE" },
        { status: 400 }
      );
    }

    if (boardImage && typeof boardImage !== "string") {
      return NextResponse.json(
        { error: "Invalid board image format", code: "INVALID_IMAGE" },
        { status: 400 }
      );
    }

    const result = await recognizeCards(
      handImage || null,
      boardImage || null,
      holeCount
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Card recognition error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message, code: "RECOGNITION_FAILED" },
      { status: 500 }
    );
  }
}
