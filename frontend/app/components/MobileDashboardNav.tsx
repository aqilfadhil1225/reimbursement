import { FileText, KeyRound, LayoutDashboard, LogOut } from 'lucide-react';

type MobileDashboardNavProps = {
  activeNav: string;
  listLabel: string;
  onNavigate: (label: string) => void;
  onOpenPasswordModal: () => void;
  onLogout: () => void;
};

export default function MobileDashboardNav({
  activeNav,
  listLabel,
  onNavigate,
  onOpenPasswordModal,
  onLogout,
}: MobileDashboardNavProps) {
  const items = [
    { label: 'Ringkasan', icon: LayoutDashboard, action: () => onNavigate('Ringkasan') },
    { label: listLabel, icon: FileText, action: () => onNavigate(listLabel) },
  ];

  return (
    <nav
      aria-label="Navigasi dashboard"
      className="flex gap-1.5 overflow-x-auto border-y border-slate-100 bg-white px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
    >
      {items.map(({ label, icon: Icon, action }) => {
        const isActive = activeNav === label;

        return (
          <button
            key={label}
            type="button"
            onClick={action}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722A] sm:px-3 sm:text-xs ${
              isActive
                ? 'border-[#E8722A]/15 bg-[#E8722A]/10 text-[#D65F19] shadow-sm'
                : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenPasswordModal}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2.5 text-[11px] font-semibold text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722A] sm:px-3 sm:text-xs"
      >
        <KeyRound className="size-4 shrink-0" />
        <span>Password</span>
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2.5 text-[11px] font-semibold text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722A] sm:px-3 sm:text-xs"
      >
        <LogOut className="size-4 shrink-0" />
        <span>Keluar</span>
      </button>
    </nav>
  );
}
