export async function addReview(trackId: string, review: { user: string; text: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/tracks/${trackId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(review),
  });
  if (!res.ok) throw new Error("Failed to add review");
  return res.json();
}

export async function editReview(trackId: string, reviewIndex: number, text: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/tracks/${trackId}/reviews/${reviewIndex}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to edit review");
  return res.json();
}

export async function deleteReview(trackId: string, reviewIndex: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/tracks/${trackId}/reviews/${reviewIndex}`, {
    method: "DELETE",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error("Failed to delete review");
  return res.json();
}