import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState, useRef } from "react";
import "../style/sidebar.css";
import Sidebar from "./sidebar";
import { useAuth } from "../pages/AuthContext";
import "../index.css";

import L from "leaflet";
import type { Map as LeafletMap, LatLngBoundsExpression } from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Backend tracks API (must support `image?: string`)
import { getTracks, createTrack } from "../lib/tracks";
import type { Track } from "../lib/tracks";

const isRenderableImage = (src?: string): boolean => {
  if (!src) return false;
  return /^data:image\//i.test(src) || src.startsWith("/api/");
};

const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
});

type LatLng = [number, number];

export interface LocationItem {
  id: string;
  name: string;
  latlng: LatLng;
  description?: string;
  image?: string; // base64 data URL (persisted to DB)
  createdAt?: number;
}

// Israel bounds
const IsraelBounds: LatLngBoundsExpression = [
  [29.4, 34.2],
  [33.3, 35.9],
];

// Interaction modes
type MapMode = "drag" | "pin-form";

// Local id helper (fallback only)
const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function Map() {
  const { user } = useAuth();
  const canPin = !!user; // only authenticated users can add points

  // Markers (synced with DB via /api/tracks)
  const [places, setPlaces] = useState<LocationItem[]>([]);

  // Mode state
  const [mode, setMode] = useState<MapMode>("drag");

  // Pin form state
  const [formOpen, setFormOpen] = useState(false);
  const [formCoords, setFormCoords] = useState<LatLng | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<string | undefined>(undefined); // <-- used

  // Geolocation
  const [myPos, setMyPos] = useState<LatLng | null>(null);

  // Map ref
  const mapRef = useRef<LeafletMap | null>(null);

  // Load existing tracks from server (DB)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Track[] = await getTracks();
        if (cancelled) return;
        // Convert Track -> LocationItem (use first point as marker position)
        const normalized: LocationItem[] = (data || [])
          .filter((t) => Array.isArray(t.points) && t.points.length > 0)
          .map((t) => ({
            id: t._id!,                                // MongoDB id
            name: t.name,
            latlng: t.points[0] as LatLng,             // first point for marker
            description: t.description,
            image: t.image,                            // <-- KEEP IMAGE AS IS FROM BACKEND
            createdAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
          }));
        setPlaces(normalized);
      } catch (err) {
        console.error("Failed to load tracks from server", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Request geolocation once
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // Center map when geolocation arrives
  useEffect(() => {
    if (!myPos || !mapRef.current) return;
    const m = mapRef.current;
    m.setView(myPos, Math.max(m.getZoom(), 12), { animate: true });
  }, [myPos]);

  // Map click handler: open form in pin-form mode (auth required)
  function MapClicker() {
    useMapEvents({
      click: (e) => {
        if (mode === "drag") return;
        if (!canPin) {
          alert("Please log in to add points");
          return;
        }
        const coords: LatLng = [e.latlng.lat, e.latlng.lng];
        setFormName("");
        setFormDescription("");
        setFormImage(undefined);
        setFormCoords(coords);
        setFormOpen(true);
      },
    });
    return null;
  }

  // Save pin via backend (DB), including image base64
  const handleSaveFromForm = async () => {
    if (!canPin) {
      alert("Please log in to add points");
      return;
    }
    if (!formCoords || !formName.trim()) {
      alert("Please enter a name");
      return;
    }

    // Ensure JWT exists so axios interceptor adds Authorization header
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      // Backend expects: { name, description?, points: [[lat,lng], ...], image? }
      const created = await createTrack({
        name: formName.trim(),
        description: formDescription || undefined,
        points: [formCoords],
        image: formImage, // <-- SEND image to server
      });

      // Reflect newly created track in UI (use first point as marker)
      setPlaces((prev) => [
        ...prev,
        {
          id: created._id || makeId(),
          name: created.name,
          latlng: (created.points?.[0] as LatLng) ?? formCoords,
          description: created.description,
          image: created.image, // <-- keep image from server response
          createdAt: created.createdAt ? new Date(created.createdAt).getTime() : Date.now(),
        },
      ]);

      // Reset form
      setFormOpen(false);
      setFormCoords(null);
      setFormName("");
      setFormDescription("");
      setFormImage(undefined);
    } catch (err) {
      console.error("Failed to create track", err);
      alert("Failed to save track (check token and points format).");
    }
  };

  // Update cursor and close form when switching to drag
  useEffect(() => {
    const mapEl = mapRef.current?.getContainer();
    if (!mapEl) return;

    if (!canPin) {
      mapEl.style.cursor = "grab";
      return;
    }
    mapEl.style.cursor = mode === "drag" ? "grab" : "crosshair";

    if (mode === "drag") {
      setFormOpen(false);
      setFormCoords(null);
    }
  }, [mode, canPin]);

  // File -> base64 data URL (image preview + send to server)
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormImage(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  };

  // Default center: geolocation or Jerusalem-ish
  const center: LatLng = useMemo(() => myPos || [31.78, 35.22], [myPos]);

  // Safe mode setter: block pin-form if not logged in
  const setModeSafe = (next: MapMode) => {
    if (next === "pin-form" && !canPin) {
      alert("Only logged-in users can add points");
      setMode("drag");
      return;
    }
    setMode(next);
  };



  return (
    <div className="map-page">
      {/* Floating mode controls */}
      <div className="floating-controls">
        <div className="map-toolbar">
          <div className="map-toolbar__header">
            <h6 className="map-toolbar__title">Mode</h6>
            {!canPin && (
              <span className="map-toolbar__badge" title="Log in to enable pin form">
                login required for pin
              </span>
            )}
          </div>

          <div className="map-toolbar__row">
            <button
              onClick={() => setModeSafe("drag")}
              className={`map-btn ${mode === "drag" ? "map-btn--active" : ""}`}
              title="Pan/drag map"
            >
              drag
            </button>

            {/* pin (form): click on the map to choose location */}
            <button
              onClick={() => setModeSafe("pin-form")}
              disabled={!canPin}
              className={`map-btn ${mode === "pin-form" ? "map-btn--active" : ""}`}
              title="Click the map to open the pin form (requires login)"
            >
              pin (form)
            </button>

            {/* pin my location: open form at myPos */}
            <button
              onClick={() => {
                if (!canPin) {
                  alert("Please log in to add points");
                  return;
                }
                if (!myPos) {
                  alert("Current location is not available yet");
                  return;
                }
                if (mapRef.current) {
                  const m = mapRef.current;
                  m.setView(myPos, Math.max(m.getZoom(), 12), { animate: true });
                }
                setFormCoords(myPos);
                setFormName("");
                setFormDescription("");
                setFormImage(undefined);
                setFormOpen(true);
              }}
              disabled={!canPin || !myPos}
              className="map-btn"
              title="Open pin form at your current location (requires login)"
            >
              pin my location
            </button>
          </div>

          <div className="map-toolbar__hint">
            {mode === "drag"
              ? "Drag the map freely. Click does nothing."
              : "Click the map to open the pin form."}
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={8}
        className="map-container"
        ref={mapRef}
        maxBounds={IsraelBounds}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current location marker */}
        {myPos && (
          <Marker position={myPos} icon={defaultIcon}>
            <Popup>you are here</Popup>
          </Marker>
        )}

        {/* Click handler honoring mode + auth */}
        <MapClicker />

        {/* Existing markers (from DB) */}
        {places.map((p) => (
          <Marker key={p.id} position={p.latlng} icon={defaultIcon}>
            <Popup>
              <div>
                <div className="popup-title">{p.name}</div>
                {p.description && (
                  <div style={{ marginBottom: 4 }}>{p.description}</div>
                )}
                {isRenderableImage(p.image) && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="popup-image"
                    style={{ maxWidth: 200, maxHeight: 200 }}
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Sidebar */}
      <Sidebar
        places={places}
        onSelectLocation={(latlng) => {
          const m = mapRef.current;
          if (m) m.setView(latlng, Math.max(m.getZoom(), 12), { animate: true });
        }}
      />

      {/* Add-point form panel */}
      {formOpen && formCoords && (
        <div className="form-panel">
          <h6 className="form-panel__title">Add point</h6>
          <div className="form-panel__coords">
            lat: {formCoords[0].toFixed(5)}, lng: {formCoords[1].toFixed(5)}
          </div>

          <input
            type="text"
            placeholder="name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <textarea
            placeholder="description (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
          />

          {/* Image input + live preview */}
          <input type="file" accept="image/*" onChange={onImageChange} />
          {formImage && (
            <img
              src={formImage}
              alt="preview"
              style={{ maxWidth: "100%", marginTop: 6, borderRadius: 6 }}
            />
          )}

          <div className="form-panel__actions">
            <button className="form-btn" onClick={handleSaveFromForm}>
              save
            </button>
            <button
              className="form-btn"
              onClick={() => {
                setFormOpen(false);
                setFormCoords(null);
                setFormImage(undefined);
              }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

