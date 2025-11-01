// Enhanced utility for formatting location display with reverse geocoding

import { getReadableLocation } from './geocoding';

// Synchronous version for immediate display (shows coordinates while loading)
export const formatLocationSync = (
  location_address?: string, 
  latitude?: number, 
  longitude?: number
): string => {
  // Priority 1: Use existing text address if available
  if (location_address && location_address.trim()) {
    return location_address.trim();
  }
  
  // Priority 2: Format coordinates nicely if available
  if (latitude && longitude) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  
  // Priority 3: Fallback
  return 'Location not specified';
};

// Asynchronous version that converts coordinates to readable addresses
export const formatLocation = async (
  location_address?: string, 
  latitude?: number, 
  longitude?: number
): Promise<string> => {
  return await getReadableLocation(location_address, latitude, longitude);
};

// Helper to check if location data is available
export const hasLocationData = (
  location_address?: string, 
  latitude?: number, 
  longitude?: number
): boolean => {
  return !!(location_address?.trim() || (latitude && longitude));
};
