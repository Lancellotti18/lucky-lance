export interface PreprocessResult {
  enhancedDataUrl: string;
  suitColorHints: ("red" | "black" | "unknown")[];
}

/**
 * Enhance image contrast and attempt basic suit color detection.
 * Returns an enhanced image for better AI recognition accuracy.
 */
export async function preprocessCardImage(
  dataUrl: string
): Promise<PreprocessResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({ enhancedDataUrl: dataUrl, suitColorHints: [] });
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply contrast enhancement
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const contrastFactor = 1.4; // 40% increase

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Apply contrast around midpoint (128)
        data[i] = clamp(((r / 255 - 0.5) * contrastFactor + 0.5) * 255);
        data[i + 1] = clamp(((g / 255 - 0.5) * contrastFactor + 0.5) * 255);
        data[i + 2] = clamp(((b / 255 - 0.5) * contrastFactor + 0.5) * 255);
      }

      ctx.putImageData(imageData, 0, 0);

      // Attempt suit color detection by sampling regions
      const suitColorHints = detectSuitColors(imageData);

      const enhancedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      resolve({ enhancedDataUrl, suitColorHints });
    };

    img.onerror = () => {
      resolve({ enhancedDataUrl: dataUrl, suitColorHints: [] });
    };

    img.src = dataUrl;
  });
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Sample the image in a grid pattern to detect red vs black suit colors.
 * This is a heuristic - results are used as hints to improve AI accuracy.
 */
function detectSuitColors(
  imageData: ImageData
): ("red" | "black" | "unknown")[] {
  const { width, height, data } = imageData;
  const hints: ("red" | "black" | "unknown")[] = [];

  // Divide image into vertical strips (potential card regions)
  const numStrips = Math.min(Math.floor(width / 80), 7);
  if (numStrips === 0) return ["unknown"];

  const stripWidth = Math.floor(width / numStrips);

  for (let strip = 0; strip < numStrips; strip++) {
    const startX = strip * stripWidth;
    const endX = Math.min(startX + stripWidth, width);

    // Sample the upper-left quadrant of each strip (where suit symbols typically are)
    const sampleEndX = startX + Math.floor((endX - startX) * 0.4);
    const sampleEndY = Math.floor(height * 0.35);

    let redCount = 0;
    let blackCount = 0;
    let totalSampled = 0;

    // Sample every 3rd pixel for speed
    for (let y = Math.floor(height * 0.05); y < sampleEndY; y += 3) {
      for (let x = startX + Math.floor((endX - startX) * 0.1); x < sampleEndX; x += 3) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Red suit symbol: high red, low green and blue
        if (r > 160 && g < 100 && b < 100) {
          redCount++;
        }
        // Black suit symbol: all channels low
        if (r < 70 && g < 70 && b < 70) {
          blackCount++;
        }
        totalSampled++;
      }
    }

    if (totalSampled === 0) {
      hints.push("unknown");
      continue;
    }

    const redRatio = redCount / totalSampled;
    const blackRatio = blackCount / totalSampled;

    if (redRatio > 0.03) {
      hints.push("red");
    } else if (blackRatio > 0.05) {
      hints.push("black");
    } else {
      hints.push("unknown");
    }
  }

  return hints;
}
