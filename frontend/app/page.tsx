'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleDollarSign, Eye, EyeOff } from 'lucide-react';
import {
  createClaim,
  deleteClaim,
  financeReview,
  listClaims,
  loginUser,
  managerReview,
  processPayment,
  registerUser,
  submitClaim,
  updateClaim,
  updateProfilePassword,
  uploadReceipt,
} from '@/app/actions/reimbursements';
import EmployeeDashboard from './components/EmployeeDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import {
  type AuthUser,
  type ClaimRow,
  type Role,
} from './components/dashboard-shared';

export default function Home() {
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingClaimId, setEditingClaimId] = useState<number | null>(null);
  const [filter, setFilter] = useState('Semua');
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPasswordInputs, setShowPasswordInputs] = useState({ current: false, next: false, confirm: false });
  const [form, setForm] = useState({ name: '', email: '', password: '', description: '', category: 'Transportasi', amount: '' });

  const isEmployee = user?.role === 'EMPLOYEE';

  const loadClaims = async (authToken: string) => {
    try {
      const data = await listClaims(authToken);
      setClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tidak dapat memuat data reimbursement.');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('reimbursement_token');
    const savedUser = localStorage.getItem('reimbursement_user');

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser) as AuthUser;
      setUser(parsedUser);
      setToken(savedToken);
      setIsLoggedIn(true);
      loadClaims(savedToken);
    }
  }, []);

  const resetAuthForm = () => {
    setForm({ name: '', email: '', password: '', description: '', category: 'Transportasi', amount: '' });
  };

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const payload = isRegistering
        ? await registerUser({ name: form.name, email: form.email, password: form.password })
        : await loginUser({ email: form.email, password: form.password });

      const nextUser = payload.user as AuthUser;
      const nextToken = payload.token as string;
      localStorage.setItem('reimbursement_token', nextToken);
      localStorage.setItem('reimbursement_user', JSON.stringify(nextUser));
      setToken(nextToken);
      setUser(nextUser);
      setIsLoggedIn(true);
      await loadClaims(nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth gagal. Coba lagi.');
    }
  };

  const closeClaimModal = () => {
    setShowNew(false);
    setEditingClaimId(null);
    setReceiptFile(null);
    setForm((current) => ({ ...current, description: '', amount: '' }));
    setError('');
  };

  const handleCreateClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const amount = Number(form.amount);
      const payload = {
        description: form.description,
        category: form.category,
        amount,
        expenses: [
          {
            category: form.category,
            amount,
            expenseDate: new Date().toISOString(),
            description: form.description,
            receiptUrl: '',
          },
        ],
      };

      let nextClaimId = editingClaimId;

      if (editingClaimId !== null) {
        await updateClaim(token, editingClaimId, payload);
      } else {
        const created = await createClaim(token, payload);
        nextClaimId = created?.id ?? null;
      }

      if (receiptFile && nextClaimId !== null && nextClaimId !== undefined) {
        await uploadReceipt(token, nextClaimId, receiptFile);
        await submitClaim(token, nextClaimId);
      }

      closeClaimModal();
      await loadClaims(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pengajuan gagal diproses.');
    }
  };

  const handleDeleteClaim = async (id: number) => {
    if (!token) return;
    setError('');

    const targetClaim = claims.find((claim) => claim.id === id);
    if (!targetClaim || !['DRAFT', 'REVISION_REQUIRED', 'SUBMITTED'].includes(targetClaim.status)) {
      setError('Hanya pengajuan yang masih dalam proses review yang bisa dihapus.');
      return;
    }

    setClaims((current) => current.filter((claim) => claim.id !== id));

    try {
      await deleteClaim(token, id);
      await loadClaims(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft gagal dihapus.');
      await loadClaims(token);
    }
  };

  const handleUploadReceipt = async (id: number, file: File) => {
    if (!token) return;
    setError('');

    try {
      await uploadReceipt(token, id, file);
      await submitClaim(token, id);
      await loadClaims(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload bukti gagal.');
    }
  };

  const handleDecision = async (
    id: number,
    action: 'approve' | 'reject' | 'revise' | 'verify' | 'start',
    roleOverride?: Role,
    note?: string,
  ) => {
    if (!token) return;
    setError('');

    try {
      if (roleOverride === 'MANAGER') {
        const managerAction = action as 'approve' | 'reject' | 'revise';
        const decisionNote = note?.trim() || `Keputusan ${managerAction}`;
        await managerReview(token, id, managerAction, decisionNote);
      } else if (roleOverride === 'FINANCE') {
        const financeAction = action as 'start' | 'verify' | 'reject' | 'revise';
        const decisionNote = note?.trim() || `Keputusan ${financeAction}`;
        if (financeAction === 'start') {
          await financeReview(token, id, 'start');
        } else if (financeAction === 'verify') {
          await financeReview(token, id, 'verify');
        } else {
          await financeReview(token, id, financeAction, decisionNote);
        }
      }

      await loadClaims(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aksi gagal diproses.');
    }
  };

  const handlePayment = async (id: number) => {
    if (!token) return;
    try {
      await processPayment(token, id, 'BANK_TRANSFER', `AUTO-${Date.now()}`);
      await loadClaims(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pembayaran gagal diproses.');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) return;

    const response = await updateProfilePassword(token, { currentPassword, newPassword });
    localStorage.setItem('reimbursement_token', response.token);
    localStorage.setItem('reimbursement_user', JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user as AuthUser);
    setPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordInputs({ current: false, next: false, confirm: false });
  };

  const handleLogout = () => {
    localStorage.removeItem('reimbursement_token');
    localStorage.removeItem('reimbursement_user');
    resetAuthForm();
    setToken('');
    setUser(null);
    setClaims([]);
    setIsLoggedIn(false);
    setPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordInputs({ current: false, next: false, confirm: false });
    setError('');
  };

  if (!isLoggedIn || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10 text-slate-900">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.1fr_420px]">
          <div className="hidden flex-col justify-between bg-[#4f46e5] px-10 py-8 text-white lg:flex">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/15"><CircleDollarSign className="size-5" /></div>
                <span className="text-xl font-bold">Reimburse<span className="text-blue-100">ly</span></span>
              </div>

              <div className="max-w-md space-y-4">
                <p className="text-sm font-medium tracking-[0.08em] text-blue-100 uppercase">Satu alur, tiga peran</p>
                <h1 className="text-3xl font-bold leading-tight tracking-tight">Kelola reimburse tanpa kehilangan jejak.</h1>
                <p className="text-sm leading-6 text-blue-100/90">
                  Employee mengajukan, manager meninjau, lalu finance memproses pembayaran.
                </p>
              </div>
            </div>

            <p className="text-xs text-blue-200/90">Workspace Reimburse Perusahaan</p>
          </div>

          <div className="order-1 p-7 sm:p-10 lg:col-start-2 lg:row-start-1">
            <p className="text-sm font-semibold text-[#4f46e5]">
              {isRegistering ? 'Buat akun employee' : 'Selamat datang kembali'}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {isRegistering ? 'Daftar ke workspace' : 'Masuk ke workspace'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isRegistering
                ? 'Buat akun untuk mengajukan reimbursement dan memantau statusnya.'
                : 'Masuk dengan email dan password akun kamu.'}
            </p>

            <form onSubmit={handleAuth} className="mt-8 space-y-4">
              {isRegistering && (
                <label className="block text-xs font-semibold text-slate-600">
                  Nama lengkap
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-[#4f46e5]"
                    placeholder="Nama lengkap"
                    required
                  />
                </label>
              )}

              <label className="block text-xs font-semibold text-slate-600">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      passwordInputRef.current?.focus();
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-[#4f46e5]"
                  placeholder="email@company.com"
                  required
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                Password
                <div className="relative mt-2">
                  <input
                    ref={passwordInputRef}
                    type={showLoginPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-11 text-sm outline-none transition focus:border-[#4f46e5]"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowLoginPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

              <button type="submit" className="w-full rounded-xl bg-[#4f46e5] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4338ca]">
                {isRegistering ? 'Daftar sekarang' : 'Masuk'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>{isRegistering ? 'Sudah punya akun?' : 'Belum punya akun employee?'}</span>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering((value) => !value);
                  setError('');
                  resetAuthForm();
                }}
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                {isRegistering ? 'Masuk' : 'Daftar sekarang'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (user.role === 'MANAGER') {
    return (
      <>
        <ManagerDashboard
          user={user}
          claims={claims}
          onOpenPasswordModal={() => setPasswordModalOpen(true)}
          handleDecision={handleDecision}
          handleLogout={handleLogout}
        />
        {passwordModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setPasswordModalOpen(false)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Akun</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Ubah password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6L18 18M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (passwordForm.newPassword.length < 6) {
                    setError('Password baru minimal 6 karakter.');
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setError('Konfirmasi password tidak sama.');
                    return;
                  }

                  try {
                    setError('');
                    await handleChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Password gagal diubah.');
                  }
                }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-slate-700">
                  Password lama
                  <div className="relative mt-2">
                    <input
                      type={showPasswordInputs.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                      required
                    />
                    <button type="button" aria-label={showPasswordInputs.current ? 'Sembunyikan password lama' : 'Tampilkan password lama'} onClick={() => setShowPasswordInputs((current) => ({ ...current, current: !current.current }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                      {showPasswordInputs.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Password baru
                  <div className="relative mt-2">
                    <input
                      type={showPasswordInputs.next ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                      required
                    />
                    <button type="button" aria-label={showPasswordInputs.next ? 'Sembunyikan password baru' : 'Tampilkan password baru'} onClick={() => setShowPasswordInputs((current) => ({ ...current, next: !current.next }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                      {showPasswordInputs.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Konfirmasi password baru
                  <div className="relative mt-2">
                    <input
                      type={showPasswordInputs.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                      required
                    />
                    <button type="button" aria-label={showPasswordInputs.confirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} onClick={() => setShowPasswordInputs((current) => ({ ...current, confirm: !current.confirm }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                      {showPasswordInputs.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setPasswordModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" className="rounded-xl bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  if (user.role === 'FINANCE') {
    return (
      <>
        <FinanceDashboard
          user={user}
          claims={claims}
          onOpenPasswordModal={() => setPasswordModalOpen(true)}
          handleDecision={handleDecision}
          handlePayment={handlePayment}
          handleLogout={handleLogout}
        />
        {passwordModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setPasswordModalOpen(false)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Akun</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Ubah password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6L18 18M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (passwordForm.newPassword.length < 6) {
                    setError('Password baru minimal 6 karakter.');
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setError('Konfirmasi password tidak sama.');
                    return;
                  }

                  try {
                    setError('');
                    await handleChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Password gagal diubah.');
                  }
                }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-slate-700">
                  Password lama
                  <div className="relative mt-2">
                    <input
                      type={showPasswordInputs.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                      required
                    />
                    <button type="button" aria-label={showPasswordInputs.current ? 'Sembunyikan password lama' : 'Tampilkan password lama'} onClick={() => setShowPasswordInputs((current) => ({ ...current, current: !current.current }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                      {showPasswordInputs.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Password baru
                  <div className="relative mt-2">
                    <input
                      type={showPasswordInputs.next ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                      required
                    />
                    <button type="button" aria-label={showPasswordInputs.next ? 'Sembunyikan password baru' : 'Tampilkan password baru'} onClick={() => setShowPasswordInputs((current) => ({ ...current, next: !current.next }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                      {showPasswordInputs.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Konfirmasi password baru
                  <div className="relative mt-2">
                    <input
                      type={showPasswordInputs.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                      required
                    />
                    <button type="button" aria-label={showPasswordInputs.confirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} onClick={() => setShowPasswordInputs((current) => ({ ...current, confirm: !current.confirm }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                      {showPasswordInputs.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setPasswordModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" className="rounded-xl bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <EmployeeDashboard
        user={user}
        token={token}
        claims={claims}
        query={query}
        filter={filter}
        setQuery={setQuery}
        setFilter={setFilter}
        onOpenPasswordModal={() => setPasswordModalOpen(true)}
        showNew={showNew}
        setShowNew={(value) => {
          setShowNew(value);
          if (!value) {
            setEditingClaimId(null);
            setReceiptFile(null);
            setForm((current) => ({ ...current, description: '', amount: '' }));
            setError('');
          }
        }}
        editingClaimId={editingClaimId}
        form={form}
        setForm={setForm}
        receiptFile={receiptFile}
        setReceiptFile={setReceiptFile}
        error={error}
        setError={setError}
        handleCreateClaim={handleCreateClaim}
        handleDeleteClaim={handleDeleteClaim}
        handleUploadReceipt={handleUploadReceipt}
        handleEditClaim={(claim) => {
          if (!['DRAFT', 'REVISION_REQUIRED', 'SUBMITTED'].includes(claim.status)) {
            setError('Hanya pengajuan yang belum disetujui manager yang bisa diedit.');
            return;
          }

          setEditingClaimId(claim.id);
          setForm((current) => ({ ...current, description: claim.description, category: claim.category, amount: String(claim.amount) }));
          setShowNew(true);
        }}
        handleLogout={handleLogout}
        loadClaims={loadClaims}
        closeClaimModal={closeClaimModal}
      />
      {passwordModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setPasswordModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Akun</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Ubah password</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup"
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6L18 18M18 6L6 18" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (passwordForm.newPassword.length < 6) {
                  setError('Password baru minimal 6 karakter.');
                  return;
                }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                  setError('Konfirmasi password tidak sama.');
                  return;
                }

                try {
                  setError('');
                  await handleChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Password gagal diubah.');
                }
              }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-slate-700">
                Password lama
                <div className="relative mt-2">
                  <input
                    type={showPasswordInputs.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                  <button type="button" aria-label={showPasswordInputs.current ? 'Sembunyikan password lama' : 'Tampilkan password lama'} onClick={() => setShowPasswordInputs((current) => ({ ...current, current: !current.current }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                    {showPasswordInputs.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password baru
                <div className="relative mt-2">
                  <input
                    type={showPasswordInputs.next ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                  <button type="button" aria-label={showPasswordInputs.next ? 'Sembunyikan password baru' : 'Tampilkan password baru'} onClick={() => setShowPasswordInputs((current) => ({ ...current, next: !current.next }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                    {showPasswordInputs.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Konfirmasi password baru
                <div className="relative mt-2">
                  <input
                    type={showPasswordInputs.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                  <button type="button" aria-label={showPasswordInputs.confirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} onClick={() => setShowPasswordInputs((current) => ({ ...current, confirm: !current.confirm }))} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700">
                    {showPasswordInputs.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPasswordModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                <button type="submit" className="rounded-xl bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
