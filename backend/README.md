# Reimbursement API

Backend untuk sistem reimbursement berbasis Express, Prisma, dan PostgreSQL.

## Menjalankan project

1. Pastikan PostgreSQL aktif.
2. Buat file `.env` di folder `backend`.
3. Isi `.env` dengan konfigurasi berikut:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reimbursement?schema=public"
JWT_SECRET="ganti_dengan_secret_random_yang_aman"
GOOGLE_CLIENT_ID="client-id-dari-google-cloud"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="access-key-minio"
MINIO_SECRET_KEY="secret-key-minio"
MINIO_BUCKET="reimbursement"
MINIO_USE_SSL=false
```

File `.env` jangan di-commit karena berisi konfigurasi rahasia.

Variabel `MINIO_*` menyiapkan konfigurasi object storage. Endpoint diisi sebagai
hostname atau IP tanpa `http://` atau path; port dan penggunaan SSL diatur
terpisah. Client MinIO dikonfigurasi melalui `getMinioClient()`, sedangkan
`ensureMinioBucket()` memeriksa bucket dan membuatnya jika belum ada. Keduanya
tidak dijalankan otomatis saat server mulai; layanan upload akan memastikan
bucket tersedia ketika menyimpan objek. Jangan gunakan contoh access key atau
secret key di production.

Layanan `objectStorageService` menyediakan operasi upload, penghapusan, dan URL
presigned untuk mengakses objek privat. Gunakan object key relatif yang tidak
mengandung data sensitif; URL akses berlaku 5 menit secara default dan masa
berlakunya dapat diatur per pemanggilan hingga maksimum 7 hari. Simpan object key
di database, bukan URL presigned, karena URL tersebut akan kedaluwarsa.

Foto profil baru disimpan di MinIO menggunakan object key `profile-photos/`.
Database menyimpan object key pada field `avatarUrl`; API mengubahnya menjadi
presigned URL selama 24 jam agar foto tetap bisa ditampilkan pada sesi aktif.
Foto profil lama yang masih berupa URL lokal tetap disajikan seperti sebelumnya
sampai foto tersebut diganti atau dihapus. Upload foto menggunakan memori
sementara dan batas ukuran 5 MB; file lokal lama hanya dibersihkan setelah
pembaruan database berhasil.

Bukti reimbursement dan bukti expense baru juga disimpan di MinIO, masing-masing
dengan prefix `reimbursement-receipts/` dan `expense-receipts/`. API mengirimkan
presigned URL dengan masa berlaku 24 jam; referensi file lama yang masih berupa
URL lokal tetap berfungsi. Upload bukti menerima JPG, PNG, atau PDF sampai 5 MB
dan memeriksa signature file sebelum menyimpannya.

Bukti pembayaran baru disimpan di MinIO dengan prefix `payment-proofs/` dan
ditampilkan melalui presigned URL 24 jam. Upload hanya tersedia untuk FINANCE
saat reimbursement berstatus `READY_FOR_PAYMENT` atau `PAID`. File harus berupa
JPG, PNG, atau PDF sampai 5 MB dan signature isinya divalidasi. URL bukti
pembayaran lama tetap berfungsi; saat bukti MinIO diganti, objek terdahulu
dihapus setelah perubahan database berhasil.

### Memigrasikan file upload lokal ke MinIO

Skrip migrasi memeriksa referensi file lama di profil pengguna, bukti
reimbursement, expense, dan pembayaran. Secara default skrip hanya menjalankan
dry-run:

```bash
npm run migrate:local-uploads
```

Dry-run melaporkan jumlah file yang bisa dipindahkan serta referensi yang
menunjuk ke file hilang atau memiliki signature yang tidak didukung. Setelah
memeriksa backup database dan memastikan MinIO dapat dijangkau, jalankan
migrasi sebenarnya dengan persetujuan eksplisit:

```bash
npm run migrate:local-uploads -- --apply
```

Skrip mengunggah setiap file sebelum memperbarui referensi database, dan
menggunakan object key berbasis hash konten agar percobaan ulang menghasilkan
key yang sama. File sumber di `uploads/` tidak dihapus. Jika pembaruan database
gagal setelah upload, objek MinIO mungkin perlu dibersihkan manual. Jangan hapus
file lokal sampai laporan migrasi ditinjau dan seluruh referensi file telah
diverifikasi.
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

Server berjalan di `http://localhost:3001`.

## Dokumentasi API (Swagger)

Jalankan backend, lalu buka Swagger UI di [`http://localhost:3001/api-docs`](http://localhost:3001/api-docs). Dokumentasi mencakup endpoint, format request dan response, upload file, serta autentikasi Bearer.

Untuk mencoba endpoint yang memerlukan autentikasi, login melalui `POST /api/auth/login`, salin nilai `token` dari response, klik **Authorize** di Swagger UI, lalu masukkan token tersebut.

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

Login dengan Google:

```http
POST /api/auth/google
Content-Type: application/json
```

```json
{
  "credential": "google-id-token"
}
```

Atur `GOOGLE_CLIENT_ID` pada `backend/.env` dan ID klien yang sama sebagai
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` pada `frontend/.env.local`. Buat kredensial
OAuth tipe Web application di Google Cloud Console dan daftarkan origin frontend
(misalnya `http://localhost:3000`) sebagai JavaScript origin yang diizinkan.
Token diverifikasi backend; akun baru dibuat dengan role `EMPLOYEE`, sedangkan
email Google terverifikasi yang sudah terdaftar akan memakai akun dan role yang
sudah ada.

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
