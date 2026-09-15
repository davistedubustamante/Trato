"use client";

import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/geo";

type Props = {
  center: LatLng;
  origin?: LatLng | null;
  destination?: LatLng | null;
  driver?: LatLng | null;
  onMapClick?: (point: LatLng) => void;
  className?: string;
};

function pinSvg(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path fill="${color}" stroke="#fff" stroke-width="2"
      d="M14 1c-6.6 0-12 5.2-12 11.6 0 8.7 12 21.4 12 21.4S26 21.3 26 12.6C26 6.2 20.6 1 14 1z"/>
    <circle cx="14" cy="12.5" r="4.5" fill="#fff"/>
  </svg>`;
}

export function RideMap({
  center,
  origin,
  destination,
  driver,
  onMapClick,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Record<string, import("leaflet").Marker>>({});
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const LRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([center.lat, center.lng], 13);

      // OSM raster tiles — free, no API key (fair-use; fine for MVP demos)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: "abc",
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      map.on("click", (e) => {
        clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
      requestAnimationFrame(() => map.invalidateSize());
    })();

    return () => {
      cancelled = true;
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    const upsert = (
      key: string,
      point: LatLng | null | undefined,
      color: string,
    ) => {
      if (!point) {
        markersRef.current[key]?.remove();
        delete markersRef.current[key];
        return;
      }
      const icon = L.divIcon({
        className: "",
        html: pinSvg(color),
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      });
      if (!markersRef.current[key]) {
        markersRef.current[key] = L.marker([point.lat, point.lng], { icon }).addTo(
          map,
        );
      } else {
        markersRef.current[key].setLatLng([point.lat, point.lng]).setIcon(icon);
      }
    };

    upsert("origin", origin, "#1f6f66");
    upsert("destination", destination, "#c45c26");
    upsert("driver", driver, "#2f9e7a");

    const points = [origin, destination, driver].filter(Boolean) as LatLng[];
    if (points.length >= 2) {
      map.fitBounds(
        L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [72, 72], maxZoom: 14 },
      );
    } else if (origin) {
      map.panTo([origin.lat, origin.lng]);
    }
    map.invalidateSize();
  }, [origin, destination, driver]);

  return (
    <div
      ref={containerRef}
      className={className ?? "absolute inset-0 z-0 h-dvh w-full bg-[#e8eef2]"}
    />
  );
}
