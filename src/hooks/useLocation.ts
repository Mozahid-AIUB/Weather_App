import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionStatus('denied');
        setError('Location permission denied. Please search for a city manually.');
        return null;
      }

      setPermissionStatus('granted');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      };
      setLocation(coords);
      return coords;
    } catch (err) {
      setError('Could not get location. Please try again or search manually.');
      return null;
    }
  };

  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      requestLocation();
    }
  }, []);

  return { location, permissionStatus, error, requestLocation };
};
