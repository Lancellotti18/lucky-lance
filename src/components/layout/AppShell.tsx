"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUIStore } from "@/stores/ui-store";
import { useGameStore } from "@/stores/game-store";
import { useCardRecognition } from "@/hooks/useCardRecognition";
import { useAnalysis } from "@/hooks/useAnalysis";
import LaunchScreen from "@/components/launch/LaunchScreen";
import Header from "./Header";
import SideNav from "./SideNav";
import CameraInterface from "@/components/camera/CameraInterface";
import PhotoUpload from "@/components/camera/PhotoUpload";
import ImagePreview from "@/components/camera/ImagePreview";
import PotOddsInput from "@/components/input/PotOddsInput";
import AnalysisLoader from "@/components/loading/AnalysisLoader";
import ResultsScreen from "@/components/results/ResultsScreen";
import Button from "@/components/ui/Button";
import Image from "next/image";
import type { Card, AnalysisResult } from "@/engine/types";
import { preprocessCardImage } from "@/lib/image-preprocessing";

export default function AppShell() {
  const {
    screen,
    setScreen,
    capturedImages,
    clearCapturedImages,
    isAnalyzing,
    setAnalyzing,
    isAddingBoardCards,
    setIsAddingBoardCards,
    error,
    setError,
    reset,
  } = useUIStore();
  const {
    variant,
    holeCards,
    boardCards,
    setHoleCards,
    setBoardCards,
    setAnalysisResult,
    analysisResult,
    gtoMode,
    resetHand,
  } = useGameStore();

  const {
    recognize,
    isLoading: isRecognizing,
    isAmbiguous,
    message: recognitionMessage,
  } = useCardRecognition();
  const { analyze } = useAnalysis();
  const [aiExplanationLoading, setAiExplanationLoading] = useState(false);

  const fetchAiExplanation = useCallback(
    async (result: AnalysisResult) => {
      setAiExplanationLoading(true);
      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holeCards: result.holeCards,
            boardCards: result.boardCards,
            variant,
            street: result.street,
            equity: result.equity,
            outs: result.outs.map((o) => ({ type: o.type, count: o.count })),
            potOdds: result.potOdds,
            recommendedAction: result.recommendedAction,
            handName: result.handName,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.explanation) {
            setAnalysisResult({
              ...result,
              explanation: data.explanation,
            });
          }
        }
      } catch {
        // Keep template explanation if AI fails
      } finally {
        setAiExplanationLoading(false);
      }
    },
    [variant, setAnalysisResult]
  );

  const handleLaunchComplete = useCallback(() => {
    setScreen("main");
  }, [setScreen]);

  const handleRecognizeAndAnalyze = useCallback(async () => {
    if (capturedImages.length === 0) return;

    const addingBoard = useUIStore.getState().isAddingBoardCards;

    setError(null);
    setScreen("loading");
    setAnalyzing(true);

    try {
      const holeCount = variant === "omaha" || variant === "omahaHiLo" ? 4 : 2;

      if (addingBoard) {
        // Board-only mode: recognize just the board image
        const boardImageRaw = capturedImages[0];
        const { enhancedDataUrl: boardImage } = await preprocessCardImage(boardImageRaw);

        const response = await fetch("/api/recognize-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardImage, holeCount }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Card recognition failed");
        }

        const recognition = await response.json();

        if (recognition.ambiguous) {
          setError(
            recognition.message ||
              "Could not identify board cards clearly. Please retake the photo."
          );
          setScreen("preview");
          setAnalyzing(false);
          return;
        }

        // Filter out cards we already know to find the new ones
        const existingHole = useGameStore.getState().holeCards;
        const existingBoard = useGameStore.getState().boardCards;
        const knownCards = new Set([...existingHole, ...existingBoard]);
        const newCards = (recognition.boardCards as Card[]).filter(
          (c) => !knownCards.has(c)
        );

        if (newCards.length === 0) {
          setError("No new cards detected. Make sure the new card is visible in the photo.");
          setScreen("preview");
          setAnalyzing(false);
          return;
        }

        const updatedBoard = [...existingBoard, ...newCards];
        setBoardCards(updatedBoard);
        setIsAddingBoardCards(false);

        // Go to pot odds input for the new street
        setAnalyzing(false);
        setScreen("potInput");
      } else {
        // Normal mode: Image 1 = hole cards, Image 2 = board (optional)
        const handImageRaw = capturedImages[0];
        const boardImageRaw = capturedImages.length >= 2 ? capturedImages[1] : null;

        const { enhancedDataUrl: handImage } = await preprocessCardImage(handImageRaw);
        const boardImage = boardImageRaw
          ? (await preprocessCardImage(boardImageRaw)).enhancedDataUrl
          : null;

        const response = await fetch("/api/recognize-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handImage, boardImage, holeCount }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Card recognition failed");
        }

        const recognition = await response.json();

        if (recognition.ambiguous) {
          setError(
            recognition.message ||
              "Could not identify cards clearly. Please retake the photo."
          );
          setScreen("preview");
          setAnalyzing(false);
          return;
        }

        const detectedHole: Card[] = recognition.holeCards;
        const detectedBoard: Card[] = recognition.boardCards;

        setHoleCards(detectedHole);
        setBoardCards(detectedBoard);

        // Go to pot odds input if board is detected
        if (detectedBoard.length > 0) {
          setAnalyzing(false);
          setScreen("potInput");
        } else {
          // No board - analyze directly (preflop)
          await runAnalysis(detectedHole, detectedBoard);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setScreen("preview");
      setAnalyzing(false);
    }
  }, [capturedImages, variant, setScreen, setAnalyzing, setError, setHoleCards, setBoardCards, setIsAddingBoardCards]);

  const runAnalysis = useCallback(
    async (hole: Card[], board: Card[]) => {
      setScreen("loading");
      setAnalyzing(true);

      try {
        const potSize = useGameStore.getState().potSize;
        const amountToCall = useGameStore.getState().amountToCall;

        const result = await fetch("/api/analyze-hand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holeCards: hole,
            boardCards: board,
            variant,
            potSize: potSize ?? undefined,
            amountToCall: amountToCall ?? undefined,
            gtoMode,
          }),
        });

        if (!result.ok) {
          const err = await result.json();
          throw new Error(err.error || "Analysis failed");
        }

        const analysisData = await result.json();
        setAnalysisResult(analysisData);

        // Fire AI explanation in parallel (non-blocking)
        fetchAiExplanation(analysisData);

        // Brief delay for lightning animation
        setTimeout(() => {
          setAnalyzing(false);
          setScreen("results");
        }, 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setAnalyzing(false);
        setScreen("main");
      }
    },
    [variant, gtoMode, setScreen, setAnalyzing, setError, setAnalysisResult, fetchAiExplanation]
  );

  const handlePotSubmit = useCallback(() => {
    runAnalysis(holeCards, boardCards);
  }, [holeCards, boardCards, runAnalysis]);

  const handlePotSkip = useCallback(() => {
    runAnalysis(holeCards, boardCards);
  }, [holeCards, boardCards, runAnalysis]);

  const handleNextStreet = useCallback(() => {
    clearCapturedImages();
    setIsAddingBoardCards(true);
    setError(null);
    setScreen("preview");
  }, [clearCapturedImages, setIsAddingBoardCards, setError, setScreen]);

  const handleNewHand = useCallback(() => {
    resetHand();
    clearCapturedImages();
    setIsAddingBoardCards(false);
    setError(null);
    setScreen("main");
  }, [resetHand, clearCapturedImages, setIsAddingBoardCards, setError, setScreen]);

  return (
    <div className="min-h-screen bg-casino-black">
      {/* Launch Screen */}
      {screen === "launch" && (
        <LaunchScreen onComplete={handleLaunchComplete} />
      )}

      {/* Main App */}
      {screen !== "launch" && (
        <>
          <Header />
          <SideNav />

          <main className="pt-16 px-4 min-h-screen safe-area-bottom">
            <AnimatePresence mode="wait">
              {/* Main Interface */}
              {screen === "main" && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-8 py-8"
                >
                  {/* Logo and title */}
                  <div className="flex flex-col items-center gap-3">
                    <Image
                      src="/images/crown-logo.svg"
                      alt="Lucky Lance"
                      width={48}
                      height={38}
                    />
                    <h1 className="text-casino-red font-display text-2xl font-bold">
                      Lucky Lance
                    </h1>
                  </div>

                  {/* Camera placeholder */}
                  <div className="w-full max-w-md aspect-[4/3] bg-casino-dark rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <svg
                        className="w-12 h-12 text-casino-muted mx-auto mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-casino-muted text-sm">
                        Take a photo of your cards to begin
                      </p>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="w-full max-w-md bg-casino-red/10 border border-casino-red/30 rounded-lg p-3">
                      <p className="text-casino-red text-sm">{error}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <Button
                      fullWidth
                      size="lg"
                      onClick={() => setScreen("camera")}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Take Live Photo
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      size="lg"
                      onClick={() => setScreen("preview")}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Upload Photos
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Camera Screen */}
              {screen === "camera" && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8"
                >
                  <CameraInterface />
                </motion.div>
              )}

              {/* Preview / Upload Screen */}
              {screen === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8"
                >
                  {capturedImages.length > 0 ? (
                    <ImagePreview
                      onAnalyze={handleRecognizeAndAnalyze}
                      isRecognizing={isRecognizing}
                    />
                  ) : (
                    <PhotoUpload />
                  )}
                </motion.div>
              )}

              {/* Pot Odds Input */}
              {screen === "potInput" && (
                <motion.div
                  key="potInput"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8"
                >
                  <PotOddsInput
                    onSubmit={handlePotSubmit}
                    onSkip={handlePotSkip}
                  />
                </motion.div>
              )}

              {/* Results Screen */}
              {screen === "results" && analysisResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-8"
                >
                  <ResultsScreen
                    result={analysisResult}
                    onNewHand={handleNewHand}
                    onNextStreet={handleNextStreet}
                    aiExplanationLoading={aiExplanationLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isAnalyzing && <AnalysisLoader />}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
