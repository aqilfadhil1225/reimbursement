"use client";

import type { ComponentType } from "react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string;
  count: string;
  icon: ComponentType<{ className?: string; size?: number; weight?: "fill" | "regular" }>;
  tone?: "default" | "pending" | "approved" | "rejected";
};

const toneMap = {
  default: {
    ring: "border-slate-700/80 text-slate-200",
    icon: "bg-slate-800 text-slate-100",
  },
  pending: {
    ring: "border-[#f59e0b]/40 text-[#fbbf24]",
    icon: "bg-[#2f250e] text-[#fbbf24]",
  },
  approved: {
    ring: "border-[#20d6a1]/40 text-[#20d6a1]",
    icon: "bg-[#0d2b27] text-[#20d6a1]",
  },
  rejected: {
    ring: "border-[#ef4444]/40 text-[#f87171]",
    icon: "bg-[#2b1114] text-[#f87171]",
  },
};

export function StatCard({ label, value, count, icon: Icon, tone = "default" }: StatCardProps) {
  const palette = toneMap[tone];

  return (
    <Card className={`p-4 ${palette.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}>
            <Icon size={20} weight="fill" />
          </div>

          <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-400">{count}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
