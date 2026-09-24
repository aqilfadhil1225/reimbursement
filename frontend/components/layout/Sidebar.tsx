"use client";

import {
  ChartBar,
  House,
  Receipt,
  SignOut,
  User,
} from "@phosphor-icons/react";
import { Avatar } from "../ui/Avatar";
import { SidebarItem } from "./SidebarItem";

const navItems = [
  { label: "Dashboard", icon: House, active: true },
  { label: "Pengajuan Reimbursement", icon: Receipt },
  { label: "Riwayat Pengajuan", icon: ChartBar },
  { label: "Profil", icon: User },
];

type SidebarProps = {
  userName?: string;
  role?: string;
};

export function Sidebar({ userName = "Andi Saputra", role = "Employee" }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-r border-slate-800 bg-[#040d1a] px-4 py-5 md:w-[248px]">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#20d6a1] text-slate-950 shadow-[0_0_20px_rgba(32,214,161,0.35)]">
          <Receipt size={18} weight="fill" />
        </div>
        <div className="text-xl font-semibold text-white">Reimbursement</div>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ label, icon, active }) => (
          <SidebarItem key={label} icon={icon} label={label} active={active} />
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-700/80 bg-[#0c1725] p-3">
          <div className="flex items-center gap-3">
            <Avatar initials="AS" />
            <div>
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-slate-400">{role}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 transition hover:text-white"
            aria-label="Logout"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
