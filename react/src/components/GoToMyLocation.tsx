import { useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { LatLng } from "../types/location";

export function GoToMyLocation({
  trigger,
  myPos,
  onDone,
}: {
  trigger: boolean;
  myPos: LatLng | null;
  onDone: () => void;
}) {
  const map = useMapEvents({});
  useEffect(() => {
    if (trigger && myPos) {
      map.setView(myPos, 16, { animate: true });
      onDone();
    }
  }, [trigger, myPos]);
  return null;
}