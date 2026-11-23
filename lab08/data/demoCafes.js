const OFFSETS = [
  { id: 'demo-1', name: 'Cafeneaua Demo Nord', north: 250, east: 100 },
  { id: 'demo-2', name: 'Espresso Demo', north: -400, east: 150 },
  { id: 'demo-3', name: 'Ceainăria Demo', north: 120, east: -700 },
  { id: 'demo-4', name: 'Bistro Demo', north: 900, east: 300 },
  { id: 'demo-5', name: 'Patiseria Demo', north: -150, east: -250 },
  { id: 'demo-6', name: 'Cafe Demo Sud', north: -1300, east: -200 },
];

export const TEST_POSITION = { latitude: 45.904, longitude: 28.19, accuracy: null, simulated: true };

export function generateDemoCafes({ latitude, longitude }) {
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180;
  return OFFSETS.map(offset => {
    // Aceleași deplasări și convenția 111320 m/grad din laborator.
    // Formula destinației pe sferă funcționează și aproape de poli.
    const angle = Math.hypot(offset.north, offset.east) / 111320 * Math.PI / 180;
    const bearing = Math.atan2(offset.east, offset.north);
    const nextLat = Math.asin(Math.min(1, Math.max(-1,
      Math.sin(lat) * Math.cos(angle) + Math.cos(lat) * Math.sin(angle) * Math.cos(bearing))));
    const nextLon = lon + Math.atan2(Math.sin(bearing) * Math.sin(angle) * Math.cos(lat),
      Math.cos(angle) - Math.sin(lat) * Math.sin(nextLat));
    return {
      id: offset.id, name: offset.name,
      latitude: nextLat * 180 / Math.PI,
      longitude: ((nextLon * 180 / Math.PI + 540) % 360) - 180,
    };
  });
}
