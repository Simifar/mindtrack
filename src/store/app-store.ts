"use client";
import { create } from "zustand";
import type { AppUser } from "@/lib/api-client";

export type ViewId =
  | "dashboard"
  | "tests"
  | "test-runner"
  | "diary"
  | "charts"
  | "export"
  | "settings";

interface AppState {
  user: AppUser | null | undefined;
  view: ViewId;
  activeTestId: string | null;
  shareToken: string | null;
  crisisOpen: boolean;

  setUser: (u: AppUser | null) => void;
  setView: (v: ViewId) => void;
  openTest: (id: string) => void;
  setShareToken: (t: string | null) => void;
  setCrisisOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: undefined,
  view: "dashboard",
  activeTestId: null,
  shareToken: null,
  crisisOpen: false,
  setUser: (u) => set({ user: u }),
  setView: (v) => set({ view: v }),
  openTest: (id) => set({ activeTestId: id, view: "test-runner" }),
  setShareToken: (t) => set({ shareToken: t }),
  setCrisisOpen: (v) => set({ crisisOpen: v }),
}));
