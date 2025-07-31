import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'

function Map() {
  const [position, setPosition] = useState<[number, number] | null>(null)

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
    {position && (
    <MapContainer center={position} zoom={13} style={{ height: "100vh", width: "100vw" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>המיקום שלך</Popup>
      </Marker>
    </MapContainer>
  )   }
    </div>
  )
}

export default Map