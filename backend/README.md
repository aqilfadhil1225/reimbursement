# Reimbursement API

Backend untuk sistem reimbursement berbasis Express, Prisma, dan PostgreSQL.

## Menjalankan project

1. Pastikan PostgreSQL aktif.
2. Buat file `.env` di folder `backend`.
3. Isi `.env` dengan konfigurasi berikut:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reimbursement?schema=public"
JWT_SECRET="ganti_dengan_secret_random_yang_aman"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

File `.env` jangan di-commit karena berisi konfigurasi rahasia.
4. Install dependency:

```bash
npm install
```

5. Generate Prisma Client dan jalankan migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Jalankan server:

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`.

## Authentication

Register:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Employee Satu",
  "email": "employee@example.com",
  "password": "password123"
}
```

Register publik selalu membuat user dengan role `EMPLOYEE`. Akun `MANAGER` dan `FINANCE` dibuat oleh user `FINANCE` melalui endpoint user.

Login:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "employee@example.com",
  "password": "password123"
}
```

Gunakan token dari response login untuk endpoint lain:

```http
Authorization: Bearer TOKEN_LOGIN
```

Role yang tersedia hanya `EMPLOYEE`, `MANAGER`, dan `FINANCE`.

## Endpoint utama

Semua endpoint di bawah ini membutuhkan token login.

### User

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
```

Endpoint user hanya bisa digunakan oleh `FINANCE`.

### Reimbursement

```text
GET    /api/reimbursements
GET    /api/reimbursements/:id
POST   /api/reimbursements
PATCH  /api/reimbursements/:id
DELETE /api/reimbursements/:id
PATCH  /api/reimbursements/:id/submit
PATCH  /api/reimbursements/:id/manager
PATCH  /api/reimbursements/:id/finance
```

Aturan akses:

- `EMPLOYEE`: membuat, mengubah, menghapus, dan submit reimbursement.
- `MANAGER`: melakukan review manager.
- `FINANCE`: melakukan review finance dan pembayaran.

### Expense

```text
GET    /api/reimbursements/:reimbursementId/expenses
POST   /api/reimbursements/:reimbursementId/expenses
PATCH  /api/reimbursements/:reimbursementId/expenses/:id
DELETE /api/reimbursements/:reimbursementId/expenses/:id
```

### Payment

```text
GET  /api/reimbursements/:reimbursementId/payment
POST /api/reimbursements/:reimbursementId/payment
```

Pembayaran hanya bisa diproses saat status reimbursement `READY_FOR_PAYMENT`.
Metode pembayaran: `BANK_TRANSFER`, `CASH`, atau `OTHER`.

Contoh body:

```json
{
  "method": "BANK_TRANSFER",
  "reference": "TRX-001",
  "note": "Pembayaran sudah diproses."
}
```

### Notification dan audit log

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
GET   /api/audit-logs
GET   /api/audit-logs?reimbursementId=1
GET   /api/audit-logs?actorId=1
```

Notifikasi hanya menampilkan data milik user yang sedang login. Audit log hanya bisa dilihat oleh `MANAGER` dan `FINANCE`.

## Alur status

```text
DRAFT -> SUBMITTED -> MANAGER_APPROVED -> FINANCE_REVIEW
FINANCE_REVIEW -> READY_FOR_PAYMENT -> PAID
```

Status tambahan:

- `REVISION_REQUIRED`: pengajuan perlu diperbaiki dan dikirim ulang.
- `REJECTED`: pengajuan ditolak dan proses selesai.

Perubahan status otomatis dicatat ke `ReimbursementHistory`, `AuditLog`, dan `Notification`.
