// react/src/components/Tracks.tsx (or your actual path)
// List + edit Tracks using JSON only (image as data URL). No multipart/FormData.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTracks, deleteTrack, updateTrack } from "../lib/tracks";
import type { Track } from "../lib/tracks";
import "../style/tracks.css";

type SortBy = "name" | "created";

export default function Tracks() {
  // ===== Server data =====
  const [items, setItems] = useState<Track[]>([]);

  // ===== UI state =====
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ===== Search / sort =====
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const navigate = useNavigate();

  // ===== Edit modal state =====
  const [editing, setEditing] = useState<Track | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Image editing state (JSON only)
  // - editImagePreview: what we show in UI (existing server URL or new data URL, or null if cleared)
  // - editImageDataUrl: only set when user selected a new file (data URL string)
  // - editImageClear: mark true if user chose to remove existing image
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageDataUrl, setEditImageDataUrl] = useState<string | undefined>(undefined);
  const [editImageClear, setEditImageClear] = useState<boolean>(false);

  const [savingEdit, setSavingEdit] = useState(false);

  // ===== Load tracks =====
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTracks();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load tracks", e);
      setError("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ===== Derived list =====
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
      list = [...list].sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
      );
    }
    return list;
  }, [items, q, sortBy]);

  // ===== Navigation =====
  const goToOnMap = (coords: [number, number]) => {
    navigate("/", { state: { center: coords } });
  };

  // ===== Delete =====
  const remove = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this track?")) return;
    try {
      await deleteTrack(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete track (are you the owner and logged in?).");
    }
  };

  // ===== Open edit modal =====
  const openEdit = (t: Track) => {
    setEditing(t);
    setEditName(t.name);
    setEditDesc(t.description || "");

    // Preview shows current server image (URL) or nothing
    setEditImagePreview(typeof t.image === "string" && t.image.length > 0 ? t.image : null);

    // Reset JSON image editing flags
    setEditImageDataUrl(undefined);
    setEditImageClear(false);
  };

  // ===== File input change (read file -> data URL) =====
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
  const clearEditImage = () => {
    setEditImagePreview(null);   // hide in UI
    setEditImageDataUrl(undefined);
    setEditImageClear(true);     // mark to remove on save
  };

  // ===== Save edit (JSON only) =====
  const saveEdit = async () => {
    if (!editing?._id) return;
    if (!editName.trim()) {
      alert("Name is required");
      return;
    }
    if (!localStorage.getItem("token")) {
      alert("Please login first.");
      return;
    }

    setSavingEdit(true);
    try {
      // Build JSON payload according to Solution #2
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
      // Note: points are not edited here; add if you have editPoints state

      const updated = await updateTrack(editing._id, payload);
      setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setEditing(null);
    } catch (e) {
      console.error("Failed to update track", e);
      alert("Failed to update track (are you the owner and logged in?).");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="tracks-wrap">
      <header className="tracks-header">
        <h1>Tracks</h1>
        <div className="controls">
          <input
            className="search"
            placeholder="Search by name or note…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="name">Sort: Name</option>
            <option value="created">Sort: Created</option>
          </select>
          <button onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {loading && <p className="info">Loading tracks…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && filtered.length === 0 ? (
        <p className="empty">No tracks yet. Add some from the map ✨</p>
      ) : (
        <ul className="cards">
          {filtered.map((p) => (
            <li className="card" key={p._id}>
              <div className="card-body">
                <div className="meta">
                  <h3 className="title">{p.name}</h3>
                  {p.points && p.points.length > 0 && (
                    <div className="coords">
                      {p.points[0][0].toFixed(5)}, {p.points[0][1].toFixed(5)}
                    </div>
                  )}
                </div>
                {p.description && <p className="desc">{p.description}</p>}
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="thumb"
                    style={{ maxWidth: 200, borderRadius: 8, marginTop: 8 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <div className="actions">
                {p.points && p.points.length > 0 && (
                  <button onClick={() => goToOnMap(p.points[0])}>Go on map</button>
                )}
                <button onClick={() => openEdit(p)}>Edit</button>
                <button className="danger" onClick={() => remove(p._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit track</h3>
            <label className="field">
              <span>Name</span>
              <textarea
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Track name"
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Optional description"
              />
            </label>
            <label className="field">
              <span>Image</span>
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
                    src={editImagePreview || editing.image!}
                    alt={editing?.name}
                    style={{ maxWidth: 200, borderRadius: 8 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <button type="button" className="secondary" onClick={clearEditImage}>
                      Remove image
                    </button>
                  </div>
                </div>
              )}
            </label>
            <div className="modal-actions">
              <button disabled={savingEdit} onClick={saveEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setSavingEdit(false);
                  // Reset image edit state on cancel
                  setEditImageDataUrl(undefined);
                  setEditImageClear(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
