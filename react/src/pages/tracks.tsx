import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LocationItem } from "../components/Map";
import "../style/tracks.css";

const STORAGE_KEY = "savedPlaces";

type SortBy = "name" | "created";

type StoredItem = LocationItem & { createdAt?: number };

export default function Tracks() {
  // State for saved places
  const [items, setItems] = useState<StoredItem[]>([]);
  // Search query
  const [q, setQ] = useState("");
  // Sort mode
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const navigate = useNavigate();

  // Load saved places from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: StoredItem[] = JSON.parse(raw);
      setItems(parsed);
    } catch {}
  }, []);

  // Save state to localStorage
  const save = (next: StoredItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Filter + sort list according to search query and sort option
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = !term
      ? items
      : items.filter((x) =>
          x.name.toLowerCase().includes(term) ||
          (x.description || "").toLowerCase().includes(term)
        );
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return list;
  }, [items, q, sortBy]);

  // Navigate to map and center on coords
  const goToOnMap = (coords: [number, number]) => {
    navigate("/", { state: { center: coords } });
  };

  // Delete a place
  const remove = (id: string) => {
    if (!confirm("Delete this place?")) return;
    save(items.filter((x) => x.id !== id));
  };

  // Rename a place
  const rename = (id: string) => {
    const idx = items.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const cur = items[idx];
    const nextName = prompt("New name:", cur.name)?.trim();
    if (!nextName) return;
    if (items.some((p) => p.id !== id && p.name.trim().toLowerCase() === nextName.toLowerCase())) {
      alert("A place with this name already exists.");
      return;
    }
    const next = [...items];
    next[idx] = { ...cur, name: nextName };
    save(next);
  };

  return (
    <div className="tracks-wrap">
      <header className="tracks-header">
        <h1>Tracks</h1>
        <div className="controls">
          {/* Search field */}
          <input
            className="search"
            placeholder="Search by name or note…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {/* Sort selector */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="name">Sort: Name</option>
            <option value="created">Sort: Created</option>
          </select>
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className="empty">No saved places yet. Add some from the map ✨</p>
      ) : (
        <ul className="cards">
          {filtered.map((p) => (
            <li className="card" key={p.id}>
              <div className="card-body">
                <div className="meta">
                  <h3 className="title">{p.name}</h3>
                  <div className="coords">
                    {p.latlng[0].toFixed(5)}, {p.latlng[1].toFixed(5)}
                  </div>
                </div>
                {p.image && (
                  <img className="thumb" src={p.image} alt={p.name} />
                )}
                {p.description && <p className="desc">{p.description}</p>}
              </div>
              <div className="actions">
                <button onClick={() => goToOnMap(p.latlng)}>Go on map</button>
                <button onClick={() => rename(p.id)}>Rename</button>
                <button className="danger" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}