import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/sidebar";
import { useAuth } from "./AuthContext";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import { useLocation } from "react-router-dom";
import { getTracks, createTrack } from "../lib/tracks";
import type { Track } from "../lib/tracks";
import "../index.css";
import type { LocationItem, LatLng } from "../types/location";
import { isRenderableImage } from "../utils/image";
import { MapClicker } from "../components/MapClicker";
import { CenterMapOnLocation } from "../components/CenterMapOnLocation";
import { GoToMyLocation } from "../components/GoToMyLocation";
import { ReviewSection } from "../components/ReviewFile";

// Define MapMode type
type MapMode = "drag" | "pin-form";

// Default Leaflet marker icon
const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
});

// Map bounds for Israel
const IsraelBounds: [[number, number], [number, number]] = [
  [29.4, 34.2],
  [33.3, 35.9],
];

export default function Map() {
  const { user } = useAuth();
  const canPin = !!user;

  const [places, setPlaces] = useState<LocationItem[]>([]);
  const [mode, setMode] = useState<MapMode>("drag");
  const [formOpen, setFormOpen] = useState(false);
  const [formCoords, setFormCoords] = useState<LatLng | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<string | undefined>(undefined);

  const [myPos, setMyPos] = useState<LatLng | null>(null);
  const [goToMyLocation, setGoToMyLocation] = useState(false);
  const [cameFromCenter, setCameFromCenter] = useState(false);

  const location = useLocation();

  const initialCenter: LatLng = [31.78, 35.22];

  // Only auto-center to my location ONCE, and never if coming from navigation
  const autoCentered = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Track[] = await getTracks();
        if (cancelled) return;
        const normalized: LocationItem[] = (data || [])
          .filter((Track) => Array.isArray(Track.points) && Track.points.length > 0)
          .map((Track) => ({
            id: Track._id!,
            name: Track.name,
            latlng: Track.points[0] as LatLng,
            description: Track.description,
            image: Track.image,
            createdAt: Track.createdAt ? new Date(Track.createdAt).getTime() : Date.now(),
            reviews: Track.reviews || [],
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

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos([pos.coords.latitude, pos.coords.longitude]);
        // Only auto-center ONCE if not coming from navigation
        if (!location.state?.center && !autoCentered.current && !cameFromCenter) {
          setGoToMyLocation(true);
          autoCentered.current = true;
        }
      },
      () => {}
    );
    // Only run on mount and when navigation state changes
  }, [location.state?.center, cameFromCenter]);

  useEffect(() => {
    if (location.state?.center) {
      setCameFromCenter(true);
    }
  }, [location.state?.center]);

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

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormImage(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  };

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
        center={initialCenter}
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
        <MapClicker
          mode={mode}
          canPin={canPin}
          setFormName={setFormName}
          setFormDescription={setFormDescription}
          setFormImage={setFormImage}
          setFormCoords={setFormCoords}
          setFormOpen={setFormOpen}
        />

        {/* Move map to track location if needed */}
        <CenterMapOnLocation center={location.state?.center} />

        {/* Go to my location when triggered */}
        <GoToMyLocation trigger={goToMyLocation} myPos={myPos} onDone={() => setGoToMyLocation(false)} />

        {/* Show all track markers */}
        {places.map((LocationItem) => (
          <Marker key={LocationItem.id} position={LocationItem.latlng} icon={defaultIcon}>
            <Popup>
              <div>
                <div className="popup-title">{LocationItem.name}</div>
                {LocationItem.description && (
                  <div style={{ marginBottom: 4 }}>{LocationItem.description}</div>
                )}
                {isRenderableImage(LocationItem.image) && (
                  <div className="popup-image-container">
                    <img
                      src={LocationItem.image}
                      alt={LocationItem.name}
                      className="popup-image"
                      loading="lazy"
                    />
                  </div>
                )}
                {/* --- Review Section --- */}
                <ReviewSection place={LocationItem} user={user} setPlaces={setPlaces} />
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
    </div>
  );
}

