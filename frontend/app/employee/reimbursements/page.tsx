"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type ReimbursementRow = {
  id: string;
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: string;
  status: "Approved" | "Pending" | "Rejected" | "Revision";
  aksi: string;
};

const rows: ReimbursementRow[] = [
  {
    id: "R-2025-001",
    tanggal: "20 Sep 2025",
    deskripsi: "Pembelian alat kerja kantor",
    kategori: "Peralatan Kerja",
    jumlah: "Rp 3.500.000",
    status: "Approved",
    aksi: "Lihat detail",
  },
  {
    id: "R-2025-002",
    tanggal: "18 Sep 2025",
    deskripsi: "Transportasi dinas luar kota",
    kategori: "Transportasi",
    jumlah: "Rp 750.000",
    status: "Pending",
    aksi: "Lihat detail",
  },
  {
    id: "R-2025-003",
    tanggal: "15 Sep 2025",
    deskripsi: "Biaya makan meeting",
    kategori: "Konsumsi",
    jumlah: "Rp 350.000",
    status: "Approved",
    aksi: "Lihat detail",
  },
  {
    id: "R-2025-004",
    tanggal: "10 Sep 2025",
    deskripsi: "Pembelian buku referensi",
    kategori: "Pendidikan",
    jumlah: "Rp 275.000",
    status: "Revision",
    aksi: "Perbaiki",
  },
  {
    id: "R-2025-005",
    tanggal: "5 Sep 2025",
    deskripsi: "Biaya parkir kantor",
    kategori: "Transportasi",
    jumlah: "Rp 25.000",
    status: "Rejected",
    aksi: "Lihat detail",
  },
];

const columns: Array<{
  key: keyof ReimbursementRow;
  header: string;
  render?: (value: ReimbursementRow[keyof ReimbursementRow], row: ReimbursementRow) => React.ReactNode;
}> = [
  { key: "id", header: "ID" },
  { key: "tanggal", header: "Tanggal" },
  {
    key: "deskripsi",
    header: "Deskripsi",
    render: (value, row) => (
      <div className="flex flex-col">
        <span className="font-medium text-white">{String(value)}</span>
        <span className="text-xs text-slate-400">{row.kategori}</span>
      </div>
    ),
  },
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
      <Link
        href={`/employee/reimbursements/${row.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#20d6a1] transition hover:text-[#52e7ba]"
      >
        {row.aksi}
        <ArrowRight size={14} />
      </Link>
    ),
  },
];

export default function EmployeeReimbursementsPage() {
  return (
    <AppShell
      title="Pengajuan Reimbursement"
      subtitle="Kelola seluruh pengajuan reimbursement Anda"
      dateLabel="Senin, 22 September 2025"
      userName="Andi Saputra"
      role="Employee"
    >
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Ringkasan</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Total 5 pengajuan</h2>
            </div>

            <Link href="/employee/reimbursements/new">
              <Button variant="primary" className="w-full justify-center lg:w-auto">
                <Plus size={18} weight="bold" />
                Ajukan Baru
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Daftar Reimbursement</h2>
            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300">
              5 data
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table columns={columns} rows={rows} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
