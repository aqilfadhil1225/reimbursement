export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Kamu sedang offline</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kerangka aplikasi dapat dibuka tanpa internet, tetapi login, data reimbursement, dan semua aksi memerlukan koneksi internet.
        </p>
        <a
          href="/"
          className="mt-5 inline-flex rounded-lg bg-[#E8722A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d4641e]"
        >
          Coba lagi
        </a>
      </section>
    </main>
  );
}
