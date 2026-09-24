"use client";

import {
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  Receipt,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type PaymentRow = {
  id: string;
  nama: string;
  tanggal: string;
  deskripsi: string;
  jumlah: string;
  status: "Paid" | "Pending" | "Approved";
  aksi: string;
};

const stats = [
  {
    label: "Total Pembayaran",
    icon: CurrencyCircleDollar,
    value: "Rp 48.750.000",
    count: "128 transaksi",
    tone: "default" as const,
  },
  {
    label: "Menunggu Bayar",
    icon: Clock,
    value: "Rp 11.250.000",
    count: "17 approvals",
    tone: "pending" as const,
  },
  {
    label: "Sudah Dibayar",
    icon: CheckCircle,
    value: "Rp 31.500.000",
    count: "96 transaksi",
    tone: "approved" as const,
  },
  {
    label: "Tertunda",
    icon: WarningCircle,
    value: "Rp 6.000.000",
    count: "5 dokumen",
    tone: "rejected" as const,
  },
];

const rows: PaymentRow[] = [
  {
    id: "PAY-2025-081",
    nama: "Andi Saputra",
    tanggal: "23 Sep 2025",
    deskripsi: "Transportasi kunjungan klien Bandung",
    jumlah: "Rp 750.000",
    status: "Pending",
    aksi: "Review",
  },
  {
    id: "PAY-2025-080",
    nama: "Rina Mardiana",
    tanggal: "22 Sep 2025",
    deskripsi: "Pembelian hardware kerja",
    jumlah: "Rp 3.500.000",
    status: "Approved",
    aksi: "Lihat",
  },
  {
    id: "PAY-2025-079",
    nama: "Dimas Putra",
    tanggal: "21 Sep 2025",
    deskripsi: "Biaya konsumsi rapat vendor",
    jumlah: "Rp 420.000",
    status: "Paid",
    aksi: "Lihat",
  },
  {
    id: "PAY-2025-078",
    nama: "Siska Rahma",
    tanggal: "19 Sep 2025",
    deskripsi: "Biaya pendidikan training",
    jumlah: "Rp 310.000",
    status: "Pending",
    aksi: "Review",
  },
];

const columns: Array<{
  key: keyof PaymentRow;
  header: string;
  render?: (value: PaymentRow[keyof PaymentRow], row: PaymentRow) => React.ReactNode;
}> = [
  { key: "id", header: "ID" },
  { key: "nama", header: "Nama" },
  { key: "tanggal", header: "Tanggal" },
  { key: "deskripsi", header: "Deskripsi" },
  { key: "jumlah", header: "Jumlah" },
  {
    key: "status",
    header: "Status",
    render: (value) => <StatusBadge status={String(value)} />,
  },
  {
    key: "aksi",
    header: "Aksi",
    render: (_, row) => (
      <Link href={`/finance/payments/${row.id}`} className="text-sm font-medium text-[#20d6a1] hover:text-[#52e7ba]">
        {row.aksi}
      </Link>
    ),
  },
];

export default function FinanceDashboardPage() {
  return (
    <AppShell
      title="Dashboard Finance"
      subtitle="Pantau pembayaran reimbursement yang sudah disetujui"
      dateLabel="Rabu, 24 September 2025"
      userName="Nadia Putri"
      role="Finance"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              count={stat.count}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-slate-300">
            <Receipt size={18} className="text-[#20d6a1]" />
            <span className="text-sm">17 pembayaran menunggu proses transfer</span>
          </div>

          <Link href="/finance/payments">
            <Button variant="primary" className="w-full justify-center md:w-auto">
              Kelola Pembayaran
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Pembayaran Terbaru</h2>
            <Link href="/finance/payments" className="text-sm font-medium text-[#20d6a1] transition hover:text-[#52e7ba]">
              Lihat Semua →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <Table columns={columns} rows={rows} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
