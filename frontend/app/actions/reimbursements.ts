const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('API request failed:', error);
    throw new Error('Backend tidak bisa dijangkau. Pastikan server backend sudah berjalan di ' + API_BASE + '.');
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload?.data ?? payload;
}

export async function loginUser(data: { email: string; password: string }) {
  return request<{ user: unknown; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  return request<{ user: unknown; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listClaims(token: string) {
  return request<any[]>('/reimbursements', { method: 'GET' }, token);
}

export async function createClaim(token: string, input: {
  description: string;
  category: string;
  amount: number;
  expenses?: Array<{
    category: string;
    amount: number;
    expenseDate: string;
    description: string;
    receiptUrl?: string;
  }>;
}) {
  return request<any>('/reimbursements', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
}

export async function updateClaim(token: string, id: number, input: {
  description?: string;
  category?: string;
  amount?: number;
  expenses?: Array<{
    category: string;
    amount: number;
    expenseDate: string;
    description: string;
    receiptUrl?: string;
  }>;
}) {
  return request<any>(`/reimbursements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }, token);
}

export async function deleteClaim(token: string, id: number) {
  return request<any>(`/reimbursements/${id}`, { method: 'DELETE' }, token);
}

export async function submitClaim(token: string, id: number) {
  return request<any>(`/reimbursements/${id}/submit`, { method: 'PATCH' }, token);
}

export async function uploadReceipt(token: string, id: number, file: File) {
  const formData = new FormData();
  formData.append('receipt', file);

  return request<any>(`/reimbursements/${id}/receipt`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function managerReview(token: string, id: number, action: 'approve' | 'reject' | 'revise', note?: string) {
  return request<any>(`/reimbursements/${id}/manager`, {
    method: 'PATCH',
    body: JSON.stringify({ action, note: note ?? `${action} queued from frontend` }),
  }, token);
}

export async function financeReview(token: string, id: number, action: 'start' | 'verify' | 'reject' | 'revise', note?: string) {
  return request<any>(`/reimbursements/${id}/finance`, {
    method: 'PATCH',
    body: JSON.stringify({ action, note: note ?? `${action} queued from frontend` }),
  }, token);
}

export async function processPayment(
  token: string,
  id: number,
  method: 'BANK_TRANSFER' | 'CASH' | 'OTHER' = 'BANK_TRANSFER',
  reference?: string,
  note?: string,
) {
  return request<any>(`/reimbursements/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify({
      method,
      reference: reference ?? `AUTO-${Date.now()}`,
      note: note ?? 'Paid from frontend',
    }),
  }, token);
}

export async function uploadPaymentProof(token: string, id: number, file: File) {
  const formData = new FormData();
  formData.append('proof', file);

  return request<any>(`/reimbursements/${id}/payment/proof`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function updateProfilePassword(token: string, data: { currentPassword: string; newPassword: string }) {
  return request<{ user: unknown; token: string }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      password: data.newPassword,
    }),
  }, token);
}
