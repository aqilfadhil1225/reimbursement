"use client";

import { Eye, EyeSlash, Lock } from "@phosphor-icons/react";
import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function PasswordInput({ label = "Password", error, className = "", ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block w-full">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>

      <div
        className={[
          "flex items-center gap-3 rounded-xl border border-slate-700/80 bg-[#0d1b2a] px-3 py-3 transition",
          error ? "border-red-500/60" : "focus-within:border-[#20d6a1]/60",
          className,
        ].join(" ")}
      >
        <span className="text-slate-400">
          <Lock size={18} />
        </span>

        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className="w-full border-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="text-slate-400 transition hover:text-slate-200"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </label>
  );
}
