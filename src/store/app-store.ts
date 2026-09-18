"use client";
import { create } from "zustand";
import { navigate, pathForView } from "@/lib/routes";

export type ViewId = "tests" | "test-detail" | "test-run" | "results" | "methods" | "help" | "privacy";

interface AppState {
  view: ViewId;
  activeTestCode: string | null;
  crisisOpen: boolean;

  setView: (v: ViewId) => void;
  openTest: (code: string) => void;
  startTest: (code: string) => void;
  syncRoute: (view: ViewId, code: string | null) => void;
  setCrisisOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "tests",
  activeTestCode: null,
  crisisOpen: false,
  setView: (view) => {
    const activeTestCode = useAppStore.getState().activeTestCode;
    set({ view });
    navigate(pathForView(view, activeTestCode));
  },
  openTest: (code) => {
    set({ activeTestCode: code, view: "test-detail" });
    navigate(pathForView("test-detail", code));
  },
  startTest: (code) => {
    set({ activeTestCode: code, view: "test-run" });
    navigate(pathForView("test-run", code));
  },
  syncRoute: (view, code) => set({ view, activeTestCode: code }),
  setCrisisOpen: (v) => set({ crisisOpen: v }),
}));
