"use client";

import { useRef, useCallback } from "react";

interface UseSwipeReturn {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 50): UseSwipeReturn {
  const startX = useRef(0);
  const currentX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    const diff = startX.current - currentX.current;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
