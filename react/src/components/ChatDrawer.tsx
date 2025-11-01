import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client";
import "../style/chatdrawer.css";
import { useAuth } from "../pages/AuthContext";

/** Single chat message shape as used by the client/server */
type Message = { fromEmail: string; fromName?: string; text: string; to?: string };

/** Props for opening/closing the drawer */
interface ChatDrawerProps {
  open: boolean;       // whether the drawer is visible
  onClose: () => void; // callback to close the drawer
}

/**
 * ChatDrawerContent
 *
 * - Opens a Socket.IO connection when the drawer is open.
 * - Authenticates (if a token exists) and receives presence + messages.
 * - Sends messages (general or private by `to`).
 * - Auto-scrolls to the latest message.
 * - Cleans up the socket on unmount/close.
 */
const ChatDrawerContent: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  const { user } = useAuth(); // current logged-in user (for UI labels)

  // ===== Local state =====
  const [online, setOnline] = useState<string[]>([]);   // online users list (labels)
  const [messages, setMessages] = useState<Message[]>([]); // message history in session
  const [to, setTo] = useState<string>("");             // recipient label ("" = general)
  const [text, setText] = useState("");                 // composer text
  const [authed, setAuthed] = useState(false);          // has socket been authenticated?

  // ===== Refs =====
  const socketRef = useRef<any>(null);                  // holds active socket instance
  const bottomRef = useRef<HTMLDivElement>(null);       // anchor for auto-scroll

  // ===== Environment helpers =====
  // token saved by your app after login (if present)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // server origin: replace current port with :4000 (dev) or fallback to localhost
  const origin =
    typeof window !== "undefined"
      ? window.location.origin.replace(/:\d+$/, ":4000")
      : "http://localhost:4000";

  // Open socket connection only while drawer is open
  useEffect(() => {
    if (!open) return;

    // Create client socket (using only "websocket" as requested)
    const socket = io(origin, { transports: ["websocket"] });
    socketRef.current = socket;

    // When connected, try to authenticate with token
    socket.on("connect", () => {
      if (token) socket.emit("auth", token);
    });

    // Presence list from server -> update UI and mark as authed
    socket.on("presence", (list: string[]) => {
      setOnline(list);
      setAuthed(true);
    });

    // Incoming message -> append to history
    socket.on("chat_message", (msg: Message) => {
      setMessages((m) => [...m, msg]);
    });

    // Optional auth error handler (no UI shown here)
    socket.on("auth_error", () => {});

    // Cleanup on unmount/close: disconnect and reset flags
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setAuthed(false);
    };
  }, [open, token, origin]);

  // Auto-scroll to the newest message (and when the drawer opens)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  /**
   * Send current composer text.
   * - Requires successful auth and non-empty text
   * - Sends general (no `to`) or private (`to` set) message
   */
  const send = () => {
    if (!authed) return;                 // don't send before auth
    const t = text.trim();
    if (!t || !socketRef.current) return; // ignore empty / no socket
    socketRef.current.emit("chat_message", { to: to || undefined, text: t });
    setText("");                         // clear composer on success
  };

  // If drawer is closed, render nothing
  if (!open) return null;

  // Build a self label for UI (name → username → email → "")
  const selfLabel =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.email ||
    "";

  return (
    // Overlay that closes when clicked (outside panel)
    <div className="chatdrawer-overlay" onClick={onClose}>
      {/* Drawer panel; stop propagation so outside click closes, inside doesn't */}
      <div
        className="chatdrawer-panel chatdrawer-panel--right"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chat panel"
        dir="rtl"
      >
        {/* Header with title and close button */}
        <div
          className="chatdrawer-header"
          style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 8px" }}
        >
          {/* Close button: same content, positioned at the left edge */}
          <button
            className="close"
            onClick={onClose}
            aria-label="סגור"
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 24,
              lineHeight: 1,
              padding: 6
            }}
          >
            ✕
          </button>
          <strong style={{ flex: 1, textAlign: "center" }}>צ'אט</strong>
        </div>

        {/* Main body: users list + messages area */}
        <div className="chatdrawer-body">
          {/* Online users / recipient picker */}
          <aside className="users">
            <div className="users-title">מחוברים</div>

            {/* General (broadcast to all) */}
            <button className={!to ? "user active" : "user"} onClick={() => setTo("")}>
              כללי (לכולם)
            </button>

            {/* List online users as private recipients */}
            {online.map((label) => (
              <button
                key={label}
                className={to === label ? "user active" : "user"}
                onClick={() => setTo(label)}
                disabled={label === selfLabel}             // can't DM yourself
                title={label === selfLabel ? "אני" : ""}   // small hint (Hebrew)
              >
                {label}{label === selfLabel ? " (אני)" : ""}
              </button>
            ))}
          </aside>

          {/* Messages stream and composer */}
          <main className="messages">
            {/* Scrollable messages area */}
            <div className="stream">
              {messages.map((m, i) => {
                // choose display name for sender
                const who = m.fromName || m.fromEmail || "לא ידוע";
                // basic "is this me?" heuristic for styling
                const isMe = who === selfLabel || m.fromEmail === selfLabel;

                return (
                  <div key={i} className={isMe ? "msg me" : "msg"}>
                    <div className="meta">
                      {who}
                      {m.to ? ` → ${m.to}` : ""}
                    </div>
                    <div className="bubble">{m.text}</div>
                  </div>
                );
              })}
              {/* Anchor element to scroll to bottom */}
              <div ref={bottomRef} />
            </div>

            {/* Message composer */}
            <div className="composer">
              <input
                placeholder={to ? "הודעה פרטית..." : "רשום הודעה..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)} // quick send on Enter
              />
              <button onClick={send} className="send" disabled={!authed || !text.trim()}>
                שלח
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

/**
 * ChatDrawer
 *
 * Portals the content to document.body so it overlays the app cleanly.
 * Includes SSR guard (returns null when `document` is undefined).
 */
const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(
    <ChatDrawerContent open={open} onClose={onClose} />,
    document.body
  );
};

export default ChatDrawer;
