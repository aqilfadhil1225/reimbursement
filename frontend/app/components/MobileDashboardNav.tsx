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
    <nav aria-label="Navigasi dashboard" className="grid grid-cols-4 border-t border-slate-100 bg-white px-2 py-2 lg:hidden">
      {items.map(({ label, icon: Icon, action }) => {
        const isActive = activeNav === label;

        return (
          <button
            key={label}
            type="button"
            onClick={action}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold transition ${
              isActive ? 'text-[#E8722A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Icon className="size-4" />
            <span className="max-w-full truncate">{label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenPasswordModal}
        className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
      >
        <KeyRound className="size-4" />
        <span className="max-w-full truncate">Password</span>
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
      >
        <LogOut className="size-4" />
        <span className="max-w-full truncate">Keluar</span>
      </button>
    </nav>
  );
}
