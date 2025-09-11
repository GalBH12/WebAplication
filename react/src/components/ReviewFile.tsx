import { useState } from "react";
import { ReviewForm } from "./ReviewForm";
import { addReview, deleteReview } from "../lib/reviews";
import type { LocationItem } from "../types/location";

export function ReviewSection({
  place,
  user,
  setPlaces,
}: {
  place: LocationItem;
  user: any;
  setPlaces: React.Dispatch<React.SetStateAction<LocationItem[]>>;
}) {
  // ===== Editing state for reviews =====
  const [editingReview, setEditingReview] = useState<{ reviewIndex: number; text: string } | null>(null);

  // ===== Handle save of edited review =====
  const handleSaveEdit = async () => {
    if (!editingReview) return;
    try {
      // You need to implement updateReview in your backend/lib
      await addReview(place.id, {
        user: user.username,
        text: editingReview.text
      });
      setPlaces(prev =>
        prev.map(p =>
          p.id === place.id
            ? {
                ...p,
                reviews: (p.reviews ?? []).map((r, i) =>
                  i === editingReview.reviewIndex
                    ? { ...r, text: editingReview.text }
                    : r
                ),
              }
            : p
        )
      );
      setEditingReview(null);
    } catch {
      alert("Failed to edit review.");
    }
  };

  return (
    <div className="reviews-section" style={{ marginTop: 8 }}>
      <h6>Reviews:</h6>
      {place.reviews && place.reviews.length > 0 ? (
        <ul
          className="reviews-list"
          style={{
            maxHeight: "12em",
            overflowY: "auto",
            paddingRight: 8,
            margin: 0,
          }}
        >
          {place.reviews.map((review, index) => {
            const isAuthor = user?.username === review.user;
            const isAdmin = user?.role === "admin";
            const isEditing = editingReview?.reviewIndex === index;

            return (
              <li key={index} className="review-item" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <strong>{review.user}</strong>:&nbsp;
                  <em style={{ marginLeft: 6, fontSize: 11, color: "#888" }}>
                    ({new Date(review.createdAt).toLocaleDateString()})
                  </em>
                  {isAuthor && !isEditing && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditingReview({ reviewIndex: index, text: review.text });
                      }}
                      style={{
                        marginLeft: 8,
                        fontSize: 14,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#555",
                        padding: 0,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          await deleteReview(place.id, index);
                          setPlaces(prev =>
                            prev.map(p =>
                              p.id === place.id
                                ? {
                                    ...p,
                                    reviews: (p.reviews ?? []).filter((_, i) => i !== index),
                                  }
                                : p
                            )
                          );
                        } catch {
                          alert("Failed to delete review.");
                        }
                      }}
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "red",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div style={{ marginLeft: 16 }}>
                    <textarea
                      value={editingReview.text}
                      onChange={e =>
                        setEditingReview({ reviewIndex: index, text: e.target.value })
                      }
                      rows={2}
                      style={{ width: "100%" }}
                    />
                    <button onClick={handleSaveEdit} style={{ marginRight: 8 }}>
                      Save
                    </button>
                    <button onClick={() => setEditingReview(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span style={{ display: "block", whiteSpace: "pre-line", marginLeft: 16 }}>{review.text}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div>No reviews yet.</div>
      )}
      {user ? (
        <ReviewForm
          user={user.username}
          onAdd={async (newReview) => {
            try {
              await addReview(place.id, {
                user: newReview.user,
                text: newReview.text,
              });
            } catch (err) {
              alert("Failed to add review.");
              return;
            }
            setPlaces((prevPlaces) =>
              prevPlaces.map((p) =>
                p.id === place.id
                  ? {
                      ...p,
                      reviews: [
                        ...(p.reviews || []),
                        { ...newReview, createdAt: new Date(newReview.createdAt).toISOString() }
                      ]
                    }
                  : p
              )
            );
          }}
        />
      ) : null}
    </div>
  );
}