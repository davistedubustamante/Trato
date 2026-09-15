"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Field, GhostButton, PrimaryButton, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole =
    params.get("role") === "driver" ? ("driver" as const) : ("passenger" as const);

  const [role, setRole] = useState<"passenger" | "driver">(initialRole);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(
    () =>
      role === "driver"
        ? "Publica tu vehículo y responde ofertas en tu zona."
        : "Pide un viaje con banda justa y elige la mejor oferta.",
    [role],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_color: vehicleColor,
          vehicle_plate: vehiclePlate,
        },
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.replace(role === "driver" ? "/driver" : "/passenger");
      return;
    }
    setInfo(
      "Cuenta creada. Si el proyecto exige confirmar email, confírmalo o usa las cuentas demo.",
    );
    setLoading(false);
  }

  return (
    <main className="relative min-h-dvh bg-[linear-gradient(180deg,oklch(0.93_0.03_170),oklch(1_0_0)_40%)]">
      <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link href="/" className="text-sm font-semibold text-primary">
          ← Trato
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("passenger")}
            className={`h-10 flex-1 rounded-full text-sm font-bold ${
              role === "passenger"
                ? "bg-primary text-white"
                : "border border-line bg-surface text-ink"
            }`}
          >
            Pasajero
          </button>
          <button
            type="button"
            onClick={() => setRole("driver")}
            className={`h-10 flex-1 rounded-full text-sm font-bold ${
              role === "driver"
                ? "bg-primary text-white"
                : "border border-line bg-surface text-ink"
            }`}
          >
            Conductor
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 max-h-[70dvh] overflow-y-auto">
        <Sheet>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Field
              label="Nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Field
              label="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            {role === "driver" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Marca"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    required
                  />
                  <Field
                    label="Modelo"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Color"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    required
                  />
                  <Field
                    label="Placa"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {info ? <p className="text-sm font-medium text-primary">{info}</p> : null}
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Creando…" : "Empezar"}
            </PrimaryButton>
            <Link href="/login" className="block">
              <GhostButton type="button" className="w-full">
                Ya tengo cuenta
              </GhostButton>
            </Link>
          </form>
        </Sheet>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Cargando…</div>}>
      <SignupForm />
    </Suspense>
  );
}
