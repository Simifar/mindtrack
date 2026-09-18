"use client";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function MindTrackMark({ className }: { className?: string }) {
  return <img src={`${BASE_PATH}/logo.svg`} alt="" aria-hidden="true" className={className} />;
}
