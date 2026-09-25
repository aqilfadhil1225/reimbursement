import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import {
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  KeyRound,
  LayoutDashboard,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  STATUS_CLASS,
  STATUS_LABEL,
  money,
  formatDate,
  roleConfig,
  roleLabels,
  type AuthUser,
  type ClaimRow,
} from './dashboard-shared';

type EmployeeDashboardProps = {
  user: AuthUser;
  token: string;
  claims: ClaimRow[];
  query: string;
  filter: string;
  setQuery: (value: string) => void;
  setFilter: (value: string) => void;
  showNew: boolean;
  setShowNew: (value: boolean) => void;
  editingClaimId: number | null;
  form: { name: string; email: string; password: string; description: string; category: string; amount: string };
  setForm: Dispatch<SetStateAction<{ name: string; email: string; password: string; description: string; category: string; amount: string }>>;
  receiptFile: File | null;
  setReceiptFile: Dispatch<SetStateAction<File | null>>;
  error: string;
  setError: (value: string) => void;
  onOpenPasswordModal: () => void;
  handleCreateClaim: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleDeleteClaim: (id: number) => Promise<void>;
  handleUploadReceipt: (id: number, file: File) => Promise<void>;
  handleEditClaim: (claim: ClaimRow) => void;
  handleLogout: () => void;
  loadClaims: (authToken: string) => Promise<void>;
  closeClaimModal: () => void;
};

export default function EmployeeDashboard({
  user,
  token,
  claims,
  query,
  filter,
  setQuery,
  setFilter,
  showNew,
  setShowNew,
  editingClaimId,
  form,
  setForm,
  receiptFile,
  setReceiptFile,
  error,
  setError,
  onOpenPasswordModal,
  handleCreateClaim,
  handleDeleteClaim,
  handleUploadReceipt,
  handleEditClaim,
  handleLogout,
  loadClaims,
  closeClaimModal,
}: EmployeeDashboardProps) {
  const [activeNav, setActiveNav] = useState('Ringkasan');
  const [rejectPreview, setRejectPreview] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<{ open: boolean; claimId: number | null; description: string }>({
    open: false,
    claimId: null,
    description: '',
  });

  const filteredClaims = useMemo(() => {
    const visible = claims.filter((claim) => {
      const matchesQuery = `${claim.employeeName} ${claim.description} ${claim.category}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesRole = claim.employeeEmail === user.email;
      const matchesFilter = filter === 'Semua' ||
        (filter === 'Menunggu' && ['SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT'].includes(claim.status)) ||
        (filter === 'Disetujui' && ['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT', 'PAID'].includes(claim.status)) ||
        (filter === 'Ditolak' && claim.status === 'REJECTED') ||
        (filter === 'Revision' && claim.status === 'REVISION_REQUIRED');

      return matchesRole && matchesQuery && matchesFilter;
    });

    return visible;
  }, [claims, filter, query, user.email]);

  const summary = useMemo(() => {
    const employeeClaims = claims.filter((claim) => claim.employeeEmail === user.email);
    const total = employeeClaims.reduce((sum, claim) => sum + claim.amount, 0);
    const waiting = employeeClaims.filter((claim) => ['SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT'].includes(claim.status)).length;
    const paid = employeeClaims.filter((claim) => claim.status === 'PAID').length;
    const draft = employeeClaims.filter((claim) => ['DRAFT', 'REVISION_REQUIRED'].includes(claim.status)).length;
    return { total, waiting, paid, draft };
  }, [claims, user.email]);

  const getRejectNote = (claim: ClaimRow) => {
    const rejectEntry = claim.history
      ?.slice()
      .reverse()
      .find((entry) => entry.status === 'REJECTED' || entry.note?.toLowerCase().includes('reject'));

    return rejectEntry?.note?.trim() || 'Pengajuan ditolak. Silakan periksa catatan dari manager.';
  };

  return (
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
              onClick={() => setActiveNav('Pengajuan saya')}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                activeNav === 'Pengajuan saya' ? 'bg-indigo-50 text-[#4f46e5]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText className="size-[18px]" />
              <span>Pengajuan saya</span>
            </button>
            <button
              type="button"
              onClick={onOpenPasswordModal}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <KeyRound className="size-[18px]" />
              <span>Ubah password</span>
            </button>
          </nav>
        </div>

        <div className="m-4 rounded-2xl bg-indigo-50 p-4">
          <p className="text-xs font-semibold text-[#4f46e5]">Alur reimburse</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Ajukan, submit, dan pantau proses reimbursementmu.
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
          <button type="button" onClick={handleLogout} className="ml-auto rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100">Keluar</button>
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
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-[#4f46e5] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-600">
              <Plus className="size-4" />
              Pengajuan baru
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
          {activeNav === 'Ringkasan' ? (
            <>
              <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-slate-500">{roleConfig[user.role].greeting}</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">Dashboard Employee</h2>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {([
                  ['Total claim', money(summary.total), `${summary.total > 0 ? 'Pengajuan saya' : 'Belum ada pengajuan'}`, CircleDollarSign],
                  ['Menunggu review', `${summary.waiting} item`, 'Status yang sedang diproses', Clock3],
                  ['Sudah dibayar', `${summary.paid} item`, 'Pembayaran selesai', Check],
                  ['Draft / revisi', `${summary.draft} item`, 'Butuh perhatian kamu', Users],
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
                  <h3 className="font-bold">Pengajuan saya</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Pantau setiap reimbursement yang kamu ajukan dan lanjutkan saat status membutuhkan tindakan.
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
                    type="button"
                    key={tab}
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
                <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <th className="rounded-l-2xl px-5 py-3 text-left sm:px-6">Pengajuan</th>
                      <th className="px-4 py-3 text-left">Deskripsi</th>
                      <th className="px-4 py-3 text-left">Kategori</th>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Jumlah</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="rounded-r-2xl px-4 py-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="bg-white text-sm align-top transition hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-5 py-4 sm:px-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800">#{claim.id}</span>
                            <span className="text-xs text-slate-500">{claim.employeeName}</span>
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4">
                          <p className="max-w-[260px] text-sm leading-6 text-slate-700">
                            {claim.description || 'Tidak ada deskripsi'}
                          </p>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-slate-600">{claim.category}</td>
                        <td className="border-b border-slate-200 px-4 py-4 text-slate-600">{formatDate(claim.createdAt)}</td>
                        <td className="border-b border-slate-200 px-4 py-4 font-semibold text-slate-800">{money(claim.amount)}</td>
                        <td className="border-b border-slate-200 px-4 py-4">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none ${STATUS_CLASS[claim.status] ?? 'border border-slate-200 bg-slate-100 text-slate-700'}`}>
                            {STATUS_LABEL[claim.status] ?? claim.status}
                          </span>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {['DRAFT', 'REVISION_REQUIRED', 'SUBMITTED'].includes(claim.status) && !['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT', 'PAID'].includes(claim.status) && (
                              <>
                                <button type="button" onClick={() => handleEditClaim(claim)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                                  <Pencil className="size-3" />
                                  Edit
                                </button>

                                <button type="button" onClick={() => {
                                  setDeleteTarget({
                                    open: true,
                                    claimId: claim.id,
                                    description: claim.description,
                                  });
                                }} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 shadow-sm transition hover:bg-red-100">
                                  <Trash2 className="size-3" />
                                  Hapus
                                </button>
                              </>
                            )}

                            {claim.status === 'REJECTED' && (
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <button
                                  type="button"
                                  onClick={() => setRejectPreview({
                                    open: true,
                                    message: getRejectNote(claim),
                                  })}
                                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Lihat alasan reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setError('Pengajuan ditolak. Silakan buat pengajuan baru dengan data yang sudah diperbaiki.');
                                    setShowNew(true);
                                  }}
                                  className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                                >
                                  Ajukan ulang
                                </button>
                              </div>
                            )}

                            {claim.status === 'SUBMITTED' && (
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">Menunggu review</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {rejectPreview.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setRejectPreview({ open: false, message: '' })}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">Reject note</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Alasan penolakan manager</h3>
              </div>
              <button type="button" onClick={() => setRejectPreview({ open: false, message: '' })} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Pesan
              <textarea
                value={rejectPreview.message}
                readOnly
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 outline-none"
              />
            </label>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setRejectPreview({ open: false, message: '' })} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget({ open: false, claimId: null, description: '' })}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">Hapus pengajuan</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Konfirmasi penghapusan</h3>
              </div>
              <button type="button" onClick={() => setDeleteTarget({ open: false, claimId: null, description: '' })} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Apakah kamu yakin ingin menghapus pengajuan <span className="font-semibold">{deleteTarget.description || 'ini'}?</span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget({ open: false, claimId: null, description: '' })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteTarget.claimId !== null) {
                    await handleDeleteClaim(deleteTarget.claimId);
                  }
                  setDeleteTarget({ open: false, claimId: null, description: '' });
                }}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 backdrop-blur-[1px] sm:p-6" onClick={() => setShowNew(false)}>
          <form
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 shadow-[0_30px_70px_rgba(15,23,42,0.16)] ring-1 ring-slate-200"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleCreateClaim}
          >
            <div className="flex items-start justify-between border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-sm sm:px-6">
              <div>
                <div className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4f46e5]">
                  {editingClaimId !== null ? 'Edit pengajuan' : 'Pengajuan baru'}
                </div>
                <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {editingClaimId !== null ? 'Perbarui data reimbursement' : 'Buat pengajuan reimbursement'}
                </h2>
              </div>
              <button type="button" onClick={closeClaimModal} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-800">
                Catatan: pengajuan baru masih berstatus Draft. Manager baru akan melihatnya setelah kamu menekan tombol Submit.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                  Deskripsi pengajuan
                  <input
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                    placeholder="Contoh: Transport meeting klien"
                    required
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Kategori
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Transport">Transport</option>
                    <option value="Meals">Meals</option>
                    <option value="Medical">Medical</option>
                    <option value="Office">Office</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Jumlah
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                    placeholder="500000"
                    required
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                  Bukti pengeluaran
                  <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
                    />
                  </div>
                  <span className="mt-2 block text-[11px] text-slate-500">
                    {receiptFile ? `Lampiran: ${receiptFile.name}` : 'Nota / receipt / bukti sah wajib diunggah sebelum submit.'}
                  </span>
                </label>
              </div>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeClaimModal} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
                <button type="submit" className="rounded-xl bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600">
                  {editingClaimId !== null ? 'Simpan perubahan' : 'Simpan pengajuan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
