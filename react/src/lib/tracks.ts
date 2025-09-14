// lib/tracks.ts
import { api } from "./api";

/** ===== Types ===== */

/** Simple latitude/longitude tuple */
export type LatLng = [number, number];

/**
 * Track entity as returned/used by the client.
 * Note: `reviews` is currently typed as never[] here (matches your code).
 */
export interface Track {
  reviews: never[];                 // reviews array placeholder (as in your code)
  _id: string;                      // track id
  name: string;                     // track name
  description?: string;             // optional description
  points: [number, number][];       // polyline points (lat, lng)
  owner?: string | { _id: string }; // owner id or object with _id
  createdAt?: string;               // ISO date
  updatedAt?: string;               // ISO date
  /** Absolute URL returned by server (e.g., /api/tracks/:id/picture) */
  image?: string;                   // absolute image URL (set only if server provides)
}

/** Payload for creating a track via JSON */
export type CreateTrackJson = {
  name: string;
  description?: string;
  points: [number, number][];
  /** data URL string like "data:image/png;base64,..." */
  image?: string;
};

/** Base path for tracks API */
const TRACKS_BASE = "/api/tracks";

/**
 * Infer API origin from axios baseURL (e.g. http://localhost:4000)
 * If baseURL is empty (using Vite dev proxy), API_ORIGIN becomes "".
 */
const API_ORIGIN =
  (typeof api?.defaults?.baseURL === "string"
    ? api.defaults.baseURL.replace(/\/$/, "")
    : "") || "";

/**
 * Ensure path becomes absolute URL against API_ORIGIN.
 * If already absolute (http/https), return as-is.
 */
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
    out.image = toAbsoluteUrl(t.image); // convert to absolute URL when needed
  } else {
    delete (out as any).image;          // ensure undefined if no image
  }
  return out;
}

/** ======================== Read ======================= */

/** Fetch all tracks */
export async function getTracks(): Promise<Track[]> {
  const { data } = await api.get(TRACKS_BASE);
  return (Array.isArray(data) ? data : []).map(normalizeTrack);
}

/** Fetch a single track by id */
export async function getTrack(id: string): Promise<Track> {
  const { data } = await api.get(`${TRACKS_BASE}/${id}`);
  return normalizeTrack(data);
}

/** ======================== Create (JSON, Solution #2) ======================= */

/**
 * Create a new track (JSON payload).
 * Accepts data URL for `image` (if provided).
 */
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

/**
 * Update an existing track.
 * - `image`: provide a data URL string to replace picture
 * - `imageClear`: set true to remove existing picture
 */
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

/**
 * Delete a track by id.
 * Server may return `{ ok: true }` or the deleted Track object.
 */
export async function deleteTrack(id: string): Promise<{ ok: true } | Track | unknown> {
  const { data } = await api.delete(`${TRACKS_BASE}/${id}`);
  return data && (data as any)._id ? normalizeTrack(data) : data;
}
