// TypeScript interfaces for locality data from grouped_by_pincode.json

export interface WardInfo {
  ward_number: number;
  ward_name: string;
  councillor_name: string;
  party_affiliation: string;
  reservation_status: string;
}

export interface MLAInfo {
  id: number;
  mla_name: string;
  constituency: string;
  party_name: string;
}

export interface MPInfo {
  "Sl. No."?: number;
  "Constituency"?: string;
  "Name of Member"?: string;
  "Party"?: string;
}

export interface Locality {
  locality_name: string;
  ward: WardInfo;
  ward_match_method: string;
  ward_confidence: number;
  mla: MLAInfo | {};
  mla_confidence: number;
  mp: MPInfo | {};
  mp_confidence: number;
  data_source: string;
}

export interface PincodeData {
  pincode: string;
  localities: Locality[];
}

export interface LocalityLookupResult {
  pincode: string;
  localities: Locality[];
  found: boolean;
}

export interface CommunityCreationData {
  locality: Locality;
  pincode: string;
  creatorId: string;
}



