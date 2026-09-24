"use client";

import { ArrowRight, CheckCircle, EnvelopeSimple, ShieldCheck, Sparkle, Wallet } from "@phosphor-icons/react";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FeatureItem } from "@/components/auth/FeatureItem";
import { Input } from "@/components/auth/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";

const featureItems = [
  { icon: Sparkle, label: "Mudah Digunakan" },
  { icon: CheckCircle, label: "Proses Transparan" },
  { icon: ShieldCheck, label: "Aman & Terpercaya" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess("");

    if (!validateEmail(email)) {
      setError("Format email tidak valid.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setError("");
    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      setSuccess("Login berhasil. Silakan lanjut ke dashboard.");
    }, 900);
  };

  return (
    <main className="min-h-screen bg-[#020b16] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1200px] rounded-[28px] border border-slate-700/80 bg-[#051522]/90 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.8)] md:p-6">
        <div className="grid min-h-[780px] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-between rounded-[24px] border border-slate-700/80 bg-[#020d1a] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#20d6a1] text-slate-950 shadow-[0_0_20px_rgba(32,214,161,0.35)]">
                <Wallet size={20} weight="fill" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Reimbursement</h1>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="space-y-6">
                <h2 className="max-w-[540px] text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                  Kelola Pengajuan Reimbursement dengan Mudah dan Terstruktur
                </h2>

                <p className="max-w-lg text-base leading-7 text-slate-400">
                  Sistem pengajuan reimbursement untuk karyawan dengan proses yang transparan,
                  cepat, dan aman.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  {featureItems.map(({ icon: Icon, label }) => (
                    <FeatureItem key={label} icon={Icon} label={label} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center py-4">
            <div className="w-full max-w-[480px]">
              <AuthCard
                title="Selamat Datang"
                subtitle="Silakan login untuk melanjutkan"
                footer={
                  <div className="border-t border-slate-700/80 pt-4 text-center text-xs text-slate-400">
                    © 2025 Reimbursement System
                  </div>
                }
              >
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@perusahaan.com"
                    error={error && !validateEmail(email) ? "Format email tidak valid." : undefined}
                    icon={<EnvelopeSimple size={18} />}
                  />

                  <PasswordInput
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    error={error && password.length < 6 ? "Password minimal 6 karakter." : undefined}
                  />

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-[#20d6a1] focus:ring-[#20d6a1]"
                      />
                      Remember me
                    </label>

                    <button type="button" className="text-[#20d6a1] transition hover:text-[#52e7ba]">
                      Lupa password?
                    </button>
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {error}
                    </div>
                  ) : null}

                  {success ? (
                    <div className="rounded-xl border border-[#20d6a1]/40 bg-[#102d2b] px-3 py-2 text-sm text-[#62f0c2]">
                      {success}
                    </div>
                  ) : null}

                  <Button type="submit" variant="primary" className="w-full justify-center py-3.5 text-base" disabled={loading}>
                    {loading ? "Login..." : "Login"}
                    {!loading ? <ArrowRight size={18} weight="bold" /> : null}
                  </Button>
                </form>

                <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span className="h-px flex-1 bg-slate-700" />
                  <span>atau</span>
                  <span className="h-px flex-1 bg-slate-700" />
                </div>
              </AuthCard>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
