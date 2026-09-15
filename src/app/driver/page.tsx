"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RideMap } from "@/components/RideMap";
import { Field, GhostButton, PrimaryButton, Sheet } from "@/components/ui";
import { formatMoney } from "@/lib/fare";
import {
  DEFAULT_CENTER,
  formatDuration,
  formatKm,
  type LatLng,
} from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";
import type { RideRequest } from "@/types/trato";

export default function DriverPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState<LatLng>(DEFAULT_CENTER);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [selected, setSelected] = useState<RideRequest | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [etaMin, setEtaMin] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      const { data: dp } = await supabase
        .from("driver_profiles")
        .select("is_online, last_lat, last_lng")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (dp) {
        setOnline(Boolean(dp.is_online));
        if (dp.last_lat != null && dp.last_lng != null) {
          setLocation({ lat: dp.last_lat, lng: dp.last_lng });
        }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, supabase]);

  useEffect(() => {
    if (!online) return;
    const load = async () => {
      const { data } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      setRides((data as RideRequest[]) ?? []);
    };
    void load();
    const channel = supabase
      .channel("open-rides")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_requests" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [online, supabase]);

  async function toggleOnline() {
    if (!userId) return;
    const next = !online;
    setOnline(next);
    await supabase.from("driver_profiles").upsert({
      user_id: userId,
      is_online: next,
      last_lat: location.lat,
      last_lng: location.lng,
      last_seen: new Date().toISOString(),
    });
  }

  function openBid(ride: RideRequest) {
    setSelected(ride);
    setBidAmount(Number(ride.offered_fare));
    setEtaMin(5);
    setMessage("");
    setError(null);
  }

  async function sendBid() {
    if (!userId || !selected) return;
    const min = Number(selected.fare_min);
    const max = Number(selected.fare_max);
    if (bidAmount < min || bidAmount > max) {
      setError(
        `Mantén la oferta entre ${formatMoney(min)} y ${formatMoney(max)}`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("bids").upsert(
      {
        ride_id: selected.id,
        driver_id: userId,
        amount: bidAmount,
        eta_min: etaMin,
        message: message || null,
        status: "pending",
      },
      { onConflict: "ride_id,driver_id" },
    );
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSelected(null);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      <RideMap center={location} driver={location} />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="rounded-full bg-surface/90 px-3 py-1.5 text-sm font-extrabold text-primary shadow-sm backdrop-blur">
          Conductor
        </p>
        <div className="flex gap-2">
          <Link
            href="/passenger"
            className="rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur"
          >
            Modo pasajero
          </Link>
          <button
            type="button"
            onClick={toggleOnline}
            className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${
              online ? "bg-ok text-white" : "bg-surface/90 text-ink"
            }`}
          >
            {online ? "En línea" : "Fuera"}
          </button>
        </div>
      </header>

      <Sheet
        title={online ? "Pedidos abiertos" : "Conéctate para ver pedidos"}
        subtitle="Contraoferta dentro de la banda — el pasajero elige."
      >
        {!online ? (
          <PrimaryButton onClick={toggleOnline}>Ponerme en línea</PrimaryButton>
        ) : selected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {selected.origin_label} → {selected.dest_label}
            </p>
            <p className="text-sm font-semibold text-ink">
              Banda {formatMoney(Number(selected.fare_min))} –{" "}
              {formatMoney(Number(selected.fare_max))} · oferta pasajero{" "}
              {formatMoney(Number(selected.offered_fare))}
            </p>
            <Field
              label="Tu contraoferta (S/)"
              type="number"
              step="0.5"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
            />
            <Field
              label="ETA (min)"
              type="number"
              value={etaMin}
              onChange={(e) => setEtaMin(Number(e.target.value))}
            />
            <Field
              label="Mensaje"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Voy en 5 min, auto gris"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <PrimaryButton disabled={busy} onClick={sendBid}>
              {busy ? "Enviando…" : "Enviar oferta"}
            </PrimaryButton>
            <GhostButton className="w-full" onClick={() => setSelected(null)}>
              Cancelar
            </GhostButton>
          </div>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {rides.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                No hay pedidos abiertos cerca. Mantente en línea.
              </li>
            ) : (
              rides.map((ride) => (
                <li key={ride.id}>
                  <button
                    type="button"
                    onClick={() => openBid(ride)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-line bg-bg px-3 py-3 text-left"
                  >
                    <div>
                      <p className="font-bold text-ink">
                        {formatMoney(Number(ride.offered_fare))}
                      </p>
                      <p className="text-xs text-muted">
                        {ride.origin_label} → {ride.dest_label}
                      </p>
                      <p className="text-xs text-muted">
                        {formatKm(ride.distance_m)} ·{" "}
                        {formatDuration(ride.duration_s)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      Ofertar
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </Sheet>
    </main>
  );
}
