// Lightweight client helpers to query the canonical index JSON
import { invalidateLocalityCache } from './locality';

export interface LocalityIndexRow {
  pincode: string;
  locality_name: string;
  ward_number?: number;
  ward_name?: string;
  councillor_name?: string;
  councillor_party?: string;
  reservation_status?: string;
  ac_number?: number;
  ac_name?: string;
  mla_name?: string;
  mla_party?: string;
  mp_constituency?: string;
  mp_name?: string;
  mp_party?: string;
}

let indexCache: LocalityIndexRow[] | null = null;

export async function loadLocalitiesIndex(force = false): Promise<LocalityIndexRow[]> {
  if (force) {
    indexCache = null;
    invalidateLocalityCache();
  }
  if (indexCache) return indexCache;
  // Use the app base URL so this works on subpaths (Vite/Vercel base)
  const base = (import.meta as any)?.env?.BASE_URL || '/';
  const url = base.replace(/\/$/, '/') + 'localities_index.json';
  const res = await fetch(url, { cache: 'no-store' as RequestCache });
  if (!res.ok) {
    throw new Error(`Failed to load localities_index.json (${res.status} ${res.statusText}) from ${url}`);
  }
  indexCache = (await res.json()) as LocalityIndexRow[];
  return indexCache;
}

export async function getLocalitiesByPincode(pincode: string): Promise<string[]> {
  const idx = await loadLocalitiesIndex();
  const p = pincode.trim();
  return Array.from(new Set(idx.filter(r => r.pincode === p).map(r => r.locality_name))).sort();
}

export async function getLocalityDetailsFromIndex(pincode: string, localityName: string): Promise<LocalityIndexRow | null> {
  const idx = await loadLocalitiesIndex();
  const p = pincode.trim();
  const n = localityName.trim().toLowerCase();
  return idx.find(r => r.pincode === p && r.locality_name.toLowerCase() === n) || null;
}


