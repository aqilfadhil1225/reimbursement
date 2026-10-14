import { roleLabels, type AuthUser } from './dashboard-shared';

type SidebarProfileProps = {
  user: AuthUser;
  onLogout: () => void;
};

export default function SidebarProfile({ user, onLogout }: SidebarProfileProps) {
  return (
    <div className="border-t border-slate-100 p-3">
      <div className="flex min-w-0 items-center gap-3 px-1">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8722A]/15 text-xs font-bold text-[#E8722A]">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`Foto profil ${user.name}`} className="size-full object-cover" />
          ) : user.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-800">{user.name}</span>
          <span className="block text-[11px] text-slate-500">{roleLabels[user.role]}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Keluar
      </button>
    </div>
  );
}