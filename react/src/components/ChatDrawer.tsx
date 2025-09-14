import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { io, Socket } from "socket.io-client";
import "./style/chatdrawer.css";
import { useAuth } from "../pages/AuthContext";

type Message = { fromEmail: string; fromName?: string; text: string; to?: string };

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ChatDrawerContent: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [online, setOnline] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [to, setTo] = useState<string>("");
  const [text, setText] = useState("");
  const [authed, setAuthed] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin.replace(/:\d+$/, ":4000")
      : "http://localhost:4000";

  useEffect(() => {
    if (!open) return;
    const socket = io(origin, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (token) socket.emit("auth", token);
    });

    socket.on("presence", (list: string[]) => {
      setOnline(list);
      setAuthed(true);
    });

    socket.on("chat_message", (msg: Message) => {
      setMessages((m) => [...m, msg]);
    });

    socket.on("auth_error", () => {});

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setAuthed(false);
    };
  }, [open, token, origin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    if (!authed) return;
    const t = text.trim();
    if (!t || !socketRef.current) return;
    socketRef.current.emit("chat_message", { to: to || undefined, text: t });
    setText("");
  };

  if (!open) return null;

  const selfLabel =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.email ||
    "";

  return (
    <div className="chatdrawer-overlay" onClick={onClose}>
      <div
        className="chatdrawer-panel chatdrawer-panel--right"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chat panel"
      >
        <div className="chatdrawer-header">
          <strong>Chat</strong>
          <button className="close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="chatdrawer-body">
          <aside className="users">
            <div className="users-title">Online</div>
            <button className={!to ? "user active" : "user"} onClick={() => setTo("")}>
              General (all)
            </button>
            {online.map((label) => (
              <button
                key={label}
                className={to === label ? "user active" : "user"}
                onClick={() => setTo(label)}
                disabled={label === selfLabel}
                title={label === selfLabel ? "You" : ""}
              >
                {label}{label === selfLabel ? " (me)" : ""}
              </button>
            ))}
          </aside>

          <main className="messages">
            <div className="stream">
              {messages.map((m, i) => {
                const who = m.fromName || m.fromEmail || "unknown";
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
              <div ref={bottomRef} />
            </div>

            <div className="composer">
              <input
                placeholder={to ? "Private message..." : "Type a message..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)}
              />
              <button onClick={send} className="send" disabled={!authed || !text.trim()}>
                Send
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(
    <ChatDrawerContent open={open} onClose={onClose} />,
    document.body
  );
};

export default ChatDrawer;
