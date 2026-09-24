"use client";

import type { ComponentType, ReactNode } from "react";

type IconComponent = ComponentType<{
  className?: string;
  size?: number;
  weight?: "fill" | "regular";
}>;

type SidebarItemProps = {
  icon: IconComponent;
  label: string;
  active?: boolean;
  badge?: string;
  rightSlot?: ReactNode;
};

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge,
  rightSlot,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      className={[
        "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
        active
          ? "border-[#20d6a1]/60 bg-[#102b2b] text-[#20d6a1] shadow-[inset_2px_0_0_#20d6a1]"
          : "border-transparent bg-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/60",
          active ? "border-[#20d6a1]/40 bg-[#14312d] text-[#20d6a1]" : "text-slate-300",
        ].join(" ")}
      >
        <Icon size={16} weight={active ? "fill" : "regular"} />
      </span>

      <span className="flex-1 text-sm font-medium">{label}</span>

      {badge ? (
        <span className="rounded-full bg-[#20d6a1] px-2 py-0.5 text-[10px] font-semibold text-slate-950">
          {badge}
        </span>
      ) : null}

      {rightSlot}
    </button>
  );
}
