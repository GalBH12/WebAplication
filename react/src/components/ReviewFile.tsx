import { useState } from "react";
import { ReviewForm } from "./ReviewForm";
import { addReview, deleteReview } from "../lib/reviews";
import type { LocationItem } from "../types/location";

/**
 * ReviewSection
 *
 * - Displays reviews for a given location/place.
 * - Allows:
 *   • Users to add a new review (via ReviewForm).
 *   • Authors to edit their own reviews (edit UI not yet wired in here).
 *   • Admins to delete any review.
 *
 * @param place     current place item (with reviews array)
 * @param user      currently logged-in user (can be null/any type)
 * @param setPlaces state setter for updating the list of places with reviews
 */
export function ReviewSection({
  place,
  user,
  setPlaces,
}: {
  place: LocationItem;                                // the location object with reviews
  user: any;                                          // current user info (username, role)
  setPlaces: React.Dispatch<React.SetStateAction<LocationItem[]>>; // setter to update places
}) {
  // Tracks which review is being edited (by index + text)
  // Currently unused in this snippet, but ready for an edit feature
  const [, setEditingReview] = useState<{ reviewIndex: number; text: string } | null>(null);

  return (
    <div className="reviews-section" style={{ marginTop: 8 }}>
      <h6>Reviews:</h6>

      {/* If there are reviews, render them in a scrollable list */}
      {place.reviews && place.reviews.length > 0 ? (
        <ul
          className="reviews-list"
          style={{
            maxHeight: "12em",  // Limit visible height (approx 6 reviews)
            overflowY: "auto",  // Scroll if overflow
            paddingRight: 8,
            margin: 0,
          }}
        >
          {place.reviews.map((review, index) => {
            // Check permissions
            const isAuthor = user?.username === review.user;
            const isAdmin = user?.role === "admin";

            return (
              <li key={index} className="review-item" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Reviewer name */}
                  <strong>{review.user}</strong>:&nbsp;
                  {/* Date of review */}
                  <em style={{ marginLeft: 6, fontSize: 11, color: "#888" }}>
                    ({new Date(review.createdAt).toLocaleDateString()})
                  </em>

                  {/* Edit button (visible if current user is the author) */}
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

                  {/* Delete button (visible if current user is an admin) */}
                  {isAdmin && (
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          // Call API to delete the review
                          await deleteReview(place.id, index);
                          // Update local state to remove the review
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

                {/* Review text body */}
                <span
                  style={{ display: "block", whiteSpace: "pre-line", marginLeft: 16 }}
                >
                  {review.text}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div>No reviews yet.</div>
      )}

      {/* If user is logged in, show the form to add a new review */}
      {user ? (
        <ReviewForm
          user={user.username}
          onAdd={async (newReview) => {
            try {
              // Send review to backend
              await addReview(place.id, {
                user: newReview.user,
                text: newReview.text,
              });
            } catch (err) {
              alert("Failed to add review.");
              return;
            }

            // Update local state with the new review
            setPlaces((prevPlaces) =>
              prevPlaces.map((p) =>
                p.id === place.id
                  ? {
                      ...p,
                      reviews: [
                        ...(p.reviews || []),
                        {
                          ...newReview,
                          // Normalize date string to ISO format
                          createdAt: new Date(newReview.createdAt).toISOString()
                        }
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
