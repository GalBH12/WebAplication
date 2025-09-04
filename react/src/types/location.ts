// A tuple representing a latitude and longitude
export type LatLng = [number, number];

// What a marker/track looks like
export interface LocationItem {
  id: string;
  name: string;
  latlng: LatLng;
  description?: string;
  image?: string;
  createdAt?: number;
  reviews?: { user: string; text: string; createdAt: string }[];
}