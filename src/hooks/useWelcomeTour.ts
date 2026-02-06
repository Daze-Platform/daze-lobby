import { useState, useEffect } from "react";

const TOUR_STORAGE_KEY = "daze_welcome_tour_completed";

/**
 * Hook to manage Welcome Tour visibility
 * Tracks whether the user has completed the tour using localStorage
 * Can optionally be connected to a database for persistence across devices
 */
export function useWelcomeTour(userId?: string) {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a unique key per user if userId is provided
  const storageKey = userId ? `${TOUR_STORAGE_KEY}_${userId}` : TOUR_STORAGE_KEY;

  useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem(storageKey);
    
    if (!tourCompleted) {
      // First time user - show the tour after a brief delay for smooth entrance
      const timer = setTimeout(() => {
        setShowTour(true);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [storageKey]);

  const completeTour = () => {
    localStorage.setItem(storageKey, new Date().toISOString());
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(storageKey);
    setShowTour(true);
  };

  return {
    showTour,
    isLoading,
    completeTour,
    resetTour,
  };
}
