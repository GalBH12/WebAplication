import { useMapEvents } from "react-leaflet";
import type { LatLng } from "../types/location";

/**
 * MapClicker
 *
 * - Listens for map clicks via react-leaflet.
 * - If the user is allowed to pin (`canPin` true and mode not "drag"),
 *   it opens the form with empty fields and sets the clicked coordinates.
 *
 * @param mode            current map interaction mode (e.g. "drag", "pin")
 * @param canPin          whether the user is allowed to add pins
 * @param setFormName     setter for the pin name field
 * @param setFormDescription setter for the pin description field
 * @param setFormImage    setter for the pin image field
 * @param setFormCoords   setter for the coordinates of the new pin
 * @param setFormOpen     setter to open the pin creation form
 */
export function MapClicker({
  mode,
  canPin,
  setFormName,
  setFormDescription,
  setFormImage,
  setFormCoords,
  setFormOpen,
}: {
  mode: string;                          // current map mode ("drag" disables pinning)
  canPin: boolean;                       // can the user add pins?
  setFormName: (v: string) => void;      // reset/set name input
  setFormDescription: (v: string) => void; // reset/set description input
  setFormImage: (v: string | undefined) => void; // reset/set image input
  setFormCoords: (v: LatLng) => void;    // store chosen coordinates
  setFormOpen: (v: boolean) => void;     // open/close form UI
}) {
  // Attach click handler to the map
  useMapEvents({
    click: (e) => {
      // If map is in "drag" mode, ignore clicks
      if (mode === "drag") return;

      // If user is not allowed to pin, show alert and stop
      if (!canPin) {
        alert("Please log in to add points");
        return;
      }

      // Build LatLng tuple from click event
      const coords: LatLng = [e.latlng.lat, e.latlng.lng];

      // Reset form state to empty/initial values
      setFormName("");
      setFormDescription("");
      setFormImage(undefined);

      // Pass coordinates and open the form modal
      setFormCoords(coords);
      setFormOpen(true);
    },
  });

  // Component renders nothing, it only attaches map events
  return null;
}
