export type LatLng = { lat: number; lng: number };

const R = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough urban speed ~22 km/h + 2 min fixed. */
export function estimateDurationSeconds(distanceM: number): number {
  const hours = distanceM / 1000 / 22;
  return Math.round(hours * 3600 + 120);
}

export function formatKm(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} min`;
}

/** Default demo pin: Miraflores, Lima. */
export const DEFAULT_CENTER: LatLng = { lat: -12.1211, lng: -77.0297 };
