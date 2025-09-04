import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function CenterMapOnLocation({ center }: { center?: [number, number] }) {
  const map = useMap();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, 16, { animate: true });
      // Clear navigation state after centering so it doesn't repeat
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 1000);
    }
  }, [center, map, navigate, location.pathname]);

  return null;
}