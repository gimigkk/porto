"use client";

import { useState, useEffect, useRef } from "react";

export interface PreloadedAssets {
  cloudImageData: Uint8ClampedArray;
  cloudImageWidth: number;
  cloudImageHeight: number;
}

/**
 * Preloads critical assets (fonts + cloud texture) before the intro animation starts.
 * Returns isReady=true only when everything is loaded.
 * Also extracts cloud image pixel data so AsciiClouds can skip its own Image load.
 */
export function usePreloader(): {
  isReady: boolean;
  assets: PreloadedAssets | null;
} {
  const [isReady, setIsReady] = useState(false);
  const assetsRef = useRef<PreloadedAssets | null>(null);
  const [assets, setAssets] = useState<PreloadedAssets | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function preload() {
      // 1. Fonts
      const fontsReady = document.fonts.ready;

      // 2. Cloud texture
      const imageReady = new Promise<PreloadedAssets>((resolve, reject) => {
        const img = new Image();
        img.src = "/assets/clouds.png";
        img.onload = () => {
          // Extract pixel data immediately
          const cvs = document.createElement("canvas");
          cvs.width = img.naturalWidth;
          cvs.height = img.naturalHeight;
          const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
          resolve({
            cloudImageData: data,
            cloudImageWidth: img.naturalWidth,
            cloudImageHeight: img.naturalHeight,
          });
        };
        img.onerror = reject;
      });

      try {
        const [, imageAssets] = await Promise.all([fontsReady, imageReady]);

        if (!cancelled) {
          assetsRef.current = imageAssets;
          setAssets(imageAssets);
          setIsReady(true);
        }
      } catch (err) {
        // If image fails, still proceed — animation will degrade gracefully
        console.warn("Preloader: asset load failed, proceeding anyway", err);
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    preload();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isReady, assets };
}
