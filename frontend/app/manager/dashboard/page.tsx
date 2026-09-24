"use client";

import {
  CheckCircle,
  Clock,
  Receipt,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type ApprovalRow = {
  id: string;
  pengaju: string;
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: string;
  status: "Approved" | "Pending" | "Rejected";
  aksi: string;
};

const stats = [
  {
    label: "Total Disubmit",
    icon: Receipt,
    value: "128",
    count: "12 hari ini",
    tone: "default" as const,
  },
  {
    label: "Menunggu Review",
    icon: Clock,
    value: "17",
    count: "3 butuh perhatian",
    tone: "pending" as const,
  },
  {
    label: "Disetujui",
    icon: CheckCircle,
    value: "94",
    count: "74% approval rate",
    tone: "approved" as const,
  },
  {
    label: "Ditolak",
    icon: XCircle,
    value: "11",
    count: "2 hari ini",
    tone: "rejected" as const,
  },
];

const rows: ApprovalRow[] = [
  {
    id: "R-2025-011",
    pengaju: "Andi Saputra",
    tanggal: "22 Sep 2025",
    deskripsi: "Transportasi kunjungan klien Bandung",
    kategori: "Transportasi",
    jumlah: "Rp 750.000",
    status: "Pending",
    aksi: "Review",
  },
  {
    id: "R-2025-010",
    pengaju: "Rina Mardiana",
    tanggal: "21 Sep 2025",
    deskripsi: "Pembelian laptop untuk operasional",
    kategori: "Peralatan Kerja",
    jumlah: "Rp 3.500.000",
    status: "Pending",
    aksi: "Review",
  },
  {
    id: "R-2025-009",
    pengaju: "Dimas Putra",
    tanggal: "20 Sep 2025",
    deskripsi: "Biaya konsumsi rapat vendor",
    kategori: "Konsumsi",
    jumlah: "Rp 420.000",
    status: "Approved",
    aksi: "Lihat",
  },
  {
    id: "R-2025-008",
    pengaju: "Siska Rahma",
    tanggal: "19 Sep 2025",
    deskripsi: "Pembelian buku referensi training",
    kategori: "Pendidikan",
    jumlah: "Rp 310.000",
    status: "Rejected",
    aksi: "Lihat",
  },
];

const columns: Array<{
  key: keyof ApprovalRow;
  header: string;
  render?: (value: ApprovalRow[keyof ApprovalRow], row: ApprovalRow) => React.ReactNode;
}> = [
  { key: "id", header: "ID" },
  { key: "pengaju", header: "Pengaju" },
  { key: "tanggal", header: "Tanggal" },
  { key: "deskripsi", header: "Deskripsi" },
  { key: "kategori", header: "Kategori" },
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
      <Link href={`/manager/approvals/${row.id}`} className="text-sm font-medium text-[#20d6a1] hover:text-[#52e7ba]">
        {row.aksi}
      </Link>
    ),
  },
];

export default function ManagerDashboardPage() {
  return (
    <AppShell
      title="Dashboard Manager"
      subtitle="Pantau proses approval reimbursement team"
      dateLabel="Selasa, 23 September 2025"
      userName="Ayu Pratama"
      role="Manager"
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
            <WarningCircle size={18} className="text-[#f7c66b]" />
            <span className="text-sm">3 pengajuan memerlukan tindakan segera</span>
          </div>

          <Link href="/manager/approvals">
            <Button variant="primary" className="w-full justify-center md:w-auto">
              Lihat Approval
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Approval Terbaru</h2>
            <Link href="/manager/approvals" className="text-sm font-medium text-[#20d6a1] transition hover:text-[#52e7ba]">
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
