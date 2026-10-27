# Reimbursement Frontend

Frontend untuk aplikasi reimbursement, dibuat dengan Next.js App Router, React, TypeScript, dan Tailwind CSS. Aplikasi ini menampilkan dashboard Employee, Manager, dan Finance, serta menggunakan REST API dari backend Express.

## Prasyarat

- Git
- Node.js 20.9 atau lebih baru
- npm
- Backend Reimbursement dan PostgreSQL yang sudah dikonfigurasi

## Clone dan instalasi

Clone repository, lalu masuk ke folder frontend:

```bash
git clone https://github.com/aqilfadhil1225/reimbursement.git
cd reimbursement/frontend
```

Install dependency dari lockfile npm:

```bash
npm ci
```

## Konfigurasi backend

Frontend meneruskan request API melalui proxy same-origin Next.js ke backend di `http://localhost:3001` secara default. Jalankan backend dan siapkan database PostgreSQL terlebih dahulu. Panduan `.env`, Prisma, dan migrasi database tersedia di [README backend](../backend/README.md).

Pastikan `backend/.env` menetapkan port yang sama:

```env
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

Jika backend API berjalan di alamat lain, atur URL server-side di `frontend/.env.local`:

```env
BACKEND_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=client-id-dari-google-cloud
```

Browser mengirim request API ke origin frontend yang sama; proxy Next.js meneruskan cookie sesi `HttpOnly` ke backend. `NEXT_PUBLIC_API_URL` hanya dipakai untuk menampilkan foto profil dari URL upload lokal lama dan tidak digunakan untuk request API.

Ganti port atau host sesuai alamat backend. Untuk mengaktifkan tombol Google SSO,
buat OAuth client bertipe Web application di Google Cloud Console, tambahkan
origin frontend (misalnya `http://localhost:3000`) ke daftar JavaScript origins,
dan gunakan client ID yang sama pada `GOOGLE_CLIENT_ID` di `backend/.env`.
Proxy di `app/api/[...path]/route.ts` dan `app/api/auth/[...all]/route.ts`
menggunakan `BACKEND_API_URL`; restart frontend setelah mengubah URL tersebut.

## Menjalankan aplikasi

Jalankan backend di terminal terpisah. Dari folder `backend`, setelah `.env` dan database siap:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend secara default berjalan di `http://localhost:3001`.

Kemudian, dari folder `frontend`, jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Port frontend dapat diubah dengan argumen Next.js, misalnya `npm run dev -- --port 3002`.

## Build produksi

Dari folder `frontend`:

```bash
npm run build
npm run start
```

Perintah `start` menjalankan build produksi Next.js, bukan development server.

## Arsitektur folder

```text
frontend/
├── app/
│   ├── actions/                 # Request ke REST API backend
│   ├── api/auth/[...all]/       # Proxy route autentikasi ke backend
│   ├── components/              # Dashboard Employee, Manager, Finance, dan komponen bersama
│   ├── globals.css               # Style global dan Tailwind CSS
│   ├── layout.tsx                # Root layout aplikasi
│   └── page.tsx                  # Halaman utama, login/register, dan pemilihan dashboard
├── components/ui/                # Komponen UI bersama
├── lib/
│   ├── db/                       # Koneksi PostgreSQL dan schema Drizzle
│   ├── auth-client.ts            # Client autentikasi
│   └── auth.ts                   # Konfigurasi autentikasi
├── public/                       # Aset statis, seperti logo
├── next.config.mjs               # Konfigurasi Next.js
├── package.json                  # Dependency dan script frontend
├── package-lock.json             # Lockfile npm
└── tsconfig.json                 # Konfigurasi TypeScript
```

### Alur aplikasi

1. `app/page.tsx` memulihkan sesi atau menampilkan form login dan registrasi.
2. Setelah login, halaman memilih dashboard berdasarkan role pengguna.
3. Dashboard menggunakan komponen di `app/components/` dan memanggil endpoint backend melalui fungsi di `app/actions/reimbursements.ts`.
4. Request API dikirim ke proxy same-origin Next.js di `app/api/[...path]/route.ts` dan diteruskan ke backend.
