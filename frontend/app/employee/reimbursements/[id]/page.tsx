"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, DownloadSimple, PencilSimple } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ReimbursementDetail = {
  id: string;
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: string;
  status: "Approved" | "Pending" | "Rejected" | "Revision";
  vendor: string;
  bukti: string;
  catatan: string;
  timeline: Array<{ label: string; detail: string; status?: string }>;
};

const reimbursementData: Record<string, ReimbursementDetail> = {
  "R-2025-001": {
    id: "R-2025-001",
    tanggal: "20 Sep 2025",
    deskripsi: "Pembelian alat kerja kantor",
    kategori: "Peralatan Kerja",
    jumlah: "Rp 3.500.000",
    status: "Approved",
    vendor: "CV Teknologi Maju",
    bukti: "Invoice-001.pdf",
    catatan: "Dokumen lengkap dan sudah sesuai dengan kebutuhan operasional.",
    timeline: [
      { label: "Diajukan", detail: "20 Sep 2025 • 09:40", status: "done" },
      { label: "Direview", detail: "21 Sep 2025 • 13:10", status: "done" },
      { label: "Disetujui", detail: "22 Sep 2025 • 08:30", status: "done" },
    ],
  },
  "R-2025-002": {
    id: "R-2025-002",
    tanggal: "18 Sep 2025",
    deskripsi: "Transportasi dinas luar kota",
    kategori: "Transportasi",
    jumlah: "Rp 750.000",
    status: "Pending",
    vendor: "PT Bluebird Indonesia",
    bukti: "Bukti-Transportasi.pdf",
    catatan: "Menunggu persetujuan atasan dan hasil review dari finance.",
    timeline: [
      { label: "Diajukan", detail: "18 Sep 2025 • 07:30", status: "done" },
      { label: "Direview", detail: "18 Sep 2025 • 15:05", status: "active" },
      { label: "Finalisasi", detail: "Menunggu keputusan", status: "pending" },
    ],
  },
};

export default function EmployeeReimbursementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "R-2025-002";
  const reimbursement = reimbursementData[id] ?? reimbursementData["R-2025-002"];

  return (
    <AppShell
      title={`Reimbursement ${reimbursement.id}`}
      subtitle="Detail pengajuan reimbursement"
      dateLabel="Senin, 22 September 2025"
      userName="Andi Saputra"
      role="Employee"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/employee/reimbursements" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft size={16} />
            Kembali ke daftar
          </Link>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" className="justify-center">
              <PencilSimple size={16} />
              Edit
            </Button>
            <Button type="button" variant="primary" className="justify-center">
              <DownloadSimple size={16} />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="p-6">
            <div className="flex flex-col gap-3 border-b border-slate-700/80 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Deskripsi</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{reimbursement.deskripsi}</h2>
              </div>
              <StatusBadge status={reimbursement.status} />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tanggal</p>
                <p className="mt-2 text-base font-medium text-white">{reimbursement.tanggal}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Jumlah</p>
                <p className="mt-2 text-base font-medium text-white">{reimbursement.jumlah}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Kategori</p>
                <p className="mt-2 text-base font-medium text-white">{reimbursement.kategori}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vendor</p>
                <p className="mt-2 text-base font-medium text-white">{reimbursement.vendor}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700/80 bg-[#081a2f] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Catatan</p>
              <p className="mt-3 leading-7 text-slate-200">{reimbursement.catatan}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Progress</h3>

            <div className="mt-5 space-y-4">
              {reimbursement.timeline.map((step, index) => (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                        step.status === "done"
                          ? "border-[#20d6a1] bg-[#102d2b] text-[#62f0c2]"
                          : step.status === "active"
                            ? "border-[#f59e0b] bg-[#2b220f] text-[#f7c66b]"
                            : "border-slate-600 bg-slate-800 text-slate-400",
                      ].join(" ")}
                    >
                      {index + 1}
                    </div>
                    {index < reimbursement.timeline.length - 1 ? (
                      <span className="mt-2 h-8 w-px bg-slate-700" />
                    ) : null}
                  </div>

                  <div className="flex-1 pb-2">
                    <p className="font-medium text-white">{step.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-700/80 pt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bukti</p>
              <p className="mt-2 text-sm font-medium text-slate-200">{reimbursement.bukti}</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
