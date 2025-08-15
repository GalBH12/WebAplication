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
  image?: string; // base64
  createdAt?: number;
}

// Typed bounds for Israel
const IsraelBounds: LatLngBoundsExpression = [
  [29.4, 34.2],
  [33.3, 35.9],
];

// Interaction modes
type MapMode = "drag" | "pin-form";

// Simple id generator
const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function Map() {
  const { user } = useAuth();
  const canPin = !!user; // Only authenticated users can add points

  // Points state (local for now; can be replaced with server-backed data)
  const [places, setPlaces] = useState<LocationItem[]>([]);

  // Mode state
  const [mode, setMode] = useState<MapMode>("drag");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formCoords, setFormCoords] = useState<LatLng | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<string | undefined>(undefined);

  // Geolocation
  const [myPos, setMyPos] = useState<LatLng | null>(null);

  // Map ref (using ref instead of whenCreated/whenReady)
  const mapRef = useRef<LeafletMap | null>(null);

  // Load from localStorage on mount (kept for now)
  useEffect(() => {
    const saved = localStorage.getItem("savedPlaces");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as any[];
      const normalized = parsed.map((p) => ({
        ...p,
        createdAt: typeof p?.createdAt === "string" ? Number(p.createdAt) : p?.createdAt,
      }));
      setPlaces(normalized);
    } catch {}
  }, []);

  // Persist to localStorage when places change
  useEffect(() => {
    localStorage.setItem("savedPlaces", JSON.stringify(places));
  }, [places]);

  // Request geolocation once
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // Center the map when geolocation arrives
  useEffect(() => {
    if (!myPos || !mapRef.current) return;
    const m = mapRef.current;
    m.setView(myPos, Math.max(m.getZoom(), 12), { animate: true });
  }, [myPos]);

  // Map click handler: open form only in pin-form mode and only for authenticated users
  function MapClicker() {
    useMapEvents({
      click: (e) => {
        if (mode === "drag") return;
        if (!canPin) {
          alert("Please log in to add points");
          return;
        }
        const coords: LatLng = [e.latlng.lat, e.latlng.lng];
        // open the form at clicked coords
        setFormName("");
        setFormDescription("");
        setFormImage(undefined);
        setFormCoords(coords);
        setFormOpen(true);
      },
    });
    return null;
  }

  // Save point from form
  const handleSaveFromForm = () => {
    if (!canPin) {
      alert("Please log in to add points");
      return;
    }
    if (!formCoords || !formName.trim()) {
      alert("Please enter a name");
      return;
    }
    setPlaces((prev) => [
      ...prev,
      {
        id: makeId(),
        name: formName.trim(),
        latlng: formCoords,
        description: formDescription || undefined,
        image: formImage,
        createdAt: Date.now(),
      },
    ]);
    // close & reset the form after saving
    setFormOpen(false);
    setFormCoords(null);
    setFormName("");
    setFormDescription("");
    setFormImage(undefined);
  };

  // Open the same pin form, prefilled with the current location
  const handlePinCurrent = () => {
    if (!canPin) {
      alert("Please log in to add points");
      return;
    }
    if (!myPos) {
      alert("Current location is not available yet");
      return;
    }

    // optional: center the map on current location
    if (mapRef.current) {
      const m = mapRef.current;
      m.setView(myPos, Math.max(m.getZoom(), 12), { animate: true });
    }

    // open the form with my current coords
    setFormCoords(myPos);
    setFormName(""); // default name (editable)
    setFormDescription("");
    setFormImage(undefined);
    setFormOpen(true);
  };

  // Delete point (local-only version)
  const handleDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setPlaces((prev) => prev.filter((p) => p.id !== id));
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

  // File -> base64
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormImage(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  };

  // Map center: user location first, otherwise Jerusalem-ish
  const center: LatLng = useMemo(() => myPos || [31.78, 35.22], [myPos]);

  // Safe mode setter: prevent switching to pin-form if not logged in
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

            {/* pin (form): click on the map to choose the location */}
            <button
              onClick={() => setModeSafe("pin-form")}
              disabled={!canPin}
              className={`map-btn ${mode === "pin-form" ? "map-btn--active" : ""}`}
              title="Click the map to open the pin form (requires login)"
            >
              pin (form)
            </button>

            {/* pin my location: open the same form, prefilled with myPos */}
            <button
              onClick={handlePinCurrent}
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

        {/* Existing markers */}
        {places.map((p) => (
          <Marker key={p.id} position={p.latlng} icon={defaultIcon}>
            <Popup>
              <div>
                <div className="popup-title">{p.name}</div>
                {p.description && <div style={{ marginBottom: 4 }}>{p.description}</div>}
                {p.image && <img src={p.image} alt={p.name} className="popup-image" />}
                <div className="popup-actions">
                  <button className="map-btn" onClick={(e) => handleDelete(e, p.id)}>
                    delete
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Sidebar wired to your expected props */}
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

          <input type="file" accept="image/*" onChange={onImageChange} />

          <div className="form-panel__actions">
            <button className="form-btn" onClick={handleSaveFromForm}>
              save
            </button>
            <button
              className="form-btn"
              onClick={() => {
                setFormOpen(false);
                setFormCoords(null);
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
