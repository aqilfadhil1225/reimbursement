'use client';

import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { ArrowLeft, ReceiptText } from 'lucide-react';

type ClaimForm = {
  name: string;
  email: string;
  password: string;
  description: string;
  category: string;
  amount: string;
};

type EmployeeNewClaimContentProps = {
  form: ClaimForm;
  setForm: Dispatch<SetStateAction<ClaimForm>>;
  receiptFile: File | null;
  setReceiptFile: Dispatch<SetStateAction<File | null>>;
  error: string;
  setError: (value: string) => void;
  handleCreateClaim: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onCancel: () => void;
  onSuccess: () => void;
};

const categories = [
  'Transportasi',
  'Makanan & Minuman',
  'Kesehatan',
  'Perjalanan Dinas',
  'Peralatan Kerja',
  'ATK & Office Supplies',
  'Pelatihan & Seminar',
];

export default function EmployeeNewClaimContent({
  form,
  setForm,
  receiptFile,
  setReceiptFile,
  error,
  setError,
  handleCreateClaim,
  onCancel,
  onSuccess,
}: EmployeeNewClaimContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitClaim = async (event: FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    try {
      const succeeded = await handleCreateClaim(event);
      if (succeeded) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-6 sm:px-8">
        <button
          type="button"
          onClick={onCancel}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Kembali ke ringkasan
        </button>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#E8722A]">Pengajuan reimbursement</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Ajukan pengeluaran baru</h2>
        <p className="mt-2 text-sm text-slate-500">Lengkapi detail pengeluaran yang ingin diganti.</p>
      </header>

      <form onSubmit={submitClaim} className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Pengajuan tanpa bukti akan disimpan sebagai draft. Unggah bukti pengeluaran untuk langsung mengirimkannya ke manager.
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Deskripsi pengajuan
          <input
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            onFocus={() => setError('')}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
            placeholder="Contoh: Transport meeting klien"
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Kategori
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
            >
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Jumlah pengajuan (Rp)
            <input
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-800 outline-none transition focus:border-[#E8722A] focus:bg-white focus:ring-2 focus:ring-[#E8722A]/20"
              placeholder="500000"
              required
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Bukti pengeluaran
          <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm font-normal text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#E8722A]/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#E8722A]"
            />
          </div>
          <span className="mt-2 block text-xs font-normal text-slate-500">
            {receiptFile ? `File dipilih: ${receiptFile.name}` : 'Format yang didukung: JPG, PNG, atau PDF.'}
          </span>
        </label>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#E8722A] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d4641e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Menyimpan...' : receiptFile ? 'Kirim pengajuan' : 'Simpan sebagai draft'}
          </button>
        </div>
      </form>
    </section>
  );
}
