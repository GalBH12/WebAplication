// react/src/components/Tracks.tsx (or your actual path)
// List + edit Tracks using JSON only (image as data URL). No multipart/FormData.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTracks, deleteTrack, updateTrack, getTrack } from "../lib/tracks";
import type { Track } from "../lib/tracks";
import { useAuth } from "../lib/auth";
import "../style/tracks.css";
import { FaWaze } from "react-icons/fa";

// Sorting options for list view
type SortBy = "name" | "created";

export default function Tracks() {
  // Auth context (used to determine owner/admin permissions)
  const auth = useAuth();
  const user = auth?.user;

  // ===== Server data =====
  // Full list of tracks fetched from backend
  const [items, setItems] = useState<Track[]>([]);

  // ===== UI state =====
  const [loading, setLoading] = useState<boolean>(true); // show spinners/disable buttons while loading
  const [error, setError] = useState<string | null>(null); // top-level fetch error

  // ===== Search / sort =====
  const [q, setQ] = useState(""); // search query
  const [sortBy, setSortBy] = useState<SortBy>("name"); // sort mode
  const navigate = useNavigate();

  // ===== Edit modal state =====
  const [editing, setEditing] = useState<Track | null>(null); // currently edited track
  const [editName, setEditName] = useState(""); // form field: name
  const [editDesc, setEditDesc] = useState(""); // form field: description

  // Image editing state (JSON only)
  // - editImagePreview: what we show in UI (existing server URL or new data URL, or null if cleared)
  // - editImageDataUrl: only set when user selected a new file (data URL string)
  // - editImageClear: mark true if user chose to remove existing image
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageDataUrl, setEditImageDataUrl] = useState<string | undefined>(undefined);
  const [editImageClear, setEditImageClear] = useState<boolean>(false);

  const [savingEdit, setSavingEdit] = useState(false); // disable save while request in-flight

  // ===== Load tracks =====
  // Fetch list of tracks from the server and put in state
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTracks();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load tracks", e);
      setError("שגיאה בטעינת המסלולים");
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount
  useEffect(() => {
    load();
  }, []);

  // ===== Derived list =====
  // Filter by search term and sort by chosen order
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = !term
      ? items
      : items.filter(
          (x) =>
            x.name.toLowerCase().includes(term) ||
            (x.description || "").toLowerCase().includes(term)
        );

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Sort by created date descending (newest first)
      list = [...list].sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
      );
    }
    return list;
  }, [items, q, sortBy]);

  // ===== Delete =====
  // Delete a track by id (owner/admin only)
  const remove = async (id?: string) => {
    if (!id) return;
    if (!confirm("להסיר מסלול זה?")) return;
    try {
      await deleteTrack(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("המחיקה נכשלה (האם אתה הבעלים ומחובר?).");
    }
  };

  // ===== Open edit modal =====
  // Open the modal with the latest server data (avoid stale info)
  const openEdit = async (t: Track) => {
    // Fetch the latest track data from the backend
    const latest = await getTrack(t._id);

    setEditing(latest);
    setEditName(latest.name);
    setEditDesc(latest.description || "");

    // Always use the latest image from the track (not stale state)
    setEditImagePreview(typeof latest.image === "string" && latest.image.length > 0 ? latest.image : null);
    setEditImageDataUrl(undefined);
    setEditImageClear(false);
  };

  // ===== File input change (read file -> data URL) =====
  // Convert selected image file into data URL for JSON upload & preview
  const onEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      // No new file picked: keep current preview (server image or null)
      setEditImageDataUrl(undefined);
      // Do NOT auto-clear; user can click "Remove image" explicitly
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || "");
      setEditImageDataUrl(dataUrl);      // data:image/...;base64,...
      setEditImagePreview(dataUrl);      // show the new preview
      setEditImageClear(false);          // user is replacing, not clearing
    };
    reader.readAsDataURL(file);
  };

  // ===== Clear image =====
  // Mark image as removed (UI + payload flag)
  const clearEditImage = () => {
    setEditImagePreview(null);   // hide in UI
    setEditImageDataUrl(undefined);
    setEditImageClear(true);     // mark to remove on save
  };

  // ===== Save edit (JSON only) =====
  // Build a JSON payload (no multipart) and update on server
  const saveEdit = async () => {
    if (!editing?._id) return;
    if (!editName.trim()) {
      alert("השם דרוש");
      return;
    }
    if (!localStorage.getItem("token")) {
      alert("אנא התחבר קודם.");
      return;
    }

    setSavingEdit(true);
    try {
      // Build JSON payload according to Solution #2 pattern
      const payload: {
        name?: string;
        description?: string;
        image?: string;
        imageClear?: boolean;
      } = {
        name: editName.trim(),
        description: editDesc.trim(),
      };

      // If user picked a new file => send data URL
      if (typeof editImageDataUrl === "string") {
        payload.image = editImageDataUrl;
      } else if (editImageClear) {
        // If user explicitly cleared:
        payload.imageClear = true;
      }
      
      const updated = await updateTrack(editing._id, payload);
      // Replace updated item in local list
      setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setEditing(null); // close modal
    } catch (e) {
      console.error("Failed to update track", e);
      alert("עדכון המסלול נכשל (האם אתה הבעלים ומחובר?).");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="tracks-wrap" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Header: title + controls (search/sort/refresh) */}
      <header className="tracks-header">
        <h1>מסלולים</h1>
        <div className="controls">
          <input
            className="search"
            placeholder="חפש לפי שם או תיאור…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="name">מיין: שם</option>
            <option value="created">מיין: תאריך יצירה</option>
          </select>
          <button onClick={load} disabled={loading}>
            {loading ? "טוען…" : "רענן"}
          </button>
        </div>
      </header>

      {/* Top-level feedback states */}
      {loading && <p className="info">טוען מסלולים…</p>}
      {error && <p className="error">{error}</p>}

      {/* Empty state when no items after filtering */}
      {!loading && filtered.length === 0 ? (
        <p className="empty">אין מסלולים כרגע. הוסף כמה מהמפה ✨</p>
      ) : (
        // Cards list of tracks
        <ul className="cards">
          {filtered.map((p) => {
            // Permission checks: owner or admin can edit/delete
            const isOwner =
              user &&
              p.owner &&
              (
                (typeof p.owner === "string" && user.id === p.owner) ||
                (typeof p.owner === "object" && user.id === p.owner._id)
              );
            const isAdmin = user && user.role === "admin";
            const canEditOrDelete = !!user && (isOwner || isAdmin);

            return (
              <li className="card" key={p._id}>
                <div className="card-body">
                  <div className="meta">
                    <h3 className="title">{p.name}</h3>
                    {/* Show first point coord pair if present */}
                    {p.points && p.points.length > 0 && (
                      <div className="coords">
                        {p.points[0][0].toFixed(5)}, {p.points[0][1].toFixed(5)}
                      </div>
                    )}
                  </div>
                  {/* Optional description & image */}
                  {p.description && <p className="desc">{p.description}</p>}
                  {p.image && (
                    <img
                      src={`${p.image}?ts=${p.updatedAt || Date.now()}`}
                      alt={p.name}
                      className="track-image"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                {/* Actions: open on map, navigate via Waze, edit, delete */}
                <div className="actions">
                  {p.points && p.points.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          // Navigate to map page, center and request popup open by track id
                          navigate("/", {
                            state: {
                              center: [...p.points[0]],
                              openId: p._id,
                            },
                          });
                        }}
                      >
                        פתח במפה
                      </button>
                      <a
                        href={`https://waze.com/ul?ll=${p.points[0][0]},${p.points[0][1]}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="ניווט עם Waze"
                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                      >
                        <FaWaze size={24} color="#33CCFF" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => openEdit(p)}
                    disabled={!canEditOrDelete}
                    className={!canEditOrDelete ? "disabled" : ""}
                    title={!user ? "להתחבר כדי לערוך" : !canEditOrDelete ? "רק הבעלים או מנהל יכולים לערוך" : ""}
                  >
                    ערוך
                  </button>
                  <button
                    className={`danger${!canEditOrDelete ? " disabled" : ""}`}
                    onClick={() => remove(p._id)}
                    disabled={!canEditOrDelete}
                    title={!user ? "להתחבר כדי למחוק" : !canEditOrDelete ? "רק הבעלים או מנהל יכולים למחוק" : ""}
                  >
                    מחק
                  </button>
                </div>
                {/* Badge when the viewer lacks permissions */}
                {!canEditOrDelete && (
                  <span className="map-toolbar__badge" title="להתחבר כדי לאפשר עריכה/מחיקה">
                    נדרשת הרשאת בעלים/מנהל לעריכה/מחיקה
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Edit modal (name, description, image) */}
      {editing && (
        <div className="modal-backdrop">
          <div className="modal" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
            <h3>עריכת מסלול</h3>
            <label className="field">
              <span>שם</span>
              <textarea
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="שם המסלול"
              />
            </label>
            <label className="field">
              <span>תיאור</span>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="תיאור אופציונלי"
              />
            </label>
            <label className="field">
              <span>תמונה</span>
              <input
                type="file"
                accept="image/*"
                onChange={onEditImageChange}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "8px 1px",
                  fontSize: "14px",
                  background: "#0f0b2f",
                  borderColor: "#0f0b2f",
                  color: "#ffffffff",
                }}
              />
              {(editImagePreview || editing.image) && (
                <div>
                  <img
                    src={editImagePreview || (editing.image ? `${editing.image}?ts=${Date.now()}` : undefined)}
                    alt={editing?.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <button type="button" className="secondary" onClick={clearEditImage}>
                      הסר תמונה
                    </button>
                  </div>
                </div>
              )}
            </label>
            <div className="modal-actions">
              <button disabled={savingEdit} onClick={saveEdit}>
                {savingEdit ? "שומר…" : "שמור"}
              </button>
              <button
                className="secondary"
                onClick={() => {
                  // Close modal and reset transient image state
                  setEditing(null);
                  setSavingEdit(false);
                  // Reset image edit state on cancel
                  setEditImageDataUrl(undefined);
                  setEditImageClear(false);
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
