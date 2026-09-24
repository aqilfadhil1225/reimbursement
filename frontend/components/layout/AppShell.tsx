"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { PageHeader } from "./PageHeader";

type AppShellProps = {
  title: string;
  subtitle?: string;
  dateLabel?: string;
  userName?: string;
  role?: string;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  dateLabel,
  userName,
  role,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col border border-slate-800/80 bg-[#040d1a] shadow-[0_0_0_1px_rgba(15,23,42,0.8)] md:flex-row">
        <Sidebar userName={userName} role={role} />

        <main className="flex-1 bg-[#020b16] p-4 md:p-6 xl:p-8">
          <PageHeader
            title={title}
            subtitle={subtitle}
            rightSlot={
              dateLabel ? (
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#071426] px-3 py-2 text-sm text-slate-300">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#20d6a1]" />
                  {dateLabel}
                </div>
              ) : null
            }
          />

          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
