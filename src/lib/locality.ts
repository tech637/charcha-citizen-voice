import { PincodeData, LocalityLookupResult, Locality } from '@/types/locality';

// Define the structure of final_database.json
interface FinalDatabaseEntry {
  display_name: string;
  pincode: string;
  status?: string;
  note?: string;
  ward?: {
    name: string;
    number: number;
    councillor: string;
    party: string;
  };
  mla?: {
    constituency: string;
    name: string;
    party: string;
  };
  mp?: {
    constituency: string;
    name: string;
    party: string;
  };
}

interface FinalDatabase {
  [pincode: string]: FinalDatabaseEntry[];
}

// Cache for the locality data to avoid repeated fetches
let localityDataCache: FinalDatabase | null = null;

/**
 * Load locality data from the final database JSON file
 */
export const loadLocalityData = async (): Promise<FinalDatabase> => {
  if (localityDataCache) {
    return localityDataCache;
  }

  try {
    // Bypass browser cache to reflect latest updates to the JSON file
    const response = await fetch('/data/final_database.json', { cache: 'no-store' as RequestCache });
    if (!response.ok) {
      throw new Error(`Failed to load locality data: ${response.statusText}`);
    }
    
    const data: FinalDatabase = await response.json();
    localityDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading locality data:', error);
    throw new Error('Failed to load locality data. Please try again later.');
  }
};

// Allow callers to force a reload of the JSON data if needed
export const invalidateLocalityCache = () => {
  localityDataCache = null;
};

/**
 * Get localities by pincode from final database
 */
export const getLocalitiesByPincode = async (pincode: string): Promise<string[]> => {
  try {
    const data = await loadLocalityData();
    const pincodeKey = pincode.trim();
    
    const entries = data[pincodeKey];
    if (!entries || entries.length === 0) {
      return [];
    }

    // Return display names of localities
    return entries.map(entry => entry.display_name);
  } catch (error) {
    console.error('Error getting localities by pincode:', error);
    return [];
  }
};

/**
 * Get locality details by name and pincode from final database
 */
export const getLocalityDetailsFromIndex = async (pincode: string, localityName: string): Promise<FinalDatabaseEntry | null> => {
  try {
    const data = await loadLocalityData();
    const pincodeKey = pincode.trim();
    
    const entries = data[pincodeKey];
    if (!entries || entries.length === 0) {
      return null;
    }

    // Find the locality by display name (case insensitive)
    const entry = entries.find(entry => 
      entry.display_name.toLowerCase() === localityName.toLowerCase()
    );

    return entry || null;
  } catch (error) {
    console.error('Error getting locality details:', error);
    return null;
  }
};

/**
 * Validate pincode format (6 digits)
 */
export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode.trim());
};

/**
 * Get ward display info from final database entry
 */
export const getWardDisplayInfo = (entry: FinalDatabaseEntry): string => {
  if (!entry.ward) {
    return 'Ward information not available';
  }
  
  const ward = entry.ward;
  return `${ward.name} (Ward ${ward.number}) - ${ward.councillor}`;
};

/**
 * Get MLA display info from final database entry
 */
export const getMLADisplayInfo = (entry: FinalDatabaseEntry): string => {
  if (!entry.mla) {
    return 'MLA information not available';
  }
  
  const mla = entry.mla;
  return `${mla.name} (${mla.constituency}) - ${mla.party}`;
};

/**
 * Get MP display info from final database entry
 */
export const getMPDisplayInfo = (entry: FinalDatabaseEntry): string => {
  if (!entry.mp) {
    return 'MP information not available';
  }
  
  const mp = entry.mp;
  return `${mp.name} (${mp.constituency}) - ${mp.party}`;
};

// Legacy functions for backward compatibility
export const lookupLocalitiesByPincode = async (pincode: string): Promise<LocalityLookupResult> => {
  try {
    const localities = await getLocalitiesByPincode(pincode);
    
    return {
      pincode: pincode.trim(),
      localities: localities.map(name => ({
        locality_name: name,
        ward: {},
        mla: {},
        mp: {}
      })),
      found: localities.length > 0
    };
  } catch (error) {
    console.error('Error looking up localities:', error);
    throw new Error('Failed to lookup localities. Please try again.');
  }
};

export const getLocalityDetails = async (pincode: string, localityName: string): Promise<Locality | null> => {
  try {
    const entry = await getLocalityDetailsFromIndex(pincode, localityName);
    
    if (!entry) {
      return null;
    }

    // Convert FinalDatabaseEntry to Locality format
    return {
      locality_name: entry.display_name,
      ward: entry.ward ? {
        ward_name: entry.ward.name,
        ward_number: entry.ward.number,
        councillor_name: entry.ward.councillor
      } : {},
      mla: entry.mla ? {
        mla_name: entry.mla.name,
        constituency: entry.mla.constituency,
        party_name: entry.mla.party
      } : {},
      mp: entry.mp ? {
        mp_name: entry.mp.name,
        constituency: entry.mp.constituency,
        party: entry.mp.party
      } : {}
    };
  } catch (error) {
    console.error('Error getting locality details:', error);
    return null;
  }
};

export const formatLocalityDisplayName = (locality: Locality): string => {
  return locality.locality_name;
};