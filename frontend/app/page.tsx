'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  uploadPaymentProof,
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
  const [isReady, setIsReady] = useState(false);
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
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
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
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('reimbursement_token');
        const savedUser = localStorage.getItem('reimbursement_user');

        if (!savedToken || !savedUser) {
          setIsLoggedIn(false);
          setUser(null);
          setToken('');
          return;
        }

        const parsedUser = JSON.parse(savedUser) as AuthUser;
        setUser(parsedUser);
        setToken(savedToken);
        setIsLoggedIn(true);
        await loadClaims(savedToken);
      } catch (error) {
        localStorage.removeItem('reimbursement_token');
        localStorage.removeItem('reimbursement_user');
        setUser(null);
        setToken('');
        setIsLoggedIn(false);
      } finally {
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!isReady || !isLoggedIn || user?.role !== 'EMPLOYEE') return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') !== 'new-claim') return;

    setShowNew(true);
    url.searchParams.delete('mode');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [isReady, isLoggedIn, user?.role]);

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

  const handlePayment = async (
    id: number,
    paymentData?: { method?: 'BANK_TRANSFER' | 'CASH' | 'OTHER'; reference?: string; note?: string },
    proofFile?: File | null,
  ) => {
    if (!token) return;
    setError('');

    try {
      const method = paymentData?.method ?? 'BANK_TRANSFER';
      const reference = paymentData?.reference?.trim() || `AUTO-${Date.now()}`;
      const note = paymentData?.note?.trim() || `Pembayaran via ${method} pada ${new Date().toLocaleString('id-ID')}`;

      await processPayment(token, id, method, reference, note);

      if (proofFile) {
        await uploadPaymentProof(token, id, proofFile);
      }

      setPaymentProofFile(null);
      await loadClaims(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pembayaran gagal diproses.';
      setError(message);
      throw err;
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

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10 text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm">
          Memuat sesi Anda...
        </div>
      </main>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] text-slate-900" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>
        {/* Navbar */}
        <nav className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/logo-microdata.png"
              alt="Microdata Indonesia"
              className="h-8 w-auto object-contain sm:h-10"
            />
            <span className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">Reimbursement</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {/* Login text link - mirip referensi */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError('');
                resetAuthForm();
              }}
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:block"
            >
              Login
            </button>
            {/* Daftar - solid orange button seperti referensi */}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError('');
                resetAuthForm();
              }}
              className="rounded-lg bg-[#E8722A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d4641e] active:scale-[0.97] sm:px-5"
            >
              Daftar
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-7 sm:px-5 sm:py-10">
          <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">

            {/* Left: Headline */}
            <div className="hidden space-y-6 lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#e07b39]">
                Satu alur, tiga peran
              </p>
              <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900">
                Kelola reimburse<br />tanpa kehilangan<br />jejak.
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-500">
                Employee mengajukan, manager meninjau, lalu finance memproses pembayaran
              </p>

              {/* Step indicator */}
              <div className="mt-8 inline-flex items-center gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {[
                  { label: 'Ajukan', sub: 'Pengajuan klaim' },
                  { label: 'Review', sub: 'Manager & Finance' },
                  { label: 'Bayar', sub: 'Proses pembayaran' },
                ].map((step, i) => (
                  <div
                    key={step.label}
                    className={`flex flex-col items-center gap-0.5 px-6 py-4 text-center ${i === 0 ? 'border-r border-slate-200 bg-[#e07b39]/5' : i === 1 ? 'border-r border-slate-200' : ''}`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-[#e07b39]' : 'text-slate-400'}`}>{step.label}</span>
                    <span className="text-[11px] text-slate-400">{step.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form card */}
            <div className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-xl sm:px-8 sm:py-9">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#e07b39]">
                {isRegistering ? 'Buat akun baru' : 'Selamat datang kembali'}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {isRegistering ? 'Daftar ke workspace' : 'Masuk ke workspace'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-400">
                {isRegistering
                  ? 'Buat akun untuk mengajukan dan memantau reimburse.'
                  : 'Masuk dengan email dan password akun kamu.'}
              </p>

              <form onSubmit={handleAuth} className="mt-7 space-y-4">
                {isRegistering && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama lengkap</label>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#e07b39] focus:bg-white focus:ring-2 focus:ring-[#e07b39]/20"
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#e07b39] focus:bg-white focus:ring-2 focus:ring-[#e07b39]/20"
                    placeholder="email@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Password</label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showLoginPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#e07b39] focus:bg-white focus:ring-2 focus:ring-[#e07b39]/20"
                      placeholder="Minimal 6 karakter"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setShowLoginPassword((value) => !value)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                    <span className="mt-0.5 text-red-500">⚠</span>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  id="login-submit-btn"
                  className="mt-1 w-full rounded-lg bg-[#E8722A] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d4641e] hover:shadow-md active:scale-[0.98]"
                >
                  {isRegistering ? 'Daftar Sekarang →' : 'Masuk →'}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>{isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering((value) => !value);
                    setError('');
                    resetAuthForm();
                  }}
                  className="font-semibold text-[#E8722A] transition hover:underline"
                >
                  {isRegistering ? 'Masuk di sini' : 'Daftar sekarang'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8722A]">Akun</p>
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                  <button type="submit" className="rounded-xl bg-[#E8722A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d4641e]">Simpan</button>
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8722A]">Akun</p>
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                  <button type="submit" className="rounded-xl bg-[#E8722A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d4641e]">Simpan</button>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8722A]">Akun</p>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
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
                <button type="submit" className="rounded-xl bg-[#E8722A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d4641e]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
