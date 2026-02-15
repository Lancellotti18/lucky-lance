"use client";

import Image from "next/image";
import { useUIStore } from "@/stores/ui-store";
import Button from "@/components/ui/Button";

interface ImagePreviewProps {
  onAnalyze: () => void;
  isRecognizing: boolean;
}

export default function ImagePreview({
  onAnalyze,
  isRecognizing,
}: ImagePreviewProps) {
  const {
    capturedImages,
    clearCapturedImages,
    removeCapturedImage,
    setScreen,
  } = useUIStore();

  const handleRetake = () => {
    clearCapturedImages();
    setScreen("main");
  };

  const hasHand = capturedImages.length >= 1;
  const hasBoard = capturedImages.length >= 2;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <h3 className="text-casino-text text-lg font-semibold">
        Upload Your Cards
      </h3>

      <p className="text-casino-muted text-xs text-center -mt-3">
        Photo 1 = Your hole cards &nbsp;|&nbsp; Photo 2 = The board (optional)
      </p>

      {/* Image slots side by side */}
      <div className="flex gap-4 w-full justify-center">
        {/* Hand image slot */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-casino-blue">
            Your Hand
          </span>
          {hasHand ? (
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-casino-blue/40">
              <Image
                src={capturedImages[0]}
                alt="Your hand"
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeCapturedImage(0)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-casino-red transition-colors"
              >
                X
              </button>
            </div>
          ) : (
            <div
              onClick={() => setScreen("camera")}
              className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 bg-casino-dark flex items-center justify-center cursor-pointer hover:border-casino-blue/40 transition-colors"
            >
              <span className="text-casino-muted text-xs text-center px-2">
                Tap to add hand photo
              </span>
            </div>
          )}
        </div>

        {/* Board image slot */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-casino-gold">
            The Board
          </span>
          {hasBoard ? (
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-casino-gold/40">
              <Image
                src={capturedImages[1]}
                alt="The board"
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeCapturedImage(1)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-casino-red transition-colors"
              >
                X
              </button>
            </div>
          ) : (
            <div
              onClick={hasHand ? () => setScreen("camera") : undefined}
              className={`w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 bg-casino-dark flex items-center justify-center transition-colors ${
                hasHand
                  ? "cursor-pointer hover:border-casino-gold/40"
                  : "opacity-50"
              }`}
            >
              <span className="text-casino-muted text-xs text-center px-2">
                {hasHand
                  ? "Tap to add board photo (optional)"
                  : "Add hand first"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-casino-muted text-sm text-center">
        {!hasHand
          ? "Upload a photo of your hole cards to get started."
          : !hasBoard
            ? "You can analyze preflop, or add a board photo for post-flop analysis."
            : "Ready to analyze your hand."}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full">
        <Button
          fullWidth
          onClick={onAnalyze}
          disabled={!hasHand || isRecognizing}
        >
          {isRecognizing
            ? "Recognizing Cards..."
            : hasBoard
              ? "Analyze Hand"
              : "Analyze Preflop"}
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setScreen("camera")}
          >
            Take Another
          </Button>
          <Button variant="ghost" fullWidth onClick={handleRetake}>
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
