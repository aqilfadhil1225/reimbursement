"use client";

import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-700/80 bg-[#071426] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.8)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
