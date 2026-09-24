"use client";

import type { ReactNode } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Table } from "../components/ui/Table";
import {
  CheckCircle,
  CreditCard,
  Receipt,
  XCircle,
} from "@phosphor-icons/react";

const stats = [
  {
    label: "Total Reimbursement",
    icon: Receipt,
    value: "Rp 4.875.000",
    count: "6 pengajuan",
    tone: "default" as const,
  },
  {
    label: "Menunggu Persetujuan",
    icon: CreditCard,
    value: "Rp 1.250.000",
    count: "2 pengajuan",
    tone: "pending" as const,
  },
  {
    label: "Disetujui",
    icon: CheckCircle,
    value: "Rp 3.200.000",
    count: "4 pengajuan",
    tone: "approved" as const,
  },
  {
    label: "Ditolak",
    icon: XCircle,
    value: "Rp 425.000",
    count: "1 pengajuan",
    tone: "rejected" as const,
  },
];

type DashboardRow = {
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: string;
  status: string;
};

const rows: DashboardRow[] = [
  {
    tanggal: "20 Sep 2025",
    deskripsi: "Beli laptop untuk keperluan kerja",
    kategori: "Peralatan Kerja",
    jumlah: "Rp 3.500.000",
    status: "Approved",
  },
  {
    tanggal: "18 Sep 2025",
    deskripsi: "Transportasi dinas luar kota",
    kategori: "Transportasi",
    jumlah: "Rp 750.000",
    status: "Pending",
  },
  {
    tanggal: "15 Sep 2025",
    deskripsi: "Biaya makan meeting",
    kategori: "Konsumsi",
    jumlah: "Rp 350.000",
    status: "Approved",
  },
  {
    tanggal: "10 Sep 2025",
    deskripsi: "Pembelian buku referensi",
    kategori: "Pendidikan",
    jumlah: "Rp 275.000",
    status: "Rejected",
  },
  {
    tanggal: "5 Sep 2025",
    deskripsi: "Biaya parkir",
    kategori: "Transportasi",
    jumlah: "Rp 25.000",
    status: "Approved",
  },
];

const columns: Array<{
  key: keyof DashboardRow;
  header: string;
  render?: (value: DashboardRow[keyof DashboardRow], row: DashboardRow) => ReactNode;
}> = [
  { key: "tanggal", header: "Tanggal" },
  { key: "deskripsi", header: "Deskripsi" },
  { key: "kategori", header: "Kategori" },
  { key: "jumlah", header: "Jumlah" },
  {
    key: "status",
    header: "Status",
    render: (value: DashboardRow[keyof DashboardRow]) => (
      <StatusBadge status={String(value)} />
    ),
  },
];

export default function HomePage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Selamat datang, Andi Saputra"
      dateLabel="Senin, 22 September 2025"
      userName="Andi Saputra"
      role="Employee"
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

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 shadow-[0_0_0_1px_rgba(148,163,184,0.08)]">
          <Button variant="primary" className="w-full justify-center md:w-auto">
            <span className="text-base font-semibold">＋ Ajukan Reimbursement</span>
          </Button>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Pengajuan Terbaru</h2>
            <button className="text-sm font-medium text-[#20d6a1] transition hover:text-[#52e7ba]">
              Lihat Semua →
            </button>
          </div>
          <div className="overflow-x-auto">
            <Table columns={columns} rows={rows} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
