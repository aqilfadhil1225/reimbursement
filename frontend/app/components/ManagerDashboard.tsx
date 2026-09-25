import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  LayoutDashboard,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  STATUS_CLASS,
  STATUS_LABEL,
  money,
  roleConfig,
  roleLabels,
  type AuthUser,
  type ClaimRow,
} from './dashboard-shared';

type ManagerDashboardProps = {
  user: AuthUser;
  claims: ClaimRow[];
  handleDecision: (id: number, action: 'approve' | 'reject' | 'revise' | 'verify' | 'start', roleOverride?: 'EMPLOYEE' | 'MANAGER' | 'FINANCE', note?: string) => Promise<void>;
  handleLogout: () => void;
};

export default function ManagerDashboard({ user, claims, handleDecision, handleLogout }: ManagerDashboardProps) {
  const [activeNav, setActiveNav] = useState('Ringkasan');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [decisionDraft, setDecisionDraft] = useState<{ open: boolean; claimId: number | null; action: 'reject' | 'revise'; reason: string }>({
    open: false,
    claimId: null,
    action: 'reject',
    reason: '',
  });

  const submitDecision = async () => {
    if (decisionDraft.claimId === null) return;
    const reason = decisionDraft.reason.trim();

    if (!reason) {
      window.alert('Alasan wajib diisi sebelum melanjutkan.');
      return;
    }

    await handleDecision(decisionDraft.claimId, decisionDraft.action, 'MANAGER', reason);
    setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' });
  };

  const reviewQueue = claims.filter((claim) => ['SUBMITTED', 'REVISION_REQUIRED', 'MANAGER_APPROVED'].includes(claim.status));
  const approvedQueue = claims.filter((claim) => ['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT'].includes(claim.status));
  const rejectedQueue = claims.filter((claim) => claim.status === 'REJECTED');

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesQuery = `${claim.employeeName} ${claim.employeeEmail} ${claim.category} ${claim.description}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesFilter =
        filter === 'Semua' ||
        (filter === 'Menunggu' && ['SUBMITTED', 'REVISION_REQUIRED'].includes(claim.status)) ||
        (filter === 'Disetujui' && ['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT', 'PAID'].includes(claim.status)) ||
        (filter === 'Ditolak' && claim.status === 'REJECTED') ||
        (filter === 'Revision' && claim.status === 'REVISION_REQUIRED');

      return matchesQuery && matchesFilter;
    });
  }, [claims, filter, query]);

  const summary = useMemo(() => {
    const total = claims.reduce((sum, claim) => sum + claim.amount, 0);
    const waiting = claims.filter((claim) => ['SUBMITTED', 'REVISION_REQUIRED'].includes(claim.status)).length;
    const approved = claims.filter((claim) => ['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT'].includes(claim.status)).length;
    const rejected = claims.filter((claim) => claim.status === 'REJECTED').length;
    const revision = claims.filter((claim) => claim.status === 'REVISION_REQUIRED').length;

    return { total, waiting, approved, rejected, revision };
  }, [claims]);

  return (
    <>
      <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
        <aside className="fixed inset-y-0 left-0 hidden w-[252px] flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-7">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#4f46e5] text-white">
              <CircleDollarSign className="size-5" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">Reimburse<span className="text-[#4f46e5]">ly</span></span>
          </div>

          <div className="flex flex-1 flex-col px-4 py-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveNav('Ringkasan')}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                  activeNav === 'Ringkasan' ? 'bg-indigo-50 text-[#4f46e5]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="size-[18px]" />
                <span>Ringkasan</span>
              </button>
              <button
                onClick={() => setActiveNav('Review queue')}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                  activeNav === 'Review queue' ? 'bg-indigo-50 text-[#4f46e5]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FileText className="size-[18px]" />
                <span>Review queue</span>
              </button>
            </nav>
          </div>

          <div className="m-4 rounded-2xl bg-indigo-50 p-4">
            <p className="text-xs font-semibold text-[#4f46e5]">Alur manager</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Review, approve, request revision, atau reject setiap pengajuan karyawan.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 p-5">
            <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-[#4f46e5]">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="text-[11px] text-slate-400">{roleLabels[user.role]}</p>
            </div>
            <button type="button" onClick={handleLogout} className="ml-auto rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100">
              Keluar
            </button>
          </div>
        </aside>

        <section className="lg:ml-[252px]">
          <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-slate-400">Selamat pagi, {user.name.split(' ')[0]}</p>
                <h1 className="text-lg font-bold tracking-tight">{activeNav}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveNav('Review queue')}
                className="flex items-center gap-2 rounded-xl bg-[#4f46e5] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-600"
              >
                <CheckCircle2 className="size-4" />
                Review now
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
            {activeNav === 'Ringkasan' ? (
              <>
                <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm text-slate-500">{roleConfig[user.role].greeting}</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">Dashboard Manager</h2>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {([
                    ['Total claim', money(summary.total), 'Semua pengajuan team', CircleDollarSign],
                    ['Menunggu review', `${summary.waiting} item`, 'Butuh keputusan manager', Clock3],
                    ['Approved', `${summary.approved} item`, 'Sudah lanjut ke finance', ShieldCheck],
                    ['Rejected', `${summary.rejected} item`, 'Perlu tindak lanjut', ShieldAlert],
                  ] as Array<[string, string, string, LucideIcon]>).map(([label, value, note, Icon], index) => (
                    <div key={`${label}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-medium text-slate-500">{label}</p>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="size-4" /></span>
                      </div>
                      <p className="mt-4 text-xl font-bold tracking-tight">{value}</p>
                      <p className="mt-2 text-[11px] text-emerald-600">{note}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="font-bold">Review queue</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Manager memeriksa pengajuan, lalu mengambil keputusan sesuai workflow reimburse.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <Search className="size-4 text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari pengajuan..."
                        className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 sm:w-40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-5 overflow-x-auto border-b border-slate-100 px-5 sm:px-6">
                  {['Semua', 'Menunggu', 'Disetujui', 'Ditolak', 'Revision'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`whitespace-nowrap border-b-2 py-3 text-xs font-semibold ${
                        filter === tab ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 sm:px-6">Pengaju</th>
                        <th className="px-3 py-3">Kategori</th>
                        <th className="px-3 py-3">Tanggal</th>
                        <th className="px-3 py-3">Jumlah</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClaims.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
                            Tidak ada pengajuan sesuai filter yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        filteredClaims.map((claim) => (
                          <tr key={claim.id} className="border-t border-slate-100 text-sm">
                            <td className="px-5 py-4 sm:px-6">
                              <div className="flex flex-col">
                                <span className="font-semibold">{claim.employeeName}</span>
                                <span className="text-xs text-slate-500">{claim.employeeEmail}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4">{claim.category}</td>
                            <td className="px-3 py-4">{new Date(claim.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                            <td className="px-3 py-4">{money(claim.amount)}</td>
                            <td className="px-3 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[claim.status] ?? 'bg-slate-100 text-slate-700'}`}>
                                {STATUS_LABEL[claim.status] ?? claim.status}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap gap-2">
                                {claim.status === 'SUBMITTED' && (
                                  <button onClick={() => handleDecision(claim.id, 'approve', 'MANAGER')} className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600">Approve</button>
                                )}
                                {claim.status !== 'REJECTED' && (
                                  <>
                                    <button onClick={() => setDecisionDraft({ open: true, claimId: claim.id, action: 'revise', reason: 'Dokumen pendukung belum lengkap atau data yang diajukan perlu diperbaiki.' })} className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-600">Revision</button>
                                    <button onClick={() => setDecisionDraft({ open: true, claimId: claim.id, action: 'reject', reason: 'Bukti pengeluaran tidak sesuai ketentuan atau data tidak valid.' })} className="rounded-lg bg-red-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-600">Reject</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-bold">Progress after decision</h4>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                      {approvedQueue.length} item
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { label: 'Review queue', count: reviewQueue.length, icon: FileText, accent: 'text-sky-600 bg-sky-50' },
                      { label: 'Approved', count: approvedQueue.length, icon: ShieldCheck, accent: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Rejected', count: rejectedQueue.length, icon: ShieldAlert, accent: 'text-red-600 bg-red-50' },
                    ].map(({ label, count, icon: Icon, accent }) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className={`mb-3 flex size-9 items-center justify-center rounded-full ${accent}`}>
                          <Icon className="size-4" />
                        </div>
                        <p className="text-[11px] text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {decisionDraft.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' })}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                  {decisionDraft.action === 'reject' ? 'Reject reimbursement' : 'Revision required'}
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  {decisionDraft.action === 'reject' ? 'Berikan alasan penolakan' : 'Tulis alasan revisi'}
                </h3>
              </div>
              <button type="button" onClick={() => setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' })} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Catatan untuk employee
              <textarea
                value={decisionDraft.reason}
                onChange={(event) => setDecisionDraft((current) => ({ ...current, reason: event.target.value }))}
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder={decisionDraft.action === 'reject' ? 'Contoh: Bukti pengeluaran tidak sesuai ketentuan dan nominal tidak dapat dipertanggungjawabkan.' : 'Contoh: Data kategori dan nominal perlu diperbaiki sesuai bukti yang dikirim.'}
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button type="button" onClick={submitDecision} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${decisionDraft.action === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {decisionDraft.action === 'reject' ? 'Kirim reject' : 'Kirim revisi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
