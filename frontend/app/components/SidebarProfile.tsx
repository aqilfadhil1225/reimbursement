import { useState } from 'react';
import { ChevronRight, Mail, UserRound, X } from 'lucide-react';
import { roleLabels, type AuthUser } from './dashboard-shared';

type SidebarProfileProps = {
  user: AuthUser;
  onLogout: () => void;
};

export default function SidebarProfile({ user, onLogout }: SidebarProfileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722A]"
          aria-label={`Buka profil ${user.name}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8722A]/15 text-xs font-bold text-[#E8722A]">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-slate-800">{user.name}</span>
            <span className="block text-[11px] text-slate-400">{roleLabels[user.role]}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#E8722A]">
            Profil <ChevronRight className="size-3" />
          </span>
        </button>
        <button type="button" onClick={onLogout} className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          Keluar
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-profile-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8722A]">Akun</p>
                <h2 id="sidebar-profile-title" className="mt-1 text-xl font-bold text-slate-900">Profil saya</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Tutup profil"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#E8722A]/10 text-lg font-bold text-[#E8722A] ring-1 ring-[#E8722A]/15">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-lg font-bold text-slate-900">{user.name}</p>
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    {roleLabels[user.role]}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <UserRound className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Nama lengkap</p>
                    <p className="break-words text-sm font-semibold text-slate-800">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Mail className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Email</p>
                    <p className="break-all text-sm font-semibold text-slate-800">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg bg-[#E8722A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d4641e]">
                  Tutup
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}