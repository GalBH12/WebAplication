// Core Leaflet map components for React
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// React hooks
import { useEffect, useState, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
// Sidebar UI (list of places etc.)
import Sidebar from "../components/sidebar";
// Auth context for current user (used to allow pinning)
import { useAuth } from "./AuthContext";
// Leaflet core + default marker assets
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
// Router location (used to optionally center map from other pages)
import { useLocation, useNavigate } from "react-router-dom";
// API helpers to fetch/create tracks
import { getTracks, createTrack } from "../lib/tracks";
import type { Track } from "../lib/tracks";
// Global styles
import "../index.css";
import "../style/map.css";
// Local domain types
import type { LocationItem, LatLng } from "../types/location";
// Utility to validate image strings (base64/url)
import { isRenderableImage } from "../utils/image";
// Map interaction helpers/components
import { MapClicker } from "../components/MapClicker";
import { CenterMapOnLocation } from "../components/CenterMapOnLocation";
import { GoToMyLocation } from "../components/GoToMyLocation";
// Reviews UI rendered inside marker popup
import { ReviewSection } from "../components/ReviewFile";
// Waze icon for navigation link in popup
import { FaWaze } from "react-icons/fa";

// Define MapMode type
type MapMode = "drag" | "pin-form";

// Default Leaflet marker icon
const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],   // pixel anchor of the icon
  popupAnchor: [1, -34],  // where popups open relative to the icon
  iconSize: [25, 41],
  shadowSize: [41, 41],
});

// Map bounds for Israel
const IsraelBounds: [[number, number], [number, number]] = [
  [29.4, 34.2],
  [33.3, 35.9],
];

export default function Map() {
  // small helper component: get the map instance via useMap and store in ref
  const MapRefSetter = () => {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
      console.debug("MapRefSetter: map instance saved", map);
    }, [map]);
    return null;
  };

  // Current logged-in user (null/undefined if not logged in)
  const { user } = useAuth();
  const canPin = !!user; // only logged-in users can add pins

  // Map state: loaded places/markers
  const [places, setPlaces] = useState<LocationItem[]>([]);
  // Current interaction mode (drag vs. click-to-open-form)
  const [mode, setMode] = useState<MapMode>("drag");
  // Pin form UI state + fields
  const [formOpen, setFormOpen] = useState(false);
  const [formCoords, setFormCoords] = useState<LatLng | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<string | undefined>(undefined);

  // Geolocation state
  const [myPos, setMyPos] = useState<LatLng | null>(null);
  const [goToMyLocation, setGoToMyLocation] = useState(false);
  const [cameFromCenter, setCameFromCenter] = useState(false);

  // Router location (used for optional centering on a specific track)
  const location = useLocation();
  const navigate = useNavigate();
  // helper: wait until marker instance exists then highlight it
  const waitForMarkerAndHighlight = (id: string, timeout = 8000): Promise<boolean> => {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const marker = markerRefs.current[id];
        if (marker && mapRef.current) {
          highlightMarkerById(id);
          resolve(true);
          return;
        }
        if (Date.now() - start > timeout) {
          resolve(false);
          return;
        }
        setTimeout(tick, 200);
      };
      tick();
    });
  };

  // react to navigation from Tracks (state.openId) — wait for marker and then highlight
  useEffect(() => {
    const stateAny = (location.state as any) || {};
    const openId = stateAny.openId;
    if (!openId) return;
    if (places.length === 0) return; // wait until markers are rendered

    let mounted = true;
    (async () => {
      const ok = await waitForMarkerAndHighlight(String(openId));
      if (ok && mounted) {
        // clear navigation state so it won't repeat
        navigate(location.pathname, { replace: true, state: { center: location.state?.center } });
      } else {
        console.warn("Map: could not find marker for openId", openId);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openId, places.length]);

  // Default initial center (Jerusalem-ish)
  const initialCenter: LatLng = [31.78, 35.22];

  // Only auto-center to my location ONCE, and never if coming from navigation
  const autoCentered = useRef(false);

  // ref to the Leaflet map instance
  const mapRef = useRef<LeafletMap | null>(null);
  // store leaflet Marker instances by id
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  // temporary highlight layer
  const highlightLayerRef = useRef<L.CircleMarker | null>(null);

  const highlightMarkerById = (id: string) => {
    const marker = markerRefs.current[id];
    if (!marker || !mapRef.current) return false;
    // remove old highlight
    if (highlightLayerRef.current) {
      highlightLayerRef.current.remove();
      highlightLayerRef.current = null;
    }
    const p = marker.getLatLng();
    const circle = L.circleMarker([p.lat, p.lng], {
      radius: 12,
      color: "#FFD54F",
      weight: 2,
      fillColor: "#FFD54F",
      fillOpacity: 0.65,
    }).addTo(mapRef.current);
    highlightLayerRef.current = circle;
    // auto-remove after 3s
    setTimeout(() => {
      if (highlightLayerRef.current) {
        highlightLayerRef.current.remove();
        highlightLayerRef.current = null;
      }
    }, 3000);
    // center/fly to it
    try {
      const z = Math.max( mapRef.current.getZoom?.() ?? 13, 13 );
      mapRef.current.flyTo([p.lat, p.lng], z, { animate: true, duration: 0.8 });
    } catch {}
    return true;
  };


  // Called by the Sidebar when user selects a saved place
  const handleSelectLocation = (latlng: [number, number]) => {
    console.debug("handleSelectLocation called with", latlng);
    if (!latlng || latlng.length !== 2) return;
    const [lat, lng] = latlng.map((n) => Number(n)) as [number, number];

    const openPopupAt = (lat: number, lng: number) => {
      if (!mapRef.current) return false;
      let found = false;
      const EPS = 1e-4; // tolerance for matching coordinates
      mapRef.current.eachLayer((layer: any) => {
        // only consider Marker layers
        try {
          if (layer instanceof L.Marker) {
            const p = layer.getLatLng();
            if (Math.abs(p.lat - lat) < EPS && Math.abs(p.lng - lng) < EPS) {
              // open the marker's bound popup
              layer.openPopup();
              found = true;
            }
          }
        } catch (e) {
          // ignore layers that are not markers
        }
      });
      return found;
    };

    const doFly = () => {
      if (!mapRef.current) {
        console.warn("handleSelectLocation: mapRef not ready");
        return false;
      }
      try {
        const zoom = typeof mapRef.current.getZoom === "function" ? mapRef.current.getZoom() : 13;
        if (typeof mapRef.current.flyTo === "function") {
          mapRef.current.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
        } else {
          mapRef.current.setView([lat, lng], zoom);
        }
        // try opening popup after a short delay so markers/pan finished
        setTimeout(() => {
          const ok = openPopupAt(lat, lng);
          if (!ok) {
            // if not found, try again shortly (maybe markers still rendering)
            setTimeout(() => openPopupAt(lat, lng), 300);
          }
        }, 350);
        console.debug("map moved to", lat, lng);
        return true;
      } catch (err) {
        console.warn("Failed to center map:", err);
        return false;
      }
    };

    // If map isn't ready yet, retry a couple times briefly
    if (!doFly()) {
      let attempts = 0;
      const t = setInterval(() => {
        attempts += 1;
        if (doFly() || attempts >= 6) {
          clearInterval(t);
        }
      }, 250);
    }
  };

  // Load tracks on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Track[] = await getTracks();
        if (cancelled) return;
        // Normalize server Track -> LocationItem for map markers
        const normalized: LocationItem[] = (data || [])
          .filter((Track) => Array.isArray(Track.points) && Track.points.length > 0)
          .map((Track) => ({
            id: Track._id!,
            name: Track.name,
            latlng: Track.points[0] as LatLng, // first point used as marker position
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
    // Cleanup flag to avoid setState after unmount
    return () => {
      cancelled = true;
    };
  }, []);

  // Acquire geolocation and optionally auto-center once (unless navigated here)
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

  // Mark that we arrived with a specific center (don't auto-center on GPS in that case)
  useEffect(() => {
    if (location.state?.center) {
      setCameFromCenter(true);
    }
  }, [location.state?.center]);

  // Persist a new point from the form to server and UI state
  const handleSaveFromForm = async () => {
    if (!canPin) {
      alert("יש להתחבר כדי להוסיף נקודות");
      return;
    }
    if (!formCoords || !formName.trim()) {
      alert("אנא הזן שם");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("אנא התחבר קודם.");
      return;
    }
    try {
      const created = await createTrack({
        name: formName.trim(),
        description: formDescription || undefined,
        points: [formCoords],
        image: formImage,
      });
      // Optimistically add to local state
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
      // Reset form
      setFormOpen(false);
      setFormCoords(null);
      setFormName("");
      setFormDescription("");
      setFormImage(undefined);
    } catch (err) {
      console.error("Failed to create track", err);
      alert("שמירת המסלול נכשלה (בדוק את הטוקן ופורמט הנקודות).");
    }
  };

  // Handle image file input -> base64 preview in form
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormImage(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  };

  // Gate switching to "pin-form" if user not logged in
  const setModeSafe = (next: MapMode) => {
    if (next === "pin-form" && !canPin) {
      alert("רק משתמשים מחוברים יכולים להוסיף נקודות");
      setMode("drag");
      return;
    }
    setMode(next);
  };
  
  return (
    // keep comments and behavior, set page to RTL and reserve space on the right for the mode container
    <div className="map-page" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
      {/* Toolbar for map mode and pin controls */}
      {/* floating-controls moved to the TOP CENTER of the page (mode container) */}
      <div className="floating-controls">
        <div className="map-toolbar">
          <div className="map-toolbar__header">
            <h6 className="map-toolbar__title">מצב</h6>
            {!canPin && (
              <span className="map-toolbar__badge" title="יש להתחבר כדי לאפשר סימון">
                לסימון יש להתחבר
              </span>
            )}
          </div>
          <div className="map-toolbar__row">
            <button onClick={() => setModeSafe("drag")} className={`map-btn ${mode === "drag" ? "map-btn--active" : ""}`} title="גרור/נווט במפה">
              גרור
            </button>
            <button onClick={() => setModeSafe("pin-form")} disabled={!canPin} className={`map-btn ${mode === "pin-form" ? "map-btn--active" : ""}`} title="לחץ על המפה כדי לפתוח טופס סימון (דורש התחברות)">
              סמן נקודה
            </button>
            <button
              onClick={() => {
                if (!canPin) { alert("יש להתחבר כדי להוסיף נקודות"); return; }
                if (!myPos) { alert("מיקום נוכחי עדיין לא זמין"); return; }
                setFormCoords(myPos); setFormName(""); setFormDescription(""); setFormImage(undefined); setFormOpen(true);
              }}
              disabled={!canPin || !myPos}
              className="map-btn"
              title="פתח טופס סימון במיקום הנוכחי (דורש התחברות)"
            >
              סמן את נקודתי
            </button>
            <button onClick={() => setGoToMyLocation(true)} disabled={!myPos} className="map-btn" title="עבור למיקום שלי">
              המיקום שלי
            </button>
          </div>
          <div className="map-toolbar__hint">
             {mode === "drag"
               ? "גרור את המפה בחופשיות. לחיצה לא עושה דבר."
               : "לחץ על המפה כדי לפתוח את טופס הסימון."}
           </div>
         </div>
       </div>
 
        {/* The actual map (toolbar is floating at top-center) */}
      <MapContainer
        center={initialCenter}
        zoom={8}
        className="map-container"
        maxBounds={IsraelBounds}
        maxBoundsViscosity={0.8}
      >
        {/* save map instance into mapRef */}
        <MapRefSetter />
         <TileLayer
           attribution="&copy; OpenStreetMap contributors"
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Show your current location */}
        {myPos && (
          <Marker position={myPos} icon={defaultIcon}>
            <Popup>אתה כאן</Popup>
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
          <Marker
            key={LocationItem.id}
            position={LocationItem.latlng}
            icon={defaultIcon}
            eventHandlers={{
              add: (e) => { markerRefs.current[LocationItem.id] = e.target as L.Marker; },
              remove: () => { markerRefs.current[LocationItem.id] = null; },
            }}
          >
             <Popup>
               <div>
                 <div style={{ direction: "rtl", textAlign: "right" }}>
                   <div className="popup-title">{LocationItem.name}</div>
                   {LocationItem.description && (
                     <div style={{ marginBottom: 4 }}>{LocationItem.description}</div>
                   )}
                 </div>
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
                 {/* --- Waze Icon (deep-link to navigation) aligned RTL --- */}
                 <a
                  href={`https://waze.com/ul?ll=${LocationItem.latlng[0]},${LocationItem.latlng[1]}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="ניווט עם Waze"
                  style={{ display: "flex", justifyContent: "flex-end", marginRight: 6 }}
                >
                  <FaWaze size={28} color="#33CCFF" />
                </a>
               </div>
             </Popup>
           </Marker>
         ))}

      </MapContainer>
 
       {/* Sidebar for selecting locations (currently only passes list + placeholder onSelect) */}
       <Sidebar places={places} onSelectLocation={handleSelectLocation} />
 
       {/* Pin form for adding a new point */}
       {formOpen && formCoords && (
        <div className="form-panel" dir="rtl" style={{ direction: "rtl", textAlign: "right" }}>
           <h6 className="form-panel__title">הוספת נקודה</h6>
           <div className="form-panel__coords">
             lat: {formCoords[0].toFixed(5)}, lng: {formCoords[1].toFixed(5)}
           </div>
           <input
             type="text"
             placeholder="שם"
             value={formName}
             onChange={(e) => setFormName(e.target.value)}
           />
           <textarea
             placeholder="תיאור (אופציונלי)"
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
           <div className="form-panel__actions" style={{ justifyContent: "flex-end" }}>
             <button className="form-btn" onClick={handleSaveFromForm}>
               שמור
             </button>
             <button
               className="form-btn"
               onClick={() => {
                 setFormOpen(false);
                 setFormCoords(null);
                 setFormImage(undefined);
               }}
             >
               ביטול
             </button>
           </div>
         </div>
       )}
 
       {/* Loading indicator for tracks */}
       {places.length === 0 && (
        <div className="map-loading" style={{ direction: "rtl", textAlign: "right" }}>
          טוען מסלולים...
        </div>
       )}
     </div>
   );
 }
