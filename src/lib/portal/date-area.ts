import type { Area } from "@/data/onboarding/types";
import { fill } from "@/lib/format";
import { distanceKm, nearestArea } from "@/lib/onboarding/area-search";

/**
 * The area one date is planned around (rule 55): an area centre from the starter list, or a device
 * position rounded to 0.01°. Kept in the date-plan draft only; it never changes the profile location.
 */
export type DateArea = { label: string; lat: number; lng: number };

/** Places further than this from the chosen area centre aren't suggested for it. */
export const AREA_RADIUS_KM = 15;

const round = (value: number) => Math.round(value * 100) / 100;

export const toDateArea = (area: Area): DateArea => ({ label: area.label, lat: area.center[0], lng: area.center[1] });

/** A device position → the starter area it falls in, else the rounded position under `nearLabel`. */
export function areaFromPosition(latitude: number, longitude: number, nearLabel: string): DateArea {
  const near = nearestArea(latitude, longitude);
  return near ? toDateArea(near) : { label: nearLabel, lat: round(latitude), lng: round(longitude) };
}

/** A stored area, validated on read; anything else is null. */
export function validArea(value: unknown): DateArea | null {
  if (typeof value !== "object" || value === null) return null;
  const { label, lat, lng } = value as Record<string, unknown>;
  if (typeof label !== "string" || !label.trim() || typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: label.slice(0, 120), lat, lng };
}

type Positioned = { lat: number; lng: number } | null | undefined;

/**
 * Without an area: every item, in order. With one: only items within `radiusKm` of its centre,
 * nearest first, each with its distance (km, one decimal).
 */
export function rankByArea<T>(items: T[], position: (item: T) => Positioned, area: DateArea | null, radiusKm = AREA_RADIUS_KM): { item: T; km: number | null }[] {
  if (!area) return items.map((item) => ({ item, km: null }));
  return items
    .flatMap((item) => {
      const at = position(item);
      if (!at) return [];
      const km = Math.round(distanceKm([area.lat, area.lng], [at.lat, at.lng]) * 10) / 10;
      return km <= radiusKm ? [{ item, km }] : [];
    })
    .sort((a, b) => a.km - b.km);
}

/** "2.1 km from Banani, Dhaka". */
export const areaDistance = (template: string, km: number, area: DateArea) => fill(template, { km: km.toFixed(1), area: area.label });
