import { useState, useEffect } from 'react';
import { formatLocation, formatLocationSync } from '@/lib/locationUtils';

interface UseLocationFormatResult {
  formattedLocation: string;
  isLoading: boolean;
  error: string | null;
}

export const useLocationFormat = (
  location_address?: string,
  latitude?: number,
  longitude?: number
): UseLocationFormatResult => {
  const [formattedLocation, setFormattedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocation = async () => {
      // If no location data, set empty
      if (!location_address?.trim() && !(latitude && longitude)) {
        setFormattedLocation('Location not specified');
        return;
      }

      // If we have a text address, use it immediately
      if (location_address?.trim()) {
        setFormattedLocation(location_address.trim());
        return;
      }

      // If we have coordinates, show them immediately, then try to geocode
      if (latitude && longitude) {
        // Show coordinates immediately
        setFormattedLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        // Try to get readable address
        setIsLoading(true);
        setError(null);
        
        try {
          const readableLocation = await formatLocation(location_address, latitude, longitude);
          setFormattedLocation(readableLocation);
        } catch (err: any) {
          console.error('Location formatting error:', err);
          setError(err.message || 'Failed to load location');
          // Keep showing coordinates as fallback
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLocation();
  }, [location_address, latitude, longitude]);

  return {
    formattedLocation,
    isLoading,
    error
  };
};
