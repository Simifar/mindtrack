"use client";
import { create } from "zustand";

export type ViewId = "tests" | "test-run" | "results" | "methods";

interface AppState {
  view: ViewId;
  activeTestCode: string | null;
  crisisOpen: boolean;

  setView: (v: ViewId) => void;
  openTest: (code: string) => void;
  setCrisisOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "tests",
  activeTestCode: null,
  crisisOpen: false,
  setView: (v) => set({ view: v }),
  openTest: (code) => set({ activeTestCode: code, view: "test-run" }),
  setCrisisOpen: (v) => set({ crisisOpen: v }),
}));
