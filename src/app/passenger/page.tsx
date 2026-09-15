"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RideMap } from "@/components/RideMap";
import { GhostButton, PrimaryButton, Sheet } from "@/components/ui";
import { clampFare, computeFareBand, formatMoney } from "@/lib/fare";
import {
  DEFAULT_CENTER,
  formatDuration,
  formatKm,
  type LatLng,
} from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";
import type { Bid, RideRequest } from "@/types/trato";

type Step = "pick" | "offer" | "waiting";

export default function PassengerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [pickTarget, setPickTarget] = useState<"origin" | "dest">("origin");
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [offer, setOffer] = useState(0);
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const band = useMemo(() => {
    if (!origin || !destination) return null;
    return computeFareBand(origin, destination);
  }, [origin, destination]);

  useEffect(() => {
    if (band) setOffer(band.suggested);
  }, [band]);

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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setOrigin(DEFAULT_CENTER),
          { enableHighAccuracy: true, timeout: 8000 },
        );
      } else {
        setOrigin(DEFAULT_CENTER);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, supabase]);

  const refreshBids = useCallback(
    async (rideId: string) => {
      const { data } = await supabase
        .from("bids")
        .select(
          "*, profiles:driver_id(full_name, trust_score, trips_completed)",
        )
        .eq("ride_id", rideId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      setBids((data as Bid[]) ?? []);
    },
    [supabase],
  );

  useEffect(() => {
    if (!ride) return;
    void refreshBids(ride.id);
    const channel = supabase
      .channel(`passenger-bids-${ride.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
          filter: `ride_id=eq.${ride.id}`,
        },
        () => {
          void refreshBids(ride.id);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ride, refreshBids, supabase]);

  const onMapClick = useCallback(
    (point: LatLng) => {
      if (step !== "pick") return;
      if (pickTarget === "origin") {
        setOrigin(point);
        setPickTarget("dest");
      } else {
        setDestination(point);
      }
    },
    [pickTarget, step],
  );

  async function publishRide() {
    if (!userId || !origin || !destination || !band) return;
    setBusy(true);
    setError(null);
    const offered = clampFare(offer, band.min, band.max);
    const { data, error: err } = await supabase
      .from("ride_requests")
      .insert({
        passenger_id: userId,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        origin_label: "Origen",
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        dest_label: "Destino",
        distance_m: band.distanceM,
        duration_s: band.durationS,
        suggested_fare: band.suggested,
        offered_fare: offered,
        fare_min: band.min,
        fare_max: band.max,
        status: "open",
      })
      .select("*")
      .single();
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setRide(data as RideRequest);
    setStep("waiting");
  }

  async function acceptBid(bidId: string) {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("accept_bid", {
      p_bid_id: bidId,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/trip/${data as string}`);
  }

  async function cancelRide() {
    if (!ride) return;
    await supabase
      .from("ride_requests")
      .update({ status: "cancelled" })
      .eq("id", ride.id);
    setRide(null);
    setBids([]);
    setStep("pick");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      <RideMap
        center={origin ?? DEFAULT_CENTER}
        origin={origin}
        destination={destination}
        onMapClick={onMapClick}
      />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="rounded-full bg-surface/90 px-3 py-1.5 text-sm font-extrabold text-primary shadow-sm backdrop-blur">
          Trato
        </p>
        <Link
          href="/driver"
          className="rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur"
        >
          Modo conductor
        </Link>
      </header>

      {step === "pick" ? (
        <Sheet
          title="¿A dónde vamos?"
          subtitle="Toca el mapa: primero origen, luego destino."
        >
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPickTarget("origin")}
              className={`h-10 flex-1 rounded-full text-sm font-bold ${
                pickTarget === "origin"
                  ? "bg-primary text-white"
                  : "border border-line bg-bg text-ink"
              }`}
            >
              Origen
            </button>
            <button
              type="button"
              onClick={() => setPickTarget("dest")}
              className={`h-10 flex-1 rounded-full text-sm font-bold ${
                pickTarget === "dest"
                  ? "bg-accent text-accent-ink"
                  : "border border-line bg-bg text-ink"
              }`}
            >
              Destino
            </button>
          </div>
          <div className="space-y-1 text-sm text-muted">
            <p>
              <span className="font-semibold text-ink">De:</span>{" "}
              {origin
                ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`
                : "—"}
            </p>
            <p>
              <span className="font-semibold text-ink">A:</span>{" "}
              {destination
                ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                : "—"}
            </p>
            {band ? (
              <p>
                {formatKm(band.distanceM)} · {formatDuration(band.durationS)} ·
                sugerido {formatMoney(band.suggested)}
              </p>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              {
                label: "Larcomar",
                point: { lat: -12.1318, lng: -77.0305 },
              },
              {
                label: "Parque Kennedy",
                point: { lat: -12.1219, lng: -77.0297 },
              },
              {
                label: "Óvalo Gutiérrez",
                point: { lat: -12.1116, lng: -77.0369 },
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-ink"
                onClick={() => {
                  if (pickTarget === "origin" || !origin) {
                    setOrigin(preset.point);
                    setPickTarget("dest");
                  } else {
                    setDestination(preset.point);
                  }
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <PrimaryButton
            className="mt-4"
            disabled={!origin || !destination}
            onClick={() => setStep("offer")}
          >
            Ver banda justa
          </PrimaryButton>
        </Sheet>
      ) : null}

      {step === "offer" && band ? (
        <Sheet
          title="Tu oferta"
          subtitle={`Banda justa ${formatMoney(band.min)} – ${formatMoney(band.max)}`}
        >
          <div className="mb-4 flex items-center justify-center gap-4">
            <GhostButton
              type="button"
              className="!w-12 px-0"
              onClick={() =>
                setOffer((v) => clampFare(v - 0.5, band.min, band.max))
              }
            >
              −
            </GhostButton>
            <p className="min-w-[7rem] text-center text-4xl font-extrabold tabular-nums text-ink">
              {formatMoney(offer)}
            </p>
            <GhostButton
              type="button"
              className="!w-12 px-0"
              onClick={() =>
                setOffer((v) => clampFare(v + 0.5, band.min, band.max))
              }
            >
              +
            </GhostButton>
          </div>
          {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
          <PrimaryButton disabled={busy} onClick={publishRide}>
            {busy ? "Publicando…" : "Pedir trato"}
          </PrimaryButton>
          <GhostButton className="mt-2 w-full" onClick={() => setStep("pick")}>
            Volver al mapa
          </GhostButton>
        </Sheet>
      ) : null}

      {step === "waiting" && ride ? (
        <Sheet
          title="Esperando ofertas"
          subtitle={`Tu oferta: ${formatMoney(Number(ride.offered_fare))}`}
        >
          <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto">
            {bids.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                Aún no hay contraofertas. Los conductores cercanos ya lo ven.
              </li>
            ) : (
              bids.map((bid) => (
                <li
                  key={bid.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg px-3 py-3"
                >
                  <div>
                    <p className="font-bold text-ink">
                      {formatMoney(Number(bid.amount))} · {bid.eta_min} min
                    </p>
                    <p className="text-xs text-muted">
                      {bid.profiles?.full_name ?? "Conductor"} · ★{" "}
                      {Number(bid.profiles?.trust_score ?? 5).toFixed(1)} ·{" "}
                      {bid.profiles?.trips_completed ?? 0} viajes
                    </p>
                  </div>
                  <PrimaryButton
                    className="!w-auto px-4"
                    disabled={busy}
                    onClick={() => acceptBid(bid.id)}
                  >
                    Aceptar
                  </PrimaryButton>
                </li>
              ))
            )}
          </ul>
          {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
          <GhostButton className="w-full" onClick={cancelRide}>
            Cancelar pedido
          </GhostButton>
        </Sheet>
      ) : null}
    </main>
  );
}
