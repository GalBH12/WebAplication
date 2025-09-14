import { api } from "./api";

/**
 * Add a new review to a track.
 *
 * @param trackId track identifier
 * @param review  object with user + text
 * @returns server response (new review list or status)
 */
export async function addReview(trackId: string, review: { user: string; text: string }) {
  const res = await api.post(`/api/tracks/${trackId}/reviews`, review);
  return res.data;
}

/**
 * Edit an existing review on a track.
 *
 * @param trackId     track identifier
 * @param reviewIndex index of the review in the array
 * @param text        new review text
 * @returns server response (updated review list or status)
 */
export async function editReview(trackId: string, reviewIndex: number, text: string) {
  const res = await api.patch(`/api/tracks/${trackId}/reviews/${reviewIndex}`, { text });
  return res.data;
}

/**
 * Delete a review from a track.
 *
 * @param trackId     track identifier
 * @param reviewIndex index of the review in the array
 * @returns server response (updated review list or status)
 */
export async function deleteReview(trackId: string, reviewIndex: number) {
  const res = await api.delete(`/api/tracks/${trackId}/reviews/${reviewIndex}`);
  return res.data;
}