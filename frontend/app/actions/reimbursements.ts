const API_BASE = '/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('API request failed:', error);
    throw new Error('API tidak bisa dijangkau melalui frontend. Pastikan server frontend dan backend sudah berjalan.');
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload?.data ?? payload;
}

export async function loginUser(data: { email: string; password: string }) {
  return request<{ user: unknown }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSession() {
  return request<{ user: unknown }>('/auth/session', { method: 'GET' });
}

export async function logoutUser() {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}

export async function loginWithGoogle(credential: string) {
  return request<{ user: unknown }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  return request<{ user: unknown }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listClaims() {
  return request<any[]>('/reimbursements', { method: 'GET' });
}

export async function createClaim(input: {
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
  });
}

export async function updateClaim(id: number, input: {
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
  });
}

export async function deleteClaim(id: number) {
  return request<any>(`/reimbursements/${id}`, { method: 'DELETE' });
}

export async function submitClaim(id: number) {
  return request<any>(`/reimbursements/${id}/submit`, { method: 'PATCH' });
}

export async function uploadReceipt(id: number, file: File) {
  const formData = new FormData();
  formData.append('receipt', file);

  return request<any>(`/reimbursements/${id}/receipt`, {
    method: 'POST',
    body: formData,
  });
}

export async function managerReview(id: number, action: 'approve' | 'reject' | 'revise', note?: string) {
  return request<any>(`/reimbursements/${id}/manager`, {
    method: 'PATCH',
    body: JSON.stringify({ action, note: note ?? `${action} queued from frontend` }),
  });
}

export async function financeReview(id: number, action: 'start' | 'verify' | 'reject' | 'revise', note?: string) {
  return request<any>(`/reimbursements/${id}/finance`, {
    method: 'PATCH',
    body: JSON.stringify({ action, note: note ?? `${action} queued from frontend` }),
  });
}

export async function processPayment(
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
  });
}

export async function uploadPaymentProof(id: number, file: File) {
  const formData = new FormData();
  formData.append('proof', file);

  return request<any>(`/reimbursements/${id}/payment/proof`, {
    method: 'POST',
    body: formData,
  });
}

export async function updateProfilePassword(data: { currentPassword?: string; newPassword: string }) {
  return request<{ user: unknown }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      password: data.newPassword,
    }),
  });
}

export async function linkGoogleAccount(credential: string) {
  return request<{ user: unknown }>('/profile/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function unlinkGoogleAccount() {
  return request<{ user: unknown }>('/profile/google', { method: 'DELETE' });
}

export async function updateProfile(name: string, avatar?: File, removeAvatar = false) {
  if (avatar) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('avatar', avatar);
    if (removeAvatar) formData.append('removeAvatar', 'true');

    return request<{ user: unknown }>('/profile', {
      method: 'PATCH',
      body: formData,
    });
  }

  return request<{ user: unknown }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name, ...(removeAvatar ? { removeAvatar: true } : {}) }),
  });
}
