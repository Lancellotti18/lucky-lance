"use client";

import { useRef, useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";
import Button from "@/components/ui/Button";

export default function PhotoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCapturedImage, setScreen } = useUIStore();

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            // Compress the image
            compressImage(result).then((compressed) => {
              addCapturedImage(compressed);
            });
          }
        };
        reader.readAsDataURL(file);
      });

      // Move to preview after a brief delay to let files process
      setTimeout(() => setScreen("preview"), 300);
    },
    [addCapturedImage, setScreen]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      {/* Hidden file input — accept image/*, works on iOS Safari */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          processFiles(e.target.files);
          // Reset so the same file can be selected again
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="w-full aspect-[4/3] border-2 border-dashed border-white/20 rounded-2xl
          bg-casino-dark hover:bg-casino-dark/70 hover:border-casino-red/50
          transition-all cursor-pointer
          flex flex-col items-center justify-center gap-3 p-6"
      >
        <svg
          className="w-12 h-12 text-casino-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-casino-muted text-sm text-center">
          Tap to upload or drag photos here
        </p>
        <p className="text-casino-muted/60 text-xs text-center">
          Upload 1 photo of your hand + 1 photo of the board
        </p>
      </div>

      <Button variant="ghost" onClick={() => setScreen("main")}>
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
