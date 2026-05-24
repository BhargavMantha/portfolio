import { useState, useEffect } from 'react';

interface UseImageSequenceOptions {
  /** Image file extension, e.g. 'webp' or 'jpg'. Default: 'webp'. */
  extension?: string;
  /** How many images to load in parallel. Browsers throttle to ~6 per origin
   *  on HTTP/1.1 anyway; 8 is a safe ceiling that doesn't starve the rest of the page. */
  concurrency?: number;
  /** Reveal loading=false once this many frames are loaded (so the first paint
   *  happens quickly while remaining frames stream in). Default: load all. */
  primeCount?: number;
}

interface UseImageSequenceReturn {
  images: HTMLImageElement[];
  loading: boolean;
  progress: number;
  error: string | null;
}

export const useImageSequence = (
  basePath: string,
  totalFrames: number,
  startFrame: number = 1,
  options: UseImageSequenceOptions = {}
): UseImageSequenceReturn => {
  const { extension = 'webp', concurrency = 8, primeCount } = options;

  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const arr: HTMLImageElement[] = new Array(totalFrames);
    let loaded = 0;
    const primeTarget = Math.max(1, Math.min(primeCount ?? totalFrames, totalFrames));
    let primeDone = false;

    const loadOne = (idx: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        const frameNumber = String(idx + startFrame).padStart(3, '0');
        img.src = `${basePath}/ezgif-frame-${frameNumber}.${extension}`;
        img.decoding = 'async';
        img.onload = () => {
          if (cancelled) return resolve();
          arr[idx] = img;
          loaded += 1;
          setProgress(Math.round((loaded / totalFrames) * 100));
          if (!primeDone && loaded >= primeTarget) {
            primeDone = true;
            setImages([...arr]);
            setLoading(false);
          }
          resolve();
        };
        img.onerror = () => {
          if (cancelled) return resolve();
          if (!error) setError(`Failed to load frame ${frameNumber}`);
          resolve();
        };
      });

    // Chunked concurrency: process at most `concurrency` requests at a time.
    const run = async () => {
      const queue = Array.from({ length: totalFrames }, (_, i) => i);
      const workers = Array.from({ length: Math.min(concurrency, totalFrames) }, async () => {
        while (!cancelled && queue.length) {
          const next = queue.shift();
          if (next === undefined) return;
          await loadOne(next);
        }
      });
      await Promise.all(workers);
      if (cancelled) return;
      setImages(arr.slice());
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [basePath, totalFrames, startFrame, extension, concurrency, primeCount]);

  return { images, loading, progress, error };
};
