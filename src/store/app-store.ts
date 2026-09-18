"use client";
import { create } from "zustand";

interface AppState {
  crisisOpen: boolean;

  setCrisisOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  crisisOpen: false,
  setCrisisOpen: (v) => set({ crisisOpen: v }),
}));
