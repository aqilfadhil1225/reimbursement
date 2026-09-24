"use client";

type AvatarProps = {
  initials: string;
  size?: "sm" | "md";
};

export function Avatar({ initials, size = "sm" }: AvatarProps) {
  return (
    <div
      className={[
        "flex items-center justify-center rounded-full border border-slate-700 bg-[#1e2a38] font-semibold text-slate-100",
        size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
      ].join(" ")}
    >
      {initials}
    </div>
  );
}
