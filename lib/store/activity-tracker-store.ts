import { create } from "zustand";

export type ActivityTrackerState = {
  isReady: boolean;
  isInitializing: boolean;
  hasInitialized: boolean;
  error: string | null;

  setInitializing: () => void;
  setReady: () => void;
  setError: (message: string) => void;
};

export const useActivityTrackerStore = create<ActivityTrackerState>((set) => ({
  isReady: false,
  isInitializing: false,
  hasInitialized: false,
  error: null,

  setInitializing: () =>
    set({
      isInitializing: true,
      error: null,
    }),

  setReady: () =>
    set({
      isReady: true,
      isInitializing: false,
      hasInitialized: true,
      error: null,
    }),

  setError: (message: string) =>
    set({
      isReady: false,
      isInitializing: false,
      hasInitialized: true,
      error: message,
    }),
}));