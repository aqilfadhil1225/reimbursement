"use client";

import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type ApprovalListRow = {
  id: string;
  pengaju: string;
  divisi: string;
  tanggal: string;
  kategori: string;
  jumlah: string;
  status: "Pending" | "Approved" | "Rejected";
  aksi: string;
};

const rows: ApprovalListRow[] = [
  {
    id: "R-2025-011",
    pengaju: "Andi Saputra",
    divisi: "Operations",
    tanggal: "22 Sep 2025",
    kategori: "Transportasi",
    jumlah: "Rp 750.000",
    status: "Pending",
    aksi: "Review",
  },
  {
    id: "R-2025-010",
    pengaju: "Rina Mardiana",
    divisi: "Product",
    tanggal: "21 Sep 2025",
    kategori: "Peralatan Kerja",
    jumlah: "Rp 3.500.000",
    status: "Pending",
    aksi: "Review",
  },
  {
    id: "R-2025-009",
    pengaju: "Dimas Putra",
    divisi: "Marketing",
    tanggal: "20 Sep 2025",
    kategori: "Konsumsi",
    jumlah: "Rp 420.000",
    status: "Approved",
    aksi: "Lihat",
  },
  {
    id: "R-2025-008",
    pengaju: "Siska Rahma",
    divisi: "HR",
    tanggal: "19 Sep 2025",
    kategori: "Pendidikan",
    jumlah: "Rp 310.000",
    status: "Rejected",
    aksi: "Lihat",
  },
];

const columns: Array<{
  key: keyof ApprovalListRow;
  header: string;
  render?: (value: ApprovalListRow[keyof ApprovalListRow], row: ApprovalListRow) => React.ReactNode;
}> = [
  { key: "id", header: "ID" },
  { key: "pengaju", header: "Pengaju" },
  { key: "divisi", header: "Divisi" },
  { key: "tanggal", header: "Tanggal" },
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

export default function ManagerApprovalsPage() {
  return (
    <AppShell
      title="Approval Reimbursement"
      subtitle="Tinjau dan putuskan pengajuan karyawan"
      dateLabel="Selasa, 23 September 2025"
      userName="Ayu Pratama"
      role="Manager"
    >
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Queue review</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">17 pengajuan menunggu keputusan</h2>
            </div>

            <Button variant="primary" className="w-full justify-center lg:w-auto">
              <ShieldCheck size={18} weight="fill" />
              Approve Semua
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Daftar Pengajuan</h2>
            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300">
              4 data
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
