import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Laptop,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  X,
  UserRound,
} from 'lucide-react';
import { money, roleLabels, type AuthUser, type ClaimRow } from './dashboard-shared';

type ProfileSecurityContentProps = {
  user: AuthUser;
  claims: ClaimRow[];
  onUpdateProfile: (name: string, avatar?: File, removeAvatar?: boolean) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onLogout: () => void;
};

const fieldClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20';

export default function ProfileSecurityContent({ user, claims, onUpdateProfile, onChangePassword, onLogout }: ProfileSecurityContentProps) {
  const [name, setName] = useState(user.name);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false });
  const [profileStatus, setProfileStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPhoto]);

  const userClaims = claims.filter((claim) => user.role !== 'EMPLOYEE' || claim.employeeEmail === user.email);
  const approvedClaims = userClaims.filter((claim) => ['MANAGER_APPROVED', 'FINANCE_REVIEW', 'READY_FOR_PAYMENT', 'PAID'].includes(claim.status));
  const paidClaims = userClaims.filter((claim) => claim.status === 'PAID');
  const totalClaimAmount = userClaims.reduce((total, claim) => total + claim.amount, 0);

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setProfileError('Nama lengkap wajib diisi.');
      return;
    }
    if (nextName === user.name && !selectedPhoto && !removePhoto) return;

    try {
      setIsSavingProfile(true);
      setProfileError('');
      setPhotoError('');
      setProfileStatus('');
      await onUpdateProfile(nextName, selectedPhoto ?? undefined, removePhoto);
      setName(nextName);
      setSelectedPhoto(null);
      setRemovePhoto(false);
      setProfileStatus('Profil berhasil diperbarui.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Profil gagal diperbarui.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak sama.');
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordError('');
      setPasswordStatus('');
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus('Password berhasil diperbarui.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Password gagal diubah.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const passwordField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    onToggle: () => void,
    placeholder: string,
    autoComplete: string,
  ) => (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <span className="relative mt-2 block">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClassName} pr-11`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#E8722A]/[0.07] to-white px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8722A]">Akun Anda</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Profil saya</h2>
          </div>
          <span className="rounded-full bg-[#E8722A]/10 px-3 py-1 text-xs font-semibold text-[#D65F19]">{roleLabels[user.role]}</span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#E8722A]/10 text-lg font-bold text-[#E8722A] ring-1 ring-[#E8722A]/15">
              {(photoPreviewUrl || (!removePhoto && user.avatarUrl)) ? (
                <img src={photoPreviewUrl || user.avatarUrl || undefined} alt={`Foto profil ${user.name}`} className="size-full object-cover" />
              ) : user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h3 className="break-words text-lg font-bold text-slate-900">{user.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-slate-500"><Mail className="size-3.5 shrink-0" />{user.email}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {[
              { label: 'Total pengajuan', value: `${userClaims.length} pengajuan` },
              { label: 'Nilai klaim', value: money(totalClaimAmount) },
              { label: 'Disetujui', value: `${approvedClaims.length} pengajuan` },
              { label: 'Dibayar', value: `${paidClaims.length} pengajuan` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#E8722A]/10 text-[#E8722A]"><UserRound className="size-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Edit profil</h2>
              <p className="text-xs text-slate-500">Perbarui nama lengkap akun Anda.</p>
            </div>
          </div>
          <form onSubmit={submitProfile} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E8722A]/10 text-sm font-bold text-[#E8722A]">
                {(photoPreviewUrl || (!removePhoto && user.avatarUrl)) ? (
                  <img src={photoPreviewUrl || user.avatarUrl || undefined} alt="Pratinjau foto profil" className="size-full object-cover" />
                ) : name.slice(0, 2).toUpperCase()}
              </span>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Pilih foto profil"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setPhotoError('');
                  setProfileError('');
                  setProfileStatus('');
                  if (!file) return;
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    setPhotoError('Foto harus berupa JPG, PNG, atau WebP.');
                    event.target.value = '';
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setPhotoError('Ukuran foto maksimal 5 MB.');
                    event.target.value = '';
                    return;
                  }
                  setSelectedPhoto(file);
                  setRemovePhoto(false);
                }}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#E8722A]/40 hover:bg-[#E8722A]/5 hover:text-[#D65F19]"
              >
                Pilih foto
              </button>
              {(selectedPhoto || (!removePhoto && user.avatarUrl)) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(null);
                    setRemovePhoto(Boolean(user.avatarUrl));
                    if (photoInputRef.current) photoInputRef.current.value = '';
                  }}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <X className="size-3.5" />
                  Hapus foto
                </button>
              )}
              {selectedPhoto && <span className="min-w-0 truncate text-xs text-slate-500">{selectedPhoto.name}</span>}
            </div>
            <p className="text-[11px] text-slate-500">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
            {removePhoto && <p className="text-xs text-slate-500">Foto akan dihapus setelah profil disimpan.</p>}
            <label className="block text-xs font-semibold text-slate-600">
              Nama lengkap
              <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClassName} required maxLength={120} />
            </label>
            {photoError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{photoError}</p>}
            {profileError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{profileError}</p>}
            {profileStatus && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{profileStatus}</p>}
            <button type="submit" disabled={isSavingProfile || (name.trim() === user.name && !selectedPhoto)} className="w-full rounded-xl bg-[#E8722A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d4641e] disabled:cursor-not-allowed disabled:opacity-50">
              {isSavingProfile ? 'Menyimpan...' : 'Simpan profil'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Link2 className="size-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Akun Google</h2>
              <p className="text-xs text-slate-500">Informasi metode masuk Google.</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-800">Login Google tersedia</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Akun dapat masuk menggunakan Google dari halaman masuk. Menautkan atau melepas akun Google dari profil belum didukung.</p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <BadgeCheck className="size-4 text-emerald-600" />
            Email akun: <span className="break-all font-medium text-slate-700">{user.email}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#E8722A]/10 text-[#E8722A]"><LockKeyhole className="size-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ubah password</h2>
              <p className="text-xs text-slate-500">Gunakan password minimal 6 karakter.</p>
            </div>
          </div>
          <form onSubmit={submitPassword} className="space-y-3.5">
            {passwordField('Password lama', currentPassword, setCurrentPassword, visiblePasswords.current, () => setVisiblePasswords((value) => ({ ...value, current: !value.current })), 'Password saat ini', 'current-password')}
            {passwordField('Password baru', newPassword, setNewPassword, visiblePasswords.next, () => setVisiblePasswords((value) => ({ ...value, next: !value.next })), 'Minimal 6 karakter', 'new-password')}
            {passwordField('Konfirmasi password baru', confirmPassword, setConfirmPassword, visiblePasswords.confirm, () => setVisiblePasswords((value) => ({ ...value, confirm: !value.confirm })), 'Ulangi password baru', 'new-password')}
            {passwordError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{passwordError}</p>}
            {passwordStatus && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{passwordStatus}</p>}
            <button type="submit" disabled={isSavingPassword} className="w-full rounded-xl bg-[#E8722A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d4641e] disabled:cursor-not-allowed disabled:opacity-50">
              {isSavingPassword ? 'Menyimpan...' : 'Simpan password baru'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Laptop className="size-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Perangkat login</h2>
              <p className="text-xs text-slate-500">Sesi aktif pada browser ini.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500"><Smartphone className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">Perangkat ini</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Sesi login yang sedang digunakan</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><Check className="size-3" />Aktif</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Daftar dan pengelolaan sesi dari perangkat lain belum tersedia.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><LogOut className="size-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sesi</h2>
              <p className="text-xs text-slate-500">Keluar dari akun pada perangkat ini.</p>
            </div>
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-500">Keluar tidak menghapus data pengajuan Anda. Anda dapat masuk kembali kapan saja.</p>
          <button type="button" onClick={onLogout} className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            Keluar dari akun
          </button>
        </section>
      </div>
    </div>
  );
}
