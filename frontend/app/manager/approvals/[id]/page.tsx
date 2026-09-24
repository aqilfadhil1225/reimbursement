"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApprovalDetail = {
  id: string;
  pengaju: string;
  divisi: string;
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: string;
  status: "Approved" | "Pending" | "Rejected";
  vendor: string;
  catatan: string;
  bukti: string;
};

const approvalData: Record<string, ApprovalDetail> = {
  "R-2025-011": {
    id: "R-2025-011",
    pengaju: "Andi Saputra",
    divisi: "Operations",
    tanggal: "22 Sep 2025",
    deskripsi: "Transportasi kunjungan klien Bandung",
    kategori: "Transportasi",
    jumlah: "Rp 750.000",
    status: "Pending",
    vendor: "PT Bluebird Indonesia",
    catatan: "Kunjungan klien di Bandung untuk meeting onboarding mitra baru.",
    bukti: "bukti-transportasi-bandung.pdf",
  },
  "R-2025-010": {
    id: "R-2025-010",
    pengaju: "Rina Mardiana",
    divisi: "Product",
    tanggal: "21 Sep 2025",
    deskripsi: "Pembelian laptop untuk operasional",
    kategori: "Peralatan Kerja",
    jumlah: "Rp 3.500.000",
    status: "Pending",
    vendor: "CV Teknologi Maju",
    catatan: "Pembelian hardware untuk kebutuhan develop team.",
    bukti: "invoice-laptop.pdf",
  },
};

export default function ManagerApprovalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "R-2025-011";
  const approval = approvalData[id] ?? approvalData["R-2025-011"];

  return (
    <AppShell
      title={`Approval ${approval.id}`}
      subtitle="Review detail pengajuan sebelum keputusan"
      dateLabel="Selasa, 23 September 2025"
      userName="Ayu Pratama"
      role="Manager"
    >
      <div className="space-y-6">
        <Link href="/manager/approvals" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
          <ArrowLeft size={16} />
          Kembali ke approval
        </Link>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="p-6">
            <div className="flex flex-col gap-3 border-b border-slate-700/80 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Pengaju</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{approval.pengaju}</h2>
              </div>
              <StatusBadge status={approval.status} />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Divisi</p>
                <p className="mt-2 text-base font-medium text-white">{approval.divisi}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tanggal</p>
                <p className="mt-2 text-base font-medium text-white">{approval.tanggal}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Kategori</p>
                <p className="mt-2 text-base font-medium text-white">{approval.kategori}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Jumlah</p>
                <p className="mt-2 text-base font-medium text-white">{approval.jumlah}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Deskripsi</p>
              <p className="mt-3 text-slate-200">{approval.deskripsi}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Catatan</p>
              <p className="mt-3 leading-7 text-slate-200">{approval.catatan}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Keputusan</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vendor</p>
                <p className="mt-2 text-sm text-slate-200">{approval.vendor}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bukti</p>
                <p className="mt-2 text-sm text-slate-200">{approval.bukti}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button variant="primary" className="w-full justify-center">
                <CheckCircle size={18} weight="fill" />
                Setujui
              </Button>
              <Button variant="secondary" className="w-full justify-center text-red-300">
                <XCircle size={18} />
                Tolak
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
