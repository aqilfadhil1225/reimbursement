"use client";

import type { ComponentType } from "react";

type FeatureItemProps = {
  icon: ComponentType<{ size?: number; weight?: "fill" | "regular"; className?: string }>;
  label: string;
};

export function FeatureItem({ icon: Icon, label }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#20d6a1]/30 bg-[#0d2d2a] text-[#20d6a1]">
        <Icon size={16} weight="fill" />
      </span>
      <span>{label}</span>
    </div>
  );
}
