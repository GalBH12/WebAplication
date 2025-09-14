import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * CenterMapOnLocation Component
 *
 * - A utility component for react-leaflet.
 * - Centers the map on the given `center` coordinates when they change.
 * - Uses animation when moving the map view.
 * - After centering, clears the navigation state to prevent repeated triggers.
 *
 * @param center Optional latitude/longitude tuple [lat, lng].
 */
export function CenterMapOnLocation({ center }: { center?: [number, number] }) {
  const map = useMap();         // Access the Leaflet map instance
  const navigate = useNavigate(); // React Router navigation
  const location = useLocation(); // Current location object (pathname + state)

  useEffect(() => {
    // Ensure center is defined and is a valid [lat, lng] tuple
    if (center && Array.isArray(center) && center.length === 2) {
      // Move the map smoothly to the given center with zoom level 16
      map.setView(center, 16, { animate: true });

      // Clear navigation state after centering (prevents repeated recentering
      // if the same state is reused on navigation)
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 1000); // Delay ensures map finishes animating first
    }
  }, [center, map, navigate, location.pathname]);

  // This component does not render anything visually
  return null;
}
