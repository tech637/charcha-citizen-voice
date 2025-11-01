import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Users, 
  Building2, 
  User,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  validatePincode, 
  getLocalitiesByPincode, 
  getLocalityDetailsFromIndex,
  getWardDisplayInfo,
  getMLADisplayInfo,
  getMPDisplayInfo
} from '@/lib/locality';

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

interface PincodeLocalitySelectorProps {
  onLocalitySelected: (locality: any, pincode: string) => void;
  onBack: () => void;
}

const PincodeLocalitySelector: React.FC<PincodeLocalitySelectorProps> = ({
  onLocalitySelected,
  onBack
}) => {
  const [pincode, setPincode] = useState('');
  const [lookupResult, setLookupResult] = useState<string[] | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<FinalDatabaseEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePincodeSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validatePincode(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLookupResult(null);
    setSelectedLocality(null);

    try {
      const list = await getLocalitiesByPincode(pincode);
      setLookupResult(list);
      if (!list || list.length === 0) setError('No localities found for this pincode');
    } catch (err: any) {
      setError(err.message || 'Failed to lookup localities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalitySelect = async (localityName: string) => {
    if (!lookupResult) return;
    const details = await getLocalityDetailsFromIndex(pincode, localityName);
    if (details) setSelectedLocality(details);
  };

  const handleConfirmSelection = () => {
    if (selectedLocality) {
      // Convert FinalDatabaseEntry to the format expected by JoinCommunityForm
      onLocalitySelected(
        {
          locality_name: selectedLocality.display_name,
          ward: selectedLocality.ward ? {
            ward_name: selectedLocality.ward.name,
            ward_number: selectedLocality.ward.number,
            councillor_name: selectedLocality.ward.councillor
          } : {},
          mla: selectedLocality.mla ? {
            mla_name: selectedLocality.mla.name,
            constituency: selectedLocality.mla.constituency,
            party_name: selectedLocality.mla.party
          } : {},
          mp: selectedLocality.mp ? {
            mp_name: selectedLocality.mp.name,
            constituency: selectedLocality.mp.constituency,
            party: selectedLocality.mp.party
          } : {}
        },
        pincode
      );
    }
  };

  return (
    <div className="space-y-4 px-2 sm:space-y-6 sm:px-0">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
          Create New Community
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Enter your pincode to find localities in your area
        </p>
      </div>

      {/* Pincode Input */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[#001F3F] text-lg sm:text-xl">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            Enter Pincode
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
                Pincode (6 digits)
              </Label>
              <Input
                id="pincode"
                type="text"
                placeholder="e.g., 110001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                className="mt-1"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePincodeSubmit(e as any);
                  }
                }}
              />
            </div>
            <Button 
              onClick={handlePincodeSubmit}
              className="w-full bg-[#001F3F] hover:bg-[#001F3F]/90"
              disabled={isLoading || !pincode.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Looking up localities...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Find Localities
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Locality Selection */}
      {lookupResult && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[#001F3F] text-lg sm:text-xl">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Select Locality
            </CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">Found {lookupResult?.length || 0} localities in pincode {pincode}</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Choose your locality
              </Label>
              <Select onValueChange={handleLocalitySelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a locality" />
                </SelectTrigger>
                <SelectContent>
                  {lookupResult?.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Locality Details */}
            {selectedLocality && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg text-[#001F3F]">
                    {selectedLocality.display_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Ward Information */}
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Ward Information</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {getWardDisplayInfo(selectedLocality)}
                      </p>
                    </div>
                  </div>

                  {/* MLA Information */}
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">MLA</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {getMLADisplayInfo(selectedLocality)}
                      </p>
                    </div>
                  </div>

                  {/* MP Information */}
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">MP</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {getMPDisplayInfo(selectedLocality)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleConfirmSelection}
                      className="w-full sm:flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Community
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedLocality(null)}
                      className="w-full sm:flex-1"
                    >
                      Change Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-center px-2">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Back to Community Selection
        </Button>
      </div>
    </div>
  );
};

export default PincodeLocalitySelector;
