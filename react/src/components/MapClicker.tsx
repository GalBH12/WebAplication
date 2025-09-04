import { useMapEvents } from "react-leaflet";
import type { LatLng } from "../types/location";

  // Handle map clicks for adding pins
export function MapClicker({
  mode,
  canPin,
  setFormName,
  setFormDescription,
  setFormImage,
  setFormCoords,
  setFormOpen,
}: {
  mode: string;
  canPin: boolean;
  setFormName: (v: string) => void;
  setFormDescription: (v: string) => void;
  setFormImage: (v: string | undefined) => void;
  setFormCoords: (v: LatLng) => void;
  setFormOpen: (v: boolean) => void;
}) {
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