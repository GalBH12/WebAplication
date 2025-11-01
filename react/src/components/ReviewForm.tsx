import { useState } from "react";

/**
 * ReviewForm
 *
 * - A simple form to submit a new review.
 * - Controlled input for the review text.
 * - Calls the `onAdd` callback with the current user, text, and timestamp.
 *
 * @param onAdd callback invoked when submitting a review
 * @param user  username of the review author
 */
export function ReviewForm({
  onAdd,
  user,
}: {
  onAdd: (review: { user: string; text: string; createdAt: number }) => void; // callback to add review
  user: string;                                                              // current username
}) {
  // Controlled state for the input text
  const [text, setText] = useState("");

  /**
   * Handles form submission:
   * - Prevents default page reload
   * - Ignores empty input
   * - Calls parent `onAdd` with user + text + timestamp
   * - Clears input afterwards
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return; // ignore empty strings
    onAdd({ user, text: text.trim(), createdAt: Date.now() });
    setText(""); // reset input field
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
      {/* Input field for review text */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="רשום תגובה חדשה..."
        style={{ width: "80%" }}
      />
      {/* Submit button */}
      <button type="submit" style={{ marginLeft: 4 }}>
        שלח
      </button>
    </form>
  );
}
