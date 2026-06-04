const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in meters between two lat/lng points. */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function isWithinRadius(
  userLat: number,
  userLng: number,
  academyLat: number,
  academyLng: number,
  radiusMeters: number
): boolean {
  return haversineDistanceMeters(userLat, userLng, academyLat, academyLng) <= radiusMeters;
}
