"use client";

import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <div className="relative rounded-[28px] border border-slate-700/80 bg-[#071426]/90 p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.8)] md:p-8">
      <div className="mb-7 text-left">
        <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>

      {children}

      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}
