export type Role = 'EMPLOYEE' | 'MANAGER' | 'FINANCE';

export type ClaimRow = {
  id: number;
  employeeName: string;
  employeeEmail: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
  status: string;
  history?: Array<{
    id?: number;
    reimbursementId?: number;
    status?: string;
    note?: string;
    actorId?: number;
    createdAt?: string;
  }>;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  MANAGER_APPROVED: 'Manager approved',
  FINANCE_REVIEW: 'Finance review',
  READY_FOR_PAYMENT: 'Ready for payment',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  REVISION_REQUIRED: 'Revision required',
};

export const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  MANAGER_APPROVED: 'bg-emerald-100 text-emerald-700',
  FINANCE_REVIEW: 'bg-violet-100 text-violet-700',
  READY_FOR_PAYMENT: 'bg-purple-100 text-purple-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  REVISION_REQUIRED: 'bg-amber-100 text-amber-700',
};

export const roleLabels: Record<Role, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  FINANCE: 'Finance',
};

export const roleConfig: Record<Role, { greeting: string; subtitle: string; avatar: string }> = {
  EMPLOYEE: { greeting: 'Pantau pengajuan reimburse kamu.', subtitle: 'Employee', avatar: 'E' },
  MANAGER: { greeting: 'Tinjau pengajuan dari tim kamu.', subtitle: 'Manager', avatar: 'M' },
  FINANCE: { greeting: 'Kelola pembayaran reimburse perusahaan.', subtitle: 'Finance', avatar: 'F' },
};

export function money(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}
