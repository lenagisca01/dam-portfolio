const EARTH_RADIUS_M = 6371000;
const radians = degrees => degrees * Math.PI / 180;

export function isCoordinate(point) {
  return !!point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
}

export function distanceMeters(a, b) {
  if (!isCoordinate(a) || !isCoordinate(b)) throw new Error('Coordonate geografice invalide.');
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  // Limitarea evită NaN din erori de rotunjire la puncte antipodale.
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  const rounded = Math.round(meters);
  return rounded < 1000 ? `${rounded} m` : `${(rounded / 1000).toFixed(1)} km`;
}

export function sortByDistance(origin, places) {
  return places.map(place => ({ ...place, distance: distanceMeters(origin, place) }))
    .sort((a, b) => a.distance - b.distance);
}
