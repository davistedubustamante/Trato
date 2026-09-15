import { estimateDurationSeconds, haversineMeters, type LatLng } from "./geo";

/** PEN-ish urban base; tune later per city. */
const BASE = 4.5;
const PER_KM = 1.8;
const PER_MIN = 0.25;

export type FareBand = {
  distanceM: number;
  durationS: number;
  suggested: number;
  min: number;
  max: number;
};

function roundFare(n: number): number {
  return Math.round(n * 2) / 2;
}

export function computeFareBand(origin: LatLng, dest: LatLng): FareBand {
  const distanceM = Math.round(haversineMeters(origin, dest));
  const durationS = estimateDurationSeconds(distanceM);
  const raw =
    BASE + (distanceM / 1000) * PER_KM + (durationS / 60) * PER_MIN;
  const suggested = Math.max(6, roundFare(raw));
  const min = Math.max(5, roundFare(suggested * 0.82));
  const max = roundFare(suggested * 1.28);
  return { distanceM, durationS, suggested, min, max };
}

export function formatMoney(amount: number, currency = "S/"): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function clampFare(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, roundFare(value)));
}
