import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./sidebar";
import { useAuth } from "../pages/AuthContext";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import { useLocation } from "react-router-dom";
import { getTracks, createTrack } from "../lib/tracks";
import type { Track } from "../lib/tracks";
import "../index.css";

// Helper to check if an image string is displayable
const isRenderableImage = (src?: string): boolean =>
  !!src && (/^data:image\//i.test(src) || src.startsWith("/api/"));

// Default Leaflet marker icon
const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
});

type LatLng = [number, number];

// What a marker/track looks like
export interface LocationItem {
  id: string;
  name: string;
  latlng: LatLng;
  description?: string;
  image?: string;
  createdAt?: number;
}

// Map bounds for Israel
const IsraelBounds: [[number, number], [number, number]] = [
  [29.4, 34.2],
  [33.3, 35.9],
];

// Map interaction modes
type MapMode = "drag" | "pin-form";

// Main Map component
export default function Map() {
  const { user } = useAuth();
  const canPin = !!user; // Only logged-in users can add pins

  // State for all markers/tracks
  const [places, setPlaces] = useState<LocationItem[]>([]);
  // State for map mode (drag or add pin)
  const [mode, setMode] = useState<MapMode>("drag");
  // State for the pin form
  const [formOpen, setFormOpen] = useState(false);
  const [formCoords, setFormCoords] = useState<LatLng | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<string | undefined>(undefined);

  // User's geolocation
  const [myPos, setMyPos] = useState<LatLng | null>(null);

  // For navigation state (used for "Go on map" button)
  const location = useLocation();

  // State to trigger going to my location
  const [goToMyLocation, setGoToMyLocation] = useState(false);

  // Load tracks from backend on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Track[] = await getTracks();
        if (cancelled) return;
        // Convert backend tracks to markers
        const normalized: LocationItem[] = (data || [])
          .filter((t) => Array.isArray(t.points) && t.points.length > 0)
          .map((t) => ({
            id: t._id!,
            name: t.name,
            latlng: t.points[0] as LatLng,
            description: t.description,
            image: t.image,
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

  // Get user's location once
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // Handle map clicks for adding pins
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

  // Move map to a location if navigation state has a center (for "Go on map" button)
  function CenterMapOnLocation({ center }: { center?: [number, number] }) {
    const map = useMapEvents({});
    useEffect(() => {
      if (center) {
        map.setView(center, 16, { animate: true }); // Zoom in close
      }
    }, [center]);
    return null;
  }

  // Helper component to center map on your location when triggered
  function GoToMyLocation({ trigger, myPos, onDone }: { trigger: boolean; myPos: LatLng | null; onDone: () => void }) {
    const map = useMapEvents({});
    useEffect(() => {
      if (trigger && myPos) {
        map.setView(myPos, 16, { animate: true });
        onDone();
      }
    }, [trigger, myPos]);
    return null;
  }

  // Save a new pin to the backend
  const handleSaveFromForm = async () => {
    if (!canPin) {
      alert("Please log in to add points");
      return;
    }
    if (!formCoords || !formName.trim()) {
      alert("Please enter a name");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }
    try {
      const created = await createTrack({
        name: formName.trim(),
        description: formDescription || undefined,
        points: [formCoords],
        image: formImage,
      });
      setPlaces((prev) => [
        ...prev,
        {
          id: created._id || String(Date.now()),
          name: created.name,
          latlng: (created.points?.[0] as LatLng) ?? formCoords,
          description: created.description,
          image: created.image,
          createdAt: created.createdAt ? new Date(created.createdAt).getTime() : Date.now(),
        },
      ]);
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

  // File input for pin image
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormImage(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  };

  // Default map center: user's location or Jerusalem
  const center: LatLng = useMemo(() => myPos || [31.78, 35.22], [myPos]);

  // Change map mode safely
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
      {/* Toolbar for map mode and pin controls */}
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
            <button
              onClick={() => setModeSafe("pin-form")}
              disabled={!canPin}
              className={`map-btn ${mode === "pin-form" ? "map-btn--active" : ""}`}
              title="Click the map to open the pin form (requires login)"
            >
              pin (form)
            </button>
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
            <button
              onClick={() => setGoToMyLocation(true)}
              disabled={!myPos}
              className="map-btn"
              title="Go to my current location"
            >
              Go to my location
            </button>
          </div>
          <div className="map-toolbar__hint">
            {mode === "drag"
              ? "Drag the map freely. Click does nothing."
              : "Click the map to open the pin form."}
          </div>
        </div>
      </div>

      {/* The actual map */}
      <MapContainer
        center={center}
        zoom={8}
        className="map-container"
        maxBounds={IsraelBounds}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Show your current location */}
        {myPos && (
          <Marker position={myPos} icon={defaultIcon}>
            <Popup>you are here</Popup>
          </Marker>
        )}

        {/* Handle map clicks for adding pins */}
        <MapClicker />

        {/* Move map to track location if needed */}
        <CenterMapOnLocation center={location.state?.center} />

        {/* Go to my location when triggered */}
        <GoToMyLocation trigger={goToMyLocation} myPos={myPos} onDone={() => setGoToMyLocation(false)} />

        {/* Show all track markers */}
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
                    loading="lazy"
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Sidebar for selecting locations */}
      <Sidebar
        places={places}
        onSelectLocation={(_latlng) => {
          // Move map to selected marker (optional: you can add a zoom here)
          // You could use a ref and setView if you want to zoom in
        }}
      />

      {/* Pin form for adding a new point */}
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

      {/* Loading indicator for tracks */}
      {places.length === 0 && (
        <div className="map-loading">Loading tracks…</div>
      )}
      {places.length === 0 && <p className="info">Loading tracks…</p>}
    </div>
  );
}

