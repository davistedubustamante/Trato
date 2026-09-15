"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RideMap } from "@/components/RideMap";
import { Sheet } from "@/components/ui";
import { formatMoney } from "@/lib/fare";
import { DEFAULT_CENTER, type LatLng } from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";

type SharedTrip = {
  token: string;
  trip_id: string;
  status: string;
  agreed_fare: number;
  driver_lat: number | null;
  driver_lng: number | null;
  origin_label: string;
  dest_label: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
  driver_name: string | null;
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [row, setRow] = useState<SharedTrip | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error: err } = await supabase
        .from("shared_trip_public")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!alive) return;
      if (err) {
        setError(err.message);
        return;
      }
      setRow((data as SharedTrip) ?? null);
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [supabase, token]);

  if (error) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center text-danger">
        {error}
      </main>
    );
  }

  if (!row) {
    return (
      <main className="grid min-h-dvh place-items-center text-muted">
        Buscando viaje compartido…
      </main>
    );
  }

  const origin: LatLng = { lat: row.origin_lat, lng: row.origin_lng };
  const destination: LatLng = { lat: row.dest_lat, lng: row.dest_lng };
  const driver: LatLng | null =
    row.driver_lat != null && row.driver_lng != null
      ? { lat: row.driver_lat, lng: row.driver_lng }
      : null;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      <RideMap
        center={origin ?? DEFAULT_CENTER}
        origin={origin}
        destination={destination}
        driver={driver}
      />
      <Sheet
        title="Viaje en vivo"
        subtitle={`${row.origin_label} → ${row.dest_label}`}
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Estado</dt>
            <dd className="font-semibold text-ink">{row.status}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Tarifa acordada</dt>
            <dd className="font-semibold text-ink">
              {formatMoney(Number(row.agreed_fare))}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Conductor</dt>
            <dd className="font-semibold text-ink">
              {row.driver_name ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Vehículo</dt>
            <dd className="text-right font-semibold text-ink">
              {[row.vehicle_color, row.vehicle_make, row.vehicle_model]
                .filter(Boolean)
                .join(" ") || "—"}
              {row.vehicle_plate ? ` · ${row.vehicle_plate}` : ""}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          Vista pública de seguridad · Trato
        </p>
      </Sheet>
    </main>
  );
}
