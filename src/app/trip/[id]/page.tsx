"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RideMap } from "@/components/RideMap";
import { GhostButton, PrimaryButton, Sheet } from "@/components/ui";
import { formatMoney } from "@/lib/fare";
import { DEFAULT_CENTER, type LatLng } from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";
import type { RideRequest, Trip } from "@/types/trato";

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [role, setRole] = useState<"passenger" | "driver" | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      const { data: tripRow } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();
      if (!alive || !tripRow) return;
      setTrip(tripRow as Trip);
      setRole(
        tripRow.passenger_id === auth.user.id
          ? "passenger"
          : tripRow.driver_id === auth.user.id
            ? "driver"
            : null,
      );
      const { data: rideRow } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("id", tripRow.ride_id)
        .single();
      if (rideRow) setRide(rideRow as RideRequest);
    })();
    return () => {
      alive = false;
    };
  }, [id, router, supabase]);

  useEffect(() => {
    if (!trip) return;
    const channel = supabase
      .channel(`trip-${trip.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
          filter: `id=eq.${trip.id}`,
        },
        (payload) => setTrip(payload.new as Trip),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, trip]);

  useEffect(() => {
    if (!trip || role !== "driver") return;
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      await supabase
        .from("trips")
        .update({ driver_lat: lat, driver_lng: lng })
        .eq("id", trip.id);
      await supabase
        .from("driver_profiles")
        .update({
          last_lat: lat,
          last_lng: lng,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", trip.driver_id);
    });
    return () => navigator.geolocation.clearWatch(watch);
  }, [role, supabase, trip]);

  async function advance(status: Trip["status"]) {
    if (!trip) return;
    setBusy(true);
    const patch: Partial<Trip> = { status };
    if (status === "ongoing") patch.started_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error: err } = await supabase
      .from("trips")
      .update(patch)
      .eq("id", trip.id);
    setBusy(false);
    if (err) setError(err.message);
  }

  async function createShare() {
    if (!trip) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data, error: err } = await supabase
      .from("trip_shares")
      .insert({ trip_id: trip.id, created_by: auth.user.id })
      .select("token")
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    const url = `${window.location.origin}/share/${data.token}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }

  async function submitRating() {
    if (!trip || !role) return;
    const toUserId =
      role === "passenger" ? trip.driver_id : trip.passenger_id;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setBusy(true);
    const { error: err } = await supabase.from("ratings").upsert(
      {
        trip_id: trip.id,
        from_user_id: auth.user.id,
        to_user_id: toUserId,
        stars,
      },
      { onConflict: "trip_id,from_user_id" },
    );
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace(role === "driver" ? "/driver" : "/passenger");
  }

  const origin: LatLng | null = ride
    ? { lat: ride.origin_lat, lng: ride.origin_lng }
    : null;
  const destination: LatLng | null = ride
    ? { lat: ride.dest_lat, lng: ride.dest_lng }
    : null;
  const driverPos: LatLng | null =
    trip?.driver_lat != null && trip.driver_lng != null
      ? { lat: trip.driver_lat, lng: trip.driver_lng }
      : null;

  if (!trip || !ride) {
    return (
      <main className="grid min-h-dvh place-items-center text-muted">
        Cargando viaje…
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      <RideMap
        center={origin ?? DEFAULT_CENTER}
        origin={origin}
        destination={destination}
        driver={driverPos}
      />

      <Sheet
        title={
          trip.status === "completed"
            ? "Viaje terminado"
            : `Viaje · ${formatMoney(Number(trip.agreed_fare))}`
        }
        subtitle={`${ride.origin_label} → ${ride.dest_label}`}
      >
        <p className="mb-3 text-sm text-muted">
          Estado: <strong className="text-ink">{trip.status}</strong>
        </p>

        {trip.status !== "completed" ? (
          <div className="space-y-2">
            <GhostButton className="w-full" onClick={createShare}>
              {shareUrl ? "Link copiado ✓" : "Compartir viaje en vivo"}
            </GhostButton>
            {shareUrl ? (
              <p className="break-all text-xs text-primary">{shareUrl}</p>
            ) : null}

            {role === "driver" ? (
              <>
                {trip.status === "assigned" ? (
                  <PrimaryButton
                    disabled={busy}
                    onClick={() => advance("arriving")}
                  >
                    Voy en camino
                  </PrimaryButton>
                ) : null}
                {trip.status === "arriving" ? (
                  <PrimaryButton
                    disabled={busy}
                    onClick={() => advance("ongoing")}
                  >
                    Pasajero a bordo
                  </PrimaryButton>
                ) : null}
                {trip.status === "ongoing" ? (
                  <PrimaryButton
                    disabled={busy}
                    onClick={() => advance("completed")}
                  >
                    Finalizar viaje
                  </PrimaryButton>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">
                Sigue al conductor en el mapa. Comparte el link si quieres
                supervisión.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">¿Cómo estuvo el trato?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className={`h-10 w-10 rounded-full text-sm font-bold ${
                    stars >= n
                      ? "bg-accent text-accent-ink"
                      : "border border-line bg-bg text-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <PrimaryButton disabled={busy} onClick={submitRating}>
              Enviar y volver
            </PrimaryButton>
          </div>
        )}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Sheet>
    </main>
  );
}
