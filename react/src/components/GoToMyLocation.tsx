import { useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { LatLng } from "../types/location";

/**
 * GoToMyLocation
 *
 * - Utility component for react-leaflet that recenters the map
 *   to the user's location when `trigger` is set to true.
 * - Once centering is done, calls the `onDone` callback to let the parent
 *   reset the trigger flag or perform any cleanup.
 *
 * @param trigger boolean flag to trigger recentering
 * @param myPos   user's position [lat, lng] or null
 * @param onDone  callback to run after the map is centered
 */
export function GoToMyLocation({
  trigger,
  myPos,
  onDone,
}: {
  trigger: boolean;   // when true, trigger a recenter
  myPos: LatLng | null; // current position (or null if unavailable)
  onDone: () => void; // callback fired after recentering
}) {
  // Access Leaflet map instance (no events used, but hook required to get map)
  const map = useMapEvents({});

  useEffect(() => {
    // If trigger flag is set and we have a position, recenter map
    if (trigger && myPos) {
      map.setView(myPos, 16, { animate: true }); // zoom to 16 with animation
      onDone(); // notify parent so trigger can be reset
    }
  }, [trigger, myPos]); // re-run when trigger or myPos changes

  // Component does not render anything visible
  return null;
}
