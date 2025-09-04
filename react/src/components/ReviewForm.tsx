import { useState } from "react";

export function ReviewForm({
    onAdd,
    user,
  }: {
    onAdd: (review: { user: string; text: string; createdAt: number }) => void;
    user: string;
  }) {
    const [text, setText] = useState("");
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) return;
      onAdd({ user, text: text.trim(), createdAt: Date.now() });
      setText("");
    };
    return (
      <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a review…"
          style={{ width: "80%" }}
        />
        <button type="submit" style={{ marginLeft: 4 }}>
          Post
        </button>
      </form>
    );
  }