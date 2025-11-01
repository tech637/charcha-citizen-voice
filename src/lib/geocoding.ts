// Reverse geocoding utility to convert coordinates to readable addresses

interface GeocodingResult {
  address: string;
  error?: string;
}

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>();

export const reverseGeocode = async (latitude: number, longitude: number): Promise<GeocodingResult> => {
  try {
    // Create cache key
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    // Check cache first
    if (geocodingCache.has(cacheKey)) {
      return geocodingCache.get(cacheKey)!;
    }

    // Use OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Charcha-Citizen-Voice/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.display_name) {
      throw new Error('No address found for coordinates');
    }

    // Format the address to be more readable
    const address = formatAddress(data);
    
    // Cache the result
    geocodingCache.set(cacheKey, { address });
    
    return { address };
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return { 
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 
      error: error.message 
    };
  }
};

const formatAddress = (data: any): string => {
  try {
    const address = data.address || {};
    
    // Try to build a readable address from available components
    const parts = [];
    
    // Add specific location (park, building, etc.)
    if (address.park) parts.push(address.park);
    if (address.leisure) parts.push(address.leisure);
    if (address.amenity) parts.push(address.amenity);
    if (address.building) parts.push(address.building);
    
    // Add road/street
    if (address.road) parts.push(address.road);
    if (address.pedestrian) parts.push(address.pedestrian);
    
    // Add area/district
    if (address.suburb) parts.push(address.suburb);
    if (address.district) parts.push(address.district);
    if (address.neighbourhood) parts.push(address.neighbourhood);
    
    // Add city/town
    if (address.city) parts.push(address.city);
    if (address.town) parts.push(address.town);
    if (address.village) parts.push(address.village);
    
    // Add state/region
    if (address.state) parts.push(address.state);
    if (address.region) parts.push(address.region);
    
    // If we have good parts, join them
    if (parts.length >= 2) {
      return parts.slice(0, 3).join(', '); // Limit to 3 parts for readability
    }
    
    // Fallback to display_name if available
    if (data.display_name) {
      const displayParts = data.display_name.split(', ');
      return displayParts.slice(0, 3).join(', ');
    }
    
    // Last resort
    return 'Location not available';
  } catch (error) {
    console.error('Error formatting address:', error);
    return 'Location not available';
  }
};

// Utility function to get readable location for complaints
export const getReadableLocation = async (
  location_address?: string, 
  latitude?: number, 
  longitude?: number
): Promise<string> => {
  // If we already have a readable address, use it
  if (location_address && location_address.trim()) {
    return location_address.trim();
  }
  
  // If we have coordinates, try to reverse geocode them
  if (latitude && longitude) {
    const result = await reverseGeocode(latitude, longitude);
    return result.address;
  }
  
  // No location information available
  return 'Location not specified';
};
