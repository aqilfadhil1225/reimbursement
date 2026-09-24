"use client";

import Link from "next/link";
import { Bank } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type FinancePaymentRow = {
  id: string;
  nama: string;
  bank: string;
  tanggal: string;
  jumlah: string;
  status: "Paid" | "Pending" | "Approved";
  aksi: string;
};

const rows: FinancePaymentRow[] = [
  {
    id: "PAY-2025-081",
    nama: "Andi Saputra",
    bank: "BCA 111****987",
    tanggal: "23 Sep 2025",
    jumlah: "Rp 750.000",
    status: "Pending",
    aksi: "Proses",
  },
  {
    id: "PAY-2025-080",
    nama: "Rina Mardiana",
    bank: "Mandiri 204****112",
    tanggal: "22 Sep 2025",
    jumlah: "Rp 3.500.000",
    status: "Approved",
    aksi: "Lihat",
  },
  {
    id: "PAY-2025-079",
    nama: "Dimas Putra",
    bank: "BNI 009****522",
    tanggal: "21 Sep 2025",
    jumlah: "Rp 420.000",
    status: "Paid",
    aksi: "Lihat",
  },
];

const columns: Array<{
  key: keyof FinancePaymentRow;
  header: string;
  render?: (value: FinancePaymentRow[keyof FinancePaymentRow], row: FinancePaymentRow) => React.ReactNode;
}> = [
  { key: "id", header: "ID" },
  { key: "nama", header: "Nama" },
  { key: "bank", header: "Bank" },
  { key: "tanggal", header: "Tanggal" },
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

export default function FinancePaymentsPage() {
  return (
    <AppShell
      title="Pembayaran Reimbursement"
      subtitle="Kelola proses transfer reimbursement yang sudah disetujui"
      dateLabel="Rabu, 24 September 2025"
      userName="Nadia Putri"
      role="Finance"
    >
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Outstanding payment</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Rp 11.250.000 menunggu transfer</h2>
            </div>

            <Button variant="primary" className="w-full justify-center lg:w-auto">
              <Bank size={18} weight="fill" />
              Proses Batch
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Daftar Pembayaran</h2>
            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300">
              3 data
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
