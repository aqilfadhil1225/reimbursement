"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PaymentDetail = {
  id: string;
  nama: string;
  bank: string;
  tanggal: string;
  deskripsi: string;
  jumlah: string;
  status: "Paid" | "Pending" | "Approved";
  catatan: string;
  noRekening: string;
};

const paymentData: Record<string, PaymentDetail> = {
  "PAY-2025-081": {
    id: "PAY-2025-081",
    nama: "Andi Saputra",
    bank: "BCA",
    tanggal: "23 Sep 2025",
    deskripsi: "Transportasi kunjungan klien Bandung",
    jumlah: "Rp 750.000",
    status: "Pending",
    catatan: "Menunggu proses transfer sesuai jadwal hari kerja.",
    noRekening: "111-222-333-444",
  },
  "PAY-2025-080": {
    id: "PAY-2025-080",
    nama: "Rina Mardiana",
    bank: "Mandiri",
    tanggal: "22 Sep 2025",
    deskripsi: "Pembelian hardware kerja",
    jumlah: "Rp 3.500.000",
    status: "Approved",
    catatan: "Transfer sudah disetujui dari manager dan menunggu diproses oleh finance.",
    noRekening: "204-666-777-888",
  },
};

export default function FinancePaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "PAY-2025-081";
  const payment = paymentData[id] ?? paymentData["PAY-2025-081"];

  return (
    <AppShell
      title={`Pembayaran ${payment.id}`}
      subtitle="Detail dan status transfer reimbursement"
      dateLabel="Rabu, 24 September 2025"
      userName="Nadia Putri"
      role="Finance"
    >
      <div className="space-y-6">
        <Link href="/finance/payments" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
          <ArrowLeft size={16} />
          Kembali ke pembayaran
        </Link>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="p-6">
            <div className="flex flex-col gap-3 border-b border-slate-700/80 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Penerima</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{payment.nama}</h2>
              </div>
              <StatusBadge status={payment.status} />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bank</p>
                <p className="mt-2 text-base font-medium text-white">{payment.bank}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nomor Rekening</p>
                <p className="mt-2 text-base font-medium text-white">{payment.noRekening}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tanggal</p>
                <p className="mt-2 text-base font-medium text-white">{payment.tanggal}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Jumlah</p>
                <p className="mt-2 text-base font-medium text-white">{payment.jumlah}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Deskripsi</p>
              <p className="mt-3 text-slate-200">{payment.deskripsi}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Transfer</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Catatan</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{payment.catatan}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button variant="primary" className="w-full justify-center">
                <CheckCircle size={18} weight="fill" />
                Bayar Sekarang
              </Button>
              <Button variant="secondary" className="w-full justify-center">
                Simpan Catatan
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
