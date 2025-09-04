// lib/tracks.ts
import { api } from "./api";

/** ===== Types ===== */
export type LatLng = [number, number];

export interface Track {
  reviews: never[];
  _id: string;
  name: string;
  description?: string;
  points: [number, number][];
  owner?: string | { _id: string };
  createdAt?: string;
  updatedAt?: string;
  /** Absolute URL returned by server (e.g., /api/tracks/:id/picture) */
  image?: string;
}

export type CreateTrackJson = {
  name: string;
  description?: string;
  points: [number, number][];
  /** data URL string like "data:image/png;base64,..." */
  image?: string;
};

const TRACKS_BASE = "/api/tracks";

/** Infer API origin from axios baseURL (e.g. http://localhost:4000) */
const API_ORIGIN =
  (typeof api?.defaults?.baseURL === "string"
    ? api.defaults.baseURL.replace(/\/$/, "")
    : "") || "";

/** Ensure path becomes absolute URL against API_ORIGIN */
function toAbsoluteUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
}

/**
 * Normalize server track:
 * - Use server-provided `image` only (server returns it iff image data really exists).
 * - Do NOT synthesize /picture URLs on the client; avoids 404 when there is no data.
 */
function normalizeTrack(t: any): Track {
  const out = { ...t } as Track;
  if (typeof t?.image === "string" && t.image.length > 0) {
    out.image = toAbsoluteUrl(t.image);
  } else {
    delete (out as any).image;
  }
  return out;
}

/** ======================== Read ======================= */
export async function getTracks(): Promise<Track[]> {
  const { data } = await api.get(TRACKS_BASE);
  return (Array.isArray(data) ? data : []).map(normalizeTrack);
}

export async function getTrack(id: string): Promise<Track> {
  const { data } = await api.get(`${TRACKS_BASE}/${id}`);
  return normalizeTrack(data);
}

/** ======================== Create (JSON, Solution #2) ======================= */
export async function createTrack(payload: CreateTrackJson): Promise<Track> {
  const { data } = await api.post(TRACKS_BASE, {
    name: payload.name,
    description: payload.description,
    points: payload.points,
    image: payload.image || undefined, // data URL
  });
  return normalizeTrack(data);
}

/** ======================== Update (JSON only) ======================= */
export async function updateTrack(
  id: string,
  payload: {
    name?: string;
    description?: string;
    points?: [number, number][];
    image?: string;        // data URL string to replace
    imageClear?: boolean;  // true to remove picture
  }
): Promise<Track> {
  const body: any = {
    name: payload.name,
    description: payload.description,
    points: payload.points,
  };
  if (typeof payload.image === "string") body.image = payload.image;
  if (payload.imageClear) body.imageClear = payload.imageClear;

  const { data } = await api.put(`${TRACKS_BASE}/${id}`, body);
  return normalizeTrack(data);
}

/** ======================== Delete ======================= */
export async function deleteTrack(id: string): Promise<{ ok: true } | Track | unknown> {
  const { data } = await api.delete(`${TRACKS_BASE}/${id}`);
  return data && (data as any)._id ? normalizeTrack(data) : data;
}

// In the component file
