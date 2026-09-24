"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: ReactNode;
  error?: string;
};

export function Input({ label, icon, error, className = "", ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      ) : null}

      <div
        className={[
          "flex items-center gap-3 rounded-xl border border-slate-700/80 bg-[#0d1b2a] px-3 py-3 transition",
          error ? "border-red-500/60" : "focus-within:border-[#20d6a1]/60",
          className,
        ].join(" ")}
      >
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <input
          {...props}
          className="w-full border-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </label>
  );
}
