import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./sidebar";

type LatLng = [number, number];

export interface LocationItem {
  id: string;
  name: string;
  latlng: LatLng;
  description?: string;
  image?: string; //base64
}

const STORAGE_KEY = "savedPlaces";
const IsraelBounds: [[number, number], [number, number]] = [
  [29.4, 34.2],
  [33.3, 35.9],
];

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type AddMode = "quick" | "form";

function MapClicker({ onClick }: { onClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapCenterer({ to }: { to: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.setView(to, 13);
  }, [to, map]);
  return null;
}

export default function Map() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [places, setPlaces] = useState<LocationItem[]>([]);
  const [selected, setSelected] = useState<LatLng | null>(null);

  // add mode + draft coords for the form mode
  const [addMode, setAddMode] = useState<AddMode>("quick"); // default back to Quick (prompt -> save)
  const [draftCoords, setDraftCoords] = useState<LatLng | null>(null);

  // load/save local
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlaces(JSON.parse(saved));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  }, [places]);

  // geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setPosition([32.0853, 34.7818])
      );
    } else setPosition([32.0853, 34.7818]);
  }, []);

  const isNameTaken = (name: string) =>
    places.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());

  // ----- QUICK MODE (prompt -> save) -----
  const quickAddAt = (coords: LatLng) => {
    const def = `Point ${new Date().toLocaleString()}`;
    const name = prompt("Put a name for the location:", def);
    if (!name) return;
    if (isNameTaken(name)) {
      alert("A place with this name already exists.");
      return;
    }
    setPlaces((prev) => [...prev, { id: makeId(), name, latlng: coords }]);
  };

  const handleMapClick = (coords: LatLng) => {
    if (addMode === "quick") quickAddAt(coords);
    else setDraftCoords(coords);
  };

  const addCurrent = () => {
    if (!position) return;
    if (addMode === "quick") quickAddAt(position);
    else setDraftCoords(position);
  };

  // ----- FORM MODE helpers -----
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleSaveFromForm = async (
    e: React.FormEvent<HTMLFormElement>,
    coords: LatLng
  ) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const file = fd.get("image") as File | null;

    if (!name) {
      alert("Name is required");
      return;
    }
    if (isNameTaken(name)) {
      alert("A place with this name already exists.");
      return;
    }

    let image: string | undefined;
    if (file && file.size > 0) {
      image = await fileToBase64(file);
    }

    setPlaces((prev) => [
      ...prev,
      { id: makeId(), name, latlng: coords, description, image },
    ]);
    setDraftCoords(null);
  };

  // general actions
  const remove = (id: string) => setPlaces((p) => p.filter((x) => x.id !== id));
  const markers = useMemo(() => places, [places]);
  const centerOnMe = () => { if (position) setSelected(position); };

  const location = useLocation();
useEffect(() => {
  const state = location.state as { center?: [number, number] } | null;
  if (state?.center) setSelected(state.center);
}, [location.state]);

  return (
    <div>
      <Sidebar
        places={places}
        onSelectLocation={setSelected}
        onRemoveLocation={remove}
        onAddCurrentLocation={addCurrent}
      />

      {position && (
        <>
          {/* overlay controls */}
          <div
            style={{
              position: "fixed",
              top: 12,
              right: 12,
              zIndex: 1000,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button className="map-btn" onClick={addCurrent}>Add current location</button>
            <button className="map-btn" onClick={centerOnMe}>Center on me</button>
            <button
              className="map-btn"
              onClick={() => setAddMode((m) => (m === "quick" ? "form" : "quick"))}
              title="Toggle add mode"
            >
              Mode: {addMode === "quick" ? "Quick" : "Form"}
            </button>
          </div>

          <MapContainer
            center={position}
            zoom={13}
            style={{ height: "100vh", width: "100vw" }}
            maxBounds={IsraelBounds}
            maxBoundsViscosity={1.0}
            scrollWheelZoom
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* current location */}
            <Marker position={position}>
              <Popup>Current location</Popup>
            </Marker>

            {/* click handler */}
            <MapClicker onClick={handleMapClick} />

            {/* center on selection */}
            <MapCenterer to={selected} />

            {/* saved places */}
            {markers.map((loc) => (
              <Marker key={loc.id} position={loc.latlng}>
                <Popup>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
                    <strong>{loc.name}</strong>
                    <small>
                      {loc.latlng[0].toFixed(5)}, {loc.latlng[1].toFixed(5)}
                    </small>
                    {loc.description && <p style={{ margin: 0 }}>{loc.description}</p>}
                    {loc.image && (
                      <img
                        src={loc.image}
                        alt={loc.name}
                        style={{ maxWidth: 160, borderRadius: 6 }}
                      />
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="map-btn" onClick={() => setSelected(loc.latlng)}>Go</button>
                      <button className="map-btn danger" onClick={() => remove(loc.id)}>Delete</button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* form popup (only in Form mode) */}
            {draftCoords && addMode === "form" && (
              <Marker position={draftCoords}>
                <Popup
                  eventHandlers={{ remove: () => setDraftCoords(null) }}
                  closeButton
                >
                  <form onSubmit={(e) => handleSaveFromForm(e, draftCoords)}>
                    <div>
                      <label>
                        Name:
                        <input type="text" name="name" required />
                      </label>
                    </div>
                    <div>
                      <label>
                        Comment:
                        <textarea name="description" rows={2} placeholder="Add a note..." />
                      </label>
                    </div>
                    <div>
                      <label>
                        Picture:
                        <input type="file" name="image" accept="image/*" />
                      </label>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button type="submit" className="map-btn">Save</button>
                      <button
                        type="button"
                        className="map-btn danger"
                        onClick={() => setDraftCoords(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </>
      )}
    </div>
  );
}
