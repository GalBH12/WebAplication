import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import Sidebar from './sidebar';

// גבולות ישראל (פחות או יותר)
const IsraelBounds: [[number, number], [number, number]] = [
  [29.4, 34.2], // דרום-מערב
  [33.3, 35.9]  // צפון-מזרח
];

//מיקום+שם
interface Location {
  name: string;
  latlng: [number, number];
}

//Mapclicker
function MapClicker({ addLocation }: { addLocation: (loc: Location) => void }) {
  useMapEvents({
    click(e) {
      const name = prompt("הכנס שם למקום:");
      if (name) {
        addLocation({ name, latlng: [e.latlng.lat, e.latlng.lng] });
      }
    },
  });
  return null;
}
//ריכוז הנקודות במפה לרשימה
function MapCenterer({ location }: { location: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView(location, 13);
    }
  }, [location, map]);

  return null;
}

function Map() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [locations, setLocations] = useState<Location[]>([]);

  const [recentPlaces, setRecentPlaces] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const addLocation = (loc: Location) => {
    setLocations((prev) => [...prev, loc]);

  setRecentPlaces((prev) => {
    const exists = prev.find(p =>
      p.name === loc.name &&
      p.latlng[0] === loc.latlng[0] &&
      p.latlng[1] === loc.latlng[1]
    );

    const updated = exists ? prev : [...prev, loc];
    localStorage.setItem('recentPlaces' , JSON.stringify(updated));
    return updated;
  });
};

 useEffect(() => {
    const saved = localStorage.getItem('recentPlaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentPlaces(parsed);
      } catch (e) {
        console.error("שגיאה בקריאת recentPlaces מה-localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          setPosition([32.0853, 34.7818]) // ברירת מחדל: תל אביב
        }
      )
    } else {
      setPosition([32.0853, 34.7818])
    }
  }, [])

  
  return (
    <div>
      <Sidebar recentPlaces={recentPlaces} onSelectLocation={setSelectedLocation} onRemoveLocation={function (_name: string): void {
        throw new Error('Function not implemented.');
      } } />

      {position && (
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100vh", width: "100vw" }}
          maxBounds={IsraelBounds}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position}>
            <Popup>המיקום שלך</Popup>
          </Marker>
          <MapClicker addLocation={addLocation} />
          <MapCenterer location={selectedLocation} />
          {locations.map((loc, index) => (
          <Marker key={index} position={loc.latlng}>
          <Popup>
           <div onClick={() =>
                  setSelectedLocation(loc.latlng)
                }></div>
                  <strong>{loc.name}</strong>
                  </Popup>
          </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}

export default Map;