import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import { roleLabels, type AuthUser } from './dashboard-shared';

type ProfileSecurityContentProps = {
  user: AuthUser;
};

export default function ProfileSecurityContent({ user }: ProfileSecurityContentProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8722A]">Profil</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Informasi akun</h2>
        </div>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#E8722A]/10 text-lg font-bold text-[#E8722A] ring-1 ring-[#E8722A]/15">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
              <UserRound className="size-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">Nama lengkap</p>
                <p className="break-words text-sm font-semibold text-slate-800">{user.name}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
              <Mail className="size-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">Email</p>
                <p className="break-all text-sm font-semibold text-slate-800">{user.email}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 sm:col-span-2">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">Peran akun</p>
                <p className="text-sm font-semibold text-slate-800">{roleLabels[user.role]}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Keamanan akun</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Jaga kerahasiaan informasi masuk dan keluar dari akun setelah menggunakan perangkat bersama.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
