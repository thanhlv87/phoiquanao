import React, { useState, useEffect, useRef } from 'react';
import { getCachedImage, cacheImage } from '../services/cacheService';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23e2e8f0"/%3E%3C/svg%3E'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Try to load from cache first
    const loadImage = async () => {
      try {
        // Check IndexedDB cache
        const cachedUrl = await getCachedImage(src);
        if (cachedUrl) {
          setImageSrc(cachedUrl);
          setIsLoading(false);
          return;
        }

        // If not cached, load from network
        const response = await fetch(src);
        if (!response.ok) throw new Error('Failed to load image');

        const blob = await response.blob();

        // Cache the image
        await cacheImage(src, blob);

        // Display the image
        const objectURL = URL.createObjectURL(blob);
        setImageSrc(objectURL);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
        setIsLoading(false);
        // Fallback to original src
        setImageSrc(src);
      }
    };

    // Set up intersection observer for lazy loading
    if (imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              // Stop observing once loaded
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before entering viewport
        }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'animate-pulse bg-gray-200' : ''}`}
      loading="lazy"
    />
  );
};
