import { roleLabels, type AuthUser } from './dashboard-shared';

type SidebarProfileProps = {
  user: AuthUser;
  onLogout: () => void;
};

export default function SidebarProfile({ user, onLogout }: SidebarProfileProps) {
  return (
    <div className="flex items-center gap-2 border-t border-slate-100 p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 p-1">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8722A]/15 text-xs font-bold text-[#E8722A]">
          {user.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-800">{user.name}</span>
          <span className="block text-[11px] text-slate-400">{roleLabels[user.role]}</span>
        </span>
      </div>
      <button type="button" onClick={onLogout} className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
        Keluar
      </button>
    </div>
  );
}