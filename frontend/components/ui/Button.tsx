"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const variantClassName = {
    primary: "bg-[#20d6a1] text-slate-950 hover:bg-[#52e7ba] shadow-[0_0_16px_rgba(32,214,161,0.28)]",
    secondary: "border border-slate-700 bg-[#0b1725] text-white hover:bg-[#112031]",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white",
  }[variant];

  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantClassName,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
