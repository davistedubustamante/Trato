"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, GhostButton, PrimaryButton, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("pasajero@trato.app");
  const [password, setPassword] = useState("trato1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const role = data.user?.user_metadata?.role as string | undefined;
    router.replace(role === "driver" ? "/driver" : "/passenger");
  }

  return (
    <main className="relative min-h-dvh bg-[linear-gradient(180deg,oklch(0.93_0.03_170),oklch(1_0_0)_40%)]">
      <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link href="/" className="text-sm font-semibold text-primary">
          ← Trato
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">
          Entra al trato
        </h1>
        <p className="mt-2 text-sm text-muted">
          Demo: pasajero@trato.app / conductor@trato.app · trato1234
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <Sheet>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? (
              <p className="text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Entrando…" : "Continuar"}
            </PrimaryButton>
            <Link href="/signup" className="block">
              <GhostButton type="button" className="w-full">
                Crear cuenta
              </GhostButton>
            </Link>
          </form>
        </Sheet>
      </div>
    </main>
  );
}
