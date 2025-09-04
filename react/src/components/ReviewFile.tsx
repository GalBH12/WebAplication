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
  const [, setEditingReview] = useState<{ reviewIndex: number; text: string } | null>(null);

  return (
    <div className="reviews-section" style={{ marginTop: 8 }}>
      <h6>Reviews:</h6>
      {place.reviews && place.reviews.length > 0 ? (
        <ul
          className="reviews-list"
          style={{
            maxHeight: "12em", // Adjust as needed for 6 reviews
            overflowY: "auto",
            paddingRight: 8,
            margin: 0,
          }}
        >
          {place.reviews.map((review, index) => {
            const isAuthor = user?.username === review.user;
            const isAdmin = user?.role === "admin";

            return (
              <li key={index} className="review-item" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <strong>{review.user}</strong>:&nbsp;
                  <em style={{ marginLeft: 6, fontSize: 11, color: "#888" }}>
                    ({new Date(review.createdAt).toLocaleDateString()})
                  </em>
                  {isAuthor && (
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
                      Delete
                    </button>
                  )}
                </div>
                <span style={{ display: "block", whiteSpace: "pre-line", marginLeft: 16 }}>{review.text}</span>
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