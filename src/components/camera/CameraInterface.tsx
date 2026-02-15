"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useUIStore } from "@/stores/ui-store";
import Button from "@/components/ui/Button";

export default function CameraInterface() {
  const { videoRef, isActive, isSupported, error, startCamera, stopCamera, capturePhoto } =
    useCamera();
  const { addCapturedImage, setScreen } = useUIStore();
  const mountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    // Only start the browser camera if the API is available (requires HTTPS on mobile)
    if (isSupported) {
      startCamera();
    }

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
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

  // Native file input fallback — opens the device camera on iOS/Android
  const handleNativeCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          // Compress before storing
          compressImage(result).then((compressed) => {
            addCapturedImage(compressed);
            setScreen("preview");
          });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [addCapturedImage, setScreen]
  );

  // If camera API isn't supported (HTTP on mobile), show native capture fallback
  if (!isSupported || error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-5">
        {/* Hidden native camera input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCapture}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-full bg-casino-blue/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-casino-blue"
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
        </div>

        <div>
          <p className="text-casino-text mb-1 font-medium">Take a Photo</p>
          <p className="text-casino-muted text-sm">
            Tap below to open your camera and snap a photo of your cards.
          </p>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => fileInputRef.current?.click()}
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
          Open Camera
        </Button>

        <Button
          variant="secondary"
          fullWidth
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
          Upload from Gallery
        </Button>

        <Button variant="ghost" onClick={() => setScreen("main")}>
          Cancel
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

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 1024;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}
