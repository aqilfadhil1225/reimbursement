"use client";

import { ArrowLeft, CheckCircle, Paperclip, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const initialForm = {
  jenis: "Biaya perjalanan dinas",
  tanggal: "2025-09-22",
  kategori: "Transportasi",
  vendor: "PT Bluebird Indonesia",
  deskripsi: "Transportasi pegawai untuk kegiatan kunjungan klien di Bandung.",
  jumlah: "750000",
  notes: "Mohon diproses sesuai jadwal pembayaran bulan ini.",
};

export default function NewReimbursementPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <AppShell
      title="Ajukan Reimbursement"
      subtitle="Isi detail pengajuan untuk memulai proses verifikasi"
      dateLabel="Senin, 22 September 2025"
      userName="Andi Saputra"
      role="Employee"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/employee/reimbursements" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft size={16} />
            Kembali ke daftar
          </Link>
        </div>

        {isSubmitted ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#20d6a1]/30 bg-[#102d2b] px-4 py-3 text-sm text-[#62f0c2]">
            <CheckCircle size={18} weight="fill" />
            Pengajuan berhasil dibuat dan dikirim untuk ditinjau.
          </div>
        ) : null}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block font-medium text-slate-200">Jenis pengajuan</span>
                <select
                  name="jenis"
                  value={form.jenis}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition focus:border-[#20d6a1]"
                >
                  <option value="Biaya perjalanan dinas">Biaya perjalanan dinas</option>
                  <option value="Biaya operasional">Biaya operasional</option>
                  <option value="Pembelian alat kerja">Pembelian alat kerja</option>
                  <option value="Konsumsi rapat">Konsumsi rapat</option>
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                <span className="mb-2 block font-medium text-slate-200">Tanggal</span>
                <input
                  type="date"
                  name="tanggal"
                  value={form.tanggal}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition focus:border-[#20d6a1]"
                />
              </label>

              <label className="block text-sm text-slate-300">
                <span className="mb-2 block font-medium text-slate-200">Kategori</span>
                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition focus:border-[#20d6a1]"
                >
                  <option value="Transportasi">Transportasi</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Peralatan Kerja">Peralatan Kerja</option>
                  <option value="Pendidikan">Pendidikan</option>
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                <span className="mb-2 block font-medium text-slate-200">Vendor / Mitra</span>
                <input
                  type="text"
                  name="vendor"
                  value={form.vendor}
                  onChange={handleChange}
                  placeholder="Nama vendor"
                  className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-[#20d6a1]"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block font-medium text-slate-200">Deskripsi</span>
              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-[#20d6a1]"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block font-medium text-slate-200">Jumlah</span>
                <input
                  type="number"
                  name="jumlah"
                  value={form.jumlah}
                  onChange={handleChange}
                  min={0}
                  className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition focus:border-[#20d6a1]"
                />
              </label>

              <div className="flex items-end">
                <label className="block w-full text-sm text-slate-300">
                  <span className="mb-2 block font-medium text-slate-200">Lampiran</span>
                  <div className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-[#091a2a] px-3 py-3 text-slate-300 transition hover:border-[#20d6a1]/60 hover:text-white">
                    <Paperclip size={16} />
                    Upload bukti pembayaran
                  </div>
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block font-medium text-slate-200">Catatan</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-[#091a2a] px-3 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-[#20d6a1]"
              />
            </label>

            <div className="flex flex-col gap-3 border-t border-slate-700/80 pt-5 md:flex-row md:justify-end">
              <Button type="button" variant="secondary" className="w-full justify-center md:w-auto">
                Simpan Draft
              </Button>
              <Button type="submit" variant="primary" className="w-full justify-center md:w-auto" disabled={isSubmitting}>
                <Plus size={16} weight="bold" />
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
