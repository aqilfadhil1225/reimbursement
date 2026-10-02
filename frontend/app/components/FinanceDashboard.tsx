import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  WalletCards,
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
import SidebarProfile from './SidebarProfile';
import MobileDashboardNav from './MobileDashboardNav';

type FinanceDashboardProps = {
  user: AuthUser;
  claims: ClaimRow[];
  onOpenPasswordModal: () => void;
  handleDecision: (id: number, action: 'approve' | 'reject' | 'revise' | 'verify' | 'start', roleOverride?: 'EMPLOYEE' | 'MANAGER' | 'FINANCE', note?: string) => Promise<void>;
  handlePayment: (id: number, paymentData?: { method?: 'BANK_TRANSFER' | 'CASH' | 'OTHER'; reference?: string; note?: string }, proofFile?: File | null) => Promise<void>;
  handleLogout: () => void;
};

export default function FinanceDashboard({ user, claims, onOpenPasswordModal, handleDecision, handlePayment, handleLogout }: FinanceDashboardProps) {
  const paymentProofInputRef = useRef<HTMLInputElement | null>(null);
  const [activeNav, setActiveNav] = useState('Ringkasan');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [decisionDraft, setDecisionDraft] = useState<{ open: boolean; claimId: number | null; action: 'reject' | 'revise'; reason: string }>({
    open: false,
    claimId: null,
    action: 'reject',
    reason: '',
  });
  const [paymentDraft, setPaymentDraft] = useState<{ open: boolean; claimId: number | null; method: 'BANK_TRANSFER' | 'CASH' | 'OTHER'; reference: string; note: string; proofFile: File | null }>({
    open: false,
    claimId: null,
    method: 'BANK_TRANSFER',
    reference: '',
    note: '',
    proofFile: null,
  });

  const submitDecision = async () => {
    if (decisionDraft.claimId === null) return;
    const reason = decisionDraft.reason.trim();

    if (!reason) {
      window.alert('Alasan wajib diisi sebelum melanjutkan.');
      return;
    }

    await handleDecision(decisionDraft.claimId, decisionDraft.action, 'FINANCE', reason);
    setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' });
  };

  const submitPayment = async () => {
    if (paymentDraft.claimId === null) return;

    const reference = paymentDraft.reference.trim();
    const note = paymentDraft.note.trim();

    if (!reference) {
      window.alert('Nomor bukti transfer atau referensi wajib diisi sebelum bayar.');
      return;
    }

    try {
      await handlePayment(
        paymentDraft.claimId,
        {
          method: paymentDraft.method,
          reference,
          note: note || `Pembayaran ${paymentDraft.method} selesai dengan referensi ${reference}`,
        },
        paymentDraft.proofFile,
      );

      setPaymentDraft({ open: false, claimId: null, method: 'BANK_TRANSFER', reference: '', note: '', proofFile: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pembayaran gagal diproses.';
      window.alert(message);
    }
  };

  const reviewQueue = claims.filter((claim) => ['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT', 'REVISION_REQUIRED'].includes(claim.status));
  const paidQueue = claims.filter((claim) => claim.status === 'PAID');
  const rejectedQueue = claims.filter((claim) => claim.status === 'REJECTED');

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesQuery = `${claim.employeeName} ${claim.employeeEmail} ${claim.category} ${claim.description}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesFilter =
        filter === 'Semua' ||
        (filter === 'Menunggu' && ['MANAGER_APPROVED', 'FINANCE_REVIEW'].includes(claim.status)) ||
        (filter === 'Siap bayar' && claim.status === 'READY_FOR_PAYMENT') ||
        (filter === 'Ditolak' && claim.status === 'REJECTED') ||
        (filter === 'Revision' && claim.status === 'REVISION_REQUIRED');

      return matchesQuery && matchesFilter;
    });
  }, [claims, filter, query]);

  const summary = useMemo(() => {
    const total = claims.reduce((sum, claim) => sum + claim.amount, 0);
    const waiting = claims.filter((claim) => ['MANAGER_APPROVED', 'FINANCE_REVIEW'].includes(claim.status)).length;
    const ready = claims.filter((claim) => claim.status === 'READY_FOR_PAYMENT').length;
    const paid = claims.filter((claim) => claim.status === 'PAID').length;
    const rejected = claims.filter((claim) => claim.status === 'REJECTED').length;
    const revision = claims.filter((claim) => claim.status === 'REVISION_REQUIRED').length;

    return { total, waiting, ready, paid, rejected, revision };
  }, [claims]);

  return (
    <>
      <main className="min-h-screen bg-[#f4f4f4] text-slate-900">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-[252px] flex-col border-r border-slate-200 bg-white text-slate-900 lg:flex">
          {/* Logo */}
          <div className="flex h-[72px] items-center gap-2.5 px-5">
            <img src="/logo-microdata.png" alt="Microdata Indonesia" className="h-9 w-auto object-contain" />
          </div>

          <div className="flex flex-1 flex-col px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveNav('Ringkasan')}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeNav === 'Ringkasan'
                    ? 'bg-[#E8722A]/10 text-[#E8722A]'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <LayoutDashboard className="size-[18px]" />
                <span>Ringkasan</span>
              </button>
              <button
                onClick={() => setActiveNav('Daftar Review')}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeNav === 'Daftar Review'
                    ? 'bg-[#E8722A]/10 text-[#E8722A]'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <FileText className="size-[18px]" />
                <span>Daftar Review</span>
              </button>
              <button
                type="button"
                onClick={onOpenPasswordModal}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <KeyRound className="size-[18px]" />
                <span>Ubah password</span>
              </button>
            </nav>
          </div>

          {/* User info */}
          <SidebarProfile user={user} onLogout={handleLogout} />
        </aside>

        <section className="lg:ml-[252px]">
          {/* Top header */}
          <header className="flex min-h-[72px] items-center justify-between gap-3 bg-white px-4 py-3 sm:px-8 sm:py-4">
            <div>
              <p className="text-xs text-slate-400">Selamat datang, {user.name.split(' ')[0]}</p>
              <h1 className="text-lg font-bold tracking-tight">{activeNav}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveNav('Daftar Review')}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-[#E8722A] px-2.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d4641e] active:scale-[0.97] sm:px-3.5"
              >
                <CheckCircle2 className="size-4" />
                <span className="hidden min-[360px]:inline">Review now</span>
              </button>
            </div>
          </header>
          <MobileDashboardNav
            activeNav={activeNav}
            listLabel="Daftar Review"
            onNavigate={setActiveNav}
            onOpenPasswordModal={onOpenPasswordModal}
            onLogout={handleLogout}
          />

          <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 sm:py-7 lg:px-10">
            {activeNav === 'Ringkasan' ? (
              <>
                <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm text-slate-500">{roleConfig[user.role].greeting}</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">Dashboard Finance</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                  {([
                    ['Total klaim', money(summary.total), 'Semua pengajuan', WalletCards, 'bg-[#E8722A]/10 text-[#E8722A]'],
                    ['Menunggu verifikasi', `${summary.waiting} item`, 'Butuh review finance', Clock3, 'bg-amber-100 text-amber-600'],
                    ['Siap bayar', `${summary.ready} item`, 'Siap diproses pembayaran', CreditCard, 'bg-sky-100 text-sky-600'],
                    ['Paid', `${summary.paid} item`, 'Sudah dibayarkan', ShieldCheck, 'bg-emerald-100 text-emerald-600'],
                  ] as Array<[string, string, string, LucideIcon, string]>).map(([label, value, note, Icon, iconClass], index) => (
                    <div key={`${label}-${index}`} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-medium text-slate-500">{label}</p>
                        <span className={`flex size-8 items-center justify-center rounded-lg ${iconClass}`}><Icon className="size-4" /></span>
                      </div>
                      <p className="mt-3 break-words text-base font-bold tracking-tight sm:mt-4 sm:text-xl">{value}</p>
                      <p className="mt-2 text-[10px] leading-4 text-slate-500 sm:text-[11px]">{note}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="font-bold">Daftar Review</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Finance memeriksa, memvalidasi, dan memproses pembayaran pengajuan yang sudah disetujui manager.
                    </p>
                  </div>

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

                {/* Filter tabs */}
                <div className="flex gap-5 overflow-x-auto border-b border-slate-100 px-5 sm:px-6">
                  {['Semua', 'Menunggu', 'Siap bayar', 'Ditolak', 'Revision'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`whitespace-nowrap border-b-2 py-3 text-xs font-semibold transition ${
                        filter === tab ? 'border-[#E8722A] text-[#E8722A]' : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <th className="rounded-l-xl px-5 py-3 text-left sm:px-6">Pengaju</th>
                        <th className="px-4 py-3 text-left">Deskripsi</th>
                        <th className="px-4 py-3 text-left">Kategori</th>
                        <th className="px-4 py-3 text-left">Tanggal</th>
                        <th className="px-4 py-3 text-left">Jumlah</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="rounded-r-xl px-4 py-3 text-left">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClaims.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
                            Tidak ada pengajuan sesuai filter yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        filteredClaims.map((claim) => (
                          <tr key={claim.id} className="bg-white text-sm align-top transition hover:bg-slate-50">
                            <td className="border-b border-slate-100 px-5 py-4 sm:px-6">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">{claim.employeeName}</span>
                                <span className="text-xs text-slate-500">{claim.employeeEmail}</span>
                              </div>
                            </td>
                            <td className="border-b border-slate-100 px-4 py-4">
                              <p className="max-w-[260px] text-sm leading-6 text-slate-700">
                                {claim.description || 'Tidak ada deskripsi'}
                              </p>
                            </td>
                            <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{claim.category}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{new Date(claim.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                            <td className="border-b border-slate-100 px-3 py-4 font-semibold text-slate-800">{money(claim.amount)}</td>
                            <td className="border-b border-slate-100 px-3 py-4">
                              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none ${STATUS_CLASS[claim.status] ?? 'border border-slate-200 bg-slate-100 text-slate-700'}`}>
                                {STATUS_LABEL[claim.status] ?? claim.status}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-4">
                              <div className="flex flex-wrap gap-2">
                                {claim.status === 'MANAGER_APPROVED' && (
                                  <button onClick={() => handleDecision(claim.id, 'start', 'FINANCE')} className="rounded-lg bg-[#E8722A] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d4641e]">Mulai verifikasi</button>
                                )}
                                {claim.status === 'FINANCE_REVIEW' && (
                                  <>
                                    <button onClick={() => handleDecision(claim.id, 'verify', 'FINANCE')} className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600">Setujui</button>
                                    <button onClick={() => setDecisionDraft({ open: true, claimId: claim.id, action: 'reject', reason: 'Bukti pembayaran atau dokumen pendukung tidak valid.' })} className="rounded-lg bg-red-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-600">Tolak</button>
                                    <button onClick={() => setDecisionDraft({ open: true, claimId: claim.id, action: 'revise', reason: 'Ada dokumen yang masih kurang atau belum sesuai prosedur.' })} className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-600">Revisi</button>
                                  </>
                                )}
                                {claim.status === 'READY_FOR_PAYMENT' && (
                                  <button onClick={() => setPaymentDraft({ open: true, claimId: claim.id, method: 'BANK_TRANSFER', reference: '', note: '', proofFile: null })} className="rounded-lg bg-sky-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-600">Bayar</button>
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
                    <h4 className="font-bold">Progress setelah keputusan</h4>
                    <span className="rounded-full bg-[#E8722A]/10 px-2.5 py-1 text-[10px] font-semibold text-[#E8722A]">
                      {reviewQueue.length} item
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { label: 'Daftar Review', count: reviewQueue.length, icon: FileText, accent: 'text-[#E8722A] bg-[#E8722A]/10' },
                      { label: 'Siap bayar', count: summary.ready, icon: CreditCard, accent: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Ditolak', count: rejectedQueue.length, icon: ShieldAlert, accent: 'text-red-600 bg-red-50' },
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

      {/* Payment modal */}
      {paymentDraft.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setPaymentDraft({ open: false, claimId: null, method: 'BANK_TRANSFER', reference: '', note: '', proofFile: null })}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8722A]">Pembayaran</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Bukti transfer selesai</h3>
              </div>
              <button type="button" onClick={() => setPaymentDraft({ open: false, claimId: null, method: 'BANK_TRANSFER', reference: '', note: '', proofFile: null })} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Metode pembayaran
                <select
                  value={paymentDraft.method}
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, method: event.target.value as 'BANK_TRANSFER' | 'CASH' | 'OTHER' }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Tunai</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Nomor bukti / referensi transfer
                <input
                  value={paymentDraft.reference}
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, reference: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
                  placeholder="Contoh: BTR-20260926-001"
                  required
                />
              </label>

              <div className="block text-sm font-medium text-slate-700">
                <span className="block">Bukti transfer</span>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => paymentProofInputRef.current?.click()}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed px-3 py-3 text-left transition ${
                      paymentDraft.proofFile
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-[#E8722A]/30 bg-[#E8722A]/5 hover:border-[#E8722A]/50 hover:bg-[#E8722A]/10'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#E8722A] shadow-sm">
                        <UploadCloud className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">
                          {paymentDraft.proofFile ? paymentDraft.proofFile.name : 'Pilih file bukti transfer'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {paymentDraft.proofFile ? 'Klik untuk mengganti file' : 'JPG, PNG, atau PDF • Maksimal 5MB'}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8722A] shadow-sm">
                      {paymentDraft.proofFile ? 'Ganti' : 'Pilih'}
                    </span>
                  </button>
                  <input
                    ref={paymentProofInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(event) => setPaymentDraft((current) => ({ ...current, proofFile: event.target.files?.[0] ?? null }))}
                    className="hidden"
                  />
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Catatan pembayaran
                <textarea
                  value={paymentDraft.note}
                  onChange={(event) => setPaymentDraft((current) => ({ ...current, note: event.target.value }))}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
                  placeholder="Contoh: Transfer berhasil ke rekening bank karyawan sesuai nominal reimbursement."
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPaymentDraft({ open: false, claimId: null, method: 'BANK_TRANSFER', reference: '', note: '', proofFile: null })} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button type="button" onClick={submitPayment} className="rounded-lg bg-[#E8722A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#d4641e]">Konfirmasi bayar</button>
            </div>
          </div>
        </div>
      )}

      {/* Decision modal */}
      {decisionDraft.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' })}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8722A]">
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
                placeholder={decisionDraft.action === 'reject' ? 'Contoh: Bukti pembayaran tidak valid atau dokumen belum sesuai prosedur.' : 'Contoh: Dokumen pendukung belum lengkap dan perlu dilengkapi terlebih dahulu.'}
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDecisionDraft({ open: false, claimId: null, action: 'reject', reason: '' })} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button type="button" onClick={submitDecision} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${decisionDraft.action === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {decisionDraft.action === 'reject' ? 'Kirim reject' : 'Kirim revisi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
