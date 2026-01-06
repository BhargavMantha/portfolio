import { useState, useEffect } from 'react';

interface UseImageSequenceReturn {
  images: HTMLImageElement[];
  loading: boolean;
  progress: number;
  error: string | null;
}

export const useImageSequence = (
  basePath: string,
  totalFrames: number,
  startFrame: number = 1
): UseImageSequenceReturn => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      let loadedCount = 0;

      try {
        const imagePromises = Array.from({ length: totalFrames }, (_, i) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            const frameNumber = String(i + startFrame).padStart(3, '0');
            img.src = `${basePath}/ezgif-frame-${frameNumber}.jpg`;

            img.onload = () => {
              loadedCount++;
              setProgress(Math.round((loadedCount / totalFrames) * 100));
              resolve(img);
            };

            img.onerror = () => {
              reject(new Error(`Failed to load frame ${frameNumber}`));
            };
          });
        });

        const results = await Promise.all(imagePromises);
        setImages(results);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
        setLoading(false);
      }
    };

    loadImages();
  }, [basePath, totalFrames, startFrame]);

  return { images, loading, progress, error };
};
