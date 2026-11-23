import React, { useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { formatDistance } from '../utils/distance';

export default function MapPanel({ position, cafes, selectedId, onSelect }) {
  const mapRef = useRef(null);
  const selected = cafes.find(cafe => cafe.id === selectedId);
  const selectedLat = selected?.latitude;
  const selectedLon = selected?.longitude;

  useEffect(() => {
    if (selectedLat == null || selectedLon == null) return;
    mapRef.current?.animateToRegion({
      latitude: selectedLat, longitude: selectedLon,
      latitudeDelta: 0.012, longitudeDelta: 0.012,
    }, 400);
  }, [selectedLat, selectedLon]);

  return <MapView ref={mapRef} style={{ flex: 1 }}
    initialRegion={{ latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
    showsUserLocation={!position.simulated}
    onMapReady={() => mapRef.current?.fitToCoordinates([position, ...cafes], {
      edgePadding: { top: 45, right: 45, bottom: 45, left: 45 }, animated: false,
    })}>
    {position.simulated && <Marker coordinate={position} title="Poziție simulată" pinColor="#386EB3" />}
    {cafes.map(cafe => <Marker key={cafe.id}
      coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
      title={cafe.name} description={formatDistance(cafe.distance)}
      pinColor={cafe.id === selectedId ? '#174A43' : '#C9854D'}
      onPress={() => onSelect(cafe.id)} />)}
  </MapView>;
}
