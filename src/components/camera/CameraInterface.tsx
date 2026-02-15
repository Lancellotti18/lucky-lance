"use client";

import { useEffect, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useUIStore } from "@/stores/ui-store";
import Button from "@/components/ui/Button";

export default function CameraInterface() {
  const { videoRef, isActive, isSupported, error, startCamera, stopCamera, capturePhoto } =
    useCamera();
  const { addCapturedImage, setScreen } = useUIStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
    // Run once on mount/unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      addCapturedImage(photo);
      stopCamera();
      setScreen("preview");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-casino-red/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-casino-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="text-casino-text mb-2 font-medium">{error}</p>
        <Button variant="secondary" onClick={() => setScreen("main")} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera viewfinder */}
      <div className="relative w-full max-w-md aspect-[4/3] bg-casino-dark rounded-2xl overflow-hidden border-2 border-dashed border-white/20">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin-slow w-8 h-8 border-2 border-casino-blue border-t-transparent rounded-full" />
          </div>
        )}

        {/* Viewfinder corners */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-casino-red rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-casino-red rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-casino-red rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-casino-red rounded-br-lg" />
      </div>

      {/* Capture button */}
      <button
        onClick={handleCapture}
        disabled={!isActive}
        className="w-16 h-16 rounded-full border-4 border-casino-red bg-transparent
          hover:bg-casino-red/20 active:bg-casino-red/40 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center"
        aria-label="Capture photo"
      >
        <div className="w-12 h-12 rounded-full bg-casino-red" />
      </button>

      <Button variant="ghost" onClick={() => { stopCamera(); setScreen("main"); }}>
        Cancel
      </Button>
    </div>
  );
}
