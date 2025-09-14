import { api } from "./api";

export async function addReview(trackId: string, review: { user: string; text: string }) {
  const res = await api.post(`/api/tracks/${trackId}/reviews`, review);
  return res.data;
}

export async function editReview(trackId: string, reviewIndex: number, text: string) {
  const res = await api.patch(`/api/tracks/${trackId}/reviews/${reviewIndex}`, { text });
  return res.data;
}

export async function deleteReview(trackId: string, reviewIndex: number) {
  const res = await api.delete(`/api/tracks/${trackId}/reviews/${reviewIndex}`);
  return res.data;
}
