"use client";

type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  Approved: "bg-[#103429] text-[#62f0c2] border border-[#20d6a1]/30",
  Pending: "bg-[#2b220f] text-[#f7c66b] border border-[#f59e0b]/30",
  Rejected: "bg-[#2b1114] text-[#fca5a5] border border-[#ef4444]/30",
  Revision: "bg-[#2b220f] text-[#f5b26f] border border-[#f59e0b]/30",
  Paid: "bg-[#103429] text-[#62f0c2] border border-[#20d6a1]/30",
  Draft: "bg-[#1f2937] text-[#cbd5e1] border border-slate-600/60",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusStyles[status] ?? "bg-[#1f2937] text-slate-200 border border-slate-600/60";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}
