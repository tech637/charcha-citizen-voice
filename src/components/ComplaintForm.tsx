
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaint } from "@/contexts/ComplaintContext";
import { useFiles } from "@/contexts/FileContext";
import { LoginDialog } from "./LoginDialog";
import { createComplaint, createComplaintData } from "@/lib/complaints";
import { getUserApprovedCommunities } from "@/lib/communities";
import { getIndiaCommunityId } from "@/lib/india-community";
import { reverseGeocode } from "@/lib/geocoding";
import { 
  Trash, 
  Droplets, 
  Zap, 
  Car, 
  Lightbulb, 
  Home, 
  Volume2, 
  Bus, 
  Shield, 
  AlertTriangle,
  Camera,
  MapPin
} from "lucide-react";

const ComplaintForm = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  // New state for community selection
  const [communities, setCommunities] = useState<Array<{id: string, name: string}>>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("private");
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setPendingComplaint } = useComplaint();
  const { setPendingFiles } = useFiles();
  const navigate = useNavigate();

  const categories = [
    { id: "garbage", label: "Garbage", icon: Trash },
    { id: "waterlogging", label: "Waterlogging", icon: Droplets },
    { id: "electricity", label: "Electricity", icon: Zap },
    { id: "roads", label: "Roads", icon: Car },
    { id: "parking", label: "Parking", icon: Car },
    { id: "street-lights", label: "Street Lights", icon: Lightbulb },
    { id: "sewage", label: "Sewage", icon: Home },
    { id: "noise-pollution", label: "Noise Pollution", icon: Volume2 },
    { id: "public-transport", label: "Public Transport", icon: Bus },
    { id: "illegal-encroachment", label: "Illegal Encroachment", icon: AlertTriangle },
    { id: "safety", label: "Safety", icon: Shield },
    { id: "other", label: "Other", icon: AlertTriangle },
  ];

  // Load approved communities for the current user
  useEffect(() => {
    const loadCommunities = async () => {
      if (!user) {
        setCommunities([]);
        return;
      }
      setLoadingCommunities(true);
      try {
        const { data } = await getUserApprovedCommunities(user.id);
        setCommunities(data || []);
      } catch (error) {
        console.error('Error loading approved communities:', error);
      } finally {
        setLoadingCommunities(false);
      }
    };
    loadCommunities();
  }, [user]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          // Reverse geocode to get a human-friendly address
          try {
            const result = await reverseGeocode(lat, lon);
            setLocation(result.address);
            toast({ title: "Location Detected", description: result.address });
          } catch (e) {
            toast({
              title: "Location Detected",
              description: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            });
          }
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Error",
            description: "Unable to detect a precise location. You can try again or enter address manually.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a category and provide a description.",
        variant: "destructive",
      });
      return;
    }

    // Prepare complaint data using new visibility system
    let complaintData;
    
    if (selectedVisibility === "private") {
      // Private complaint
      complaintData = createComplaintData({
        category: selectedCategory,
        description: description.trim(),
        location_address: location || undefined,
        latitude,
        longitude,
        files: files.length > 0 ? files : undefined,
        visibility: 'private'
      });
    } else {
      // Community complaint
      const selectedCommunity = communities.find(c => c.id === selectedVisibility);
      if (!selectedCommunity) {
        toast({
          title: "Invalid Selection",
          description: "Please select a valid community or private mode.",
          variant: "destructive",
        });
        return;
      }
      
      complaintData = createComplaintData({
        category: selectedCategory,
        description: description.trim(),
        location_address: location || undefined,
        latitude,
        longitude,
        files: files.length > 0 ? files : undefined,
        visibility: { type: 'community', community_id: selectedCommunity.id }
      });
    }

    // Check if user is logged in
    if (!user) {
      // Store complaint data (without files) in localStorage for OAuth redirects
      const complaintWithoutFiles = {
        ...complaintData,
        files: undefined
      };
      console.log('User not logged in, saving pending complaint:', complaintWithoutFiles);
      setPendingComplaint(complaintWithoutFiles);
      
      // Store files separately in FileContext (with base64 encoding for localStorage)
      if (files.length > 0) {
        const filePromises = files.map(async (file) => {
          return new Promise<{ name: string; type: string; size: number; data: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        });
        
        const storedFiles = await Promise.all(filePromises);
        setPendingFiles(storedFiles);
        
        toast({
          title: "Files Ready for Upload",
          description: "Your files are ready. Please login to complete your complaint submission.",
        });
      }
      
      setShowLoginDialog(true);
      return;
    }

    // User is logged in, submit the complaint
    setIsSubmitting(true);

    try {
      const { data, error } = await createComplaint(complaintData, user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Complaint Submitted!",
        description: "Your complaint has been submitted successfully. You'll receive updates via email.",
      });

      // Reset form
      setSelectedCategory("");
      setDescription("");
      setSelectedVisibility("private");
      setFiles([]);
      setLocation("");
      setLatitude(undefined);
      setLongitude(undefined);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#E2EEF9] border border-[#001F3F]/20 rounded-2xl shadow-lg">
      <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-8 pt-6 sm:pt-8">
        <CardTitle className="text-2xl sm:text-3xl text-center font-bold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>File Your Complaint</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Step 1: Category Selection */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base sm:text-lg font-semibold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>Select Complaint Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-2 sm:p-4 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all duration-300 flex flex-col items-center gap-1 sm:gap-2 ${
                      selectedCategory === category.id
                        ? "border-[#001F3F] bg-[#001F3F] text-white shadow-lg"
                        : "border-[#001F3F]/30 bg-white hover:border-[#001F3F] hover:shadow-md text-[#001F3F]"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 sm:h-6 sm:w-6" />
                    <span className="text-center leading-tight">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Description */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="description" className="text-base sm:text-lg font-semibold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
              Complaint Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              maxLength={300}
              className="min-h-[100px] sm:min-h-[120px] rounded-lg border-[#001F3F]/30 focus:border-[#001F3F] focus:ring-[#001F3F] placeholder:text-gray-400 text-[#001F3F] text-sm sm:text-base"
            />
            <div className="text-xs sm:text-sm text-gray-500 text-right">
              {description.length}/300 characters
            </div>
          </div>

          {/* Step 3: File Upload */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-base sm:text-lg font-semibold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>Upload Photos/Videos</Label>
            <div className="space-y-2 sm:space-y-3">
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="cursor-pointer rounded-lg border-[#001F3F]/30 focus:border-[#001F3F] focus:ring-[#001F3F] text-sm sm:text-base"
              />
              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <Badge
                        variant="secondary"
                        className="w-full justify-between p-2 sm:p-3 h-auto bg-white border border-[#001F3F]/30 rounded-lg"
                      >
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <Camera className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[#001F3F]" />
                          <span className="truncate text-xs text-[#001F3F]">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-1 sm:ml-2 text-gray-500 hover:text-[#001F3F] transition-colors text-sm sm:text-base"
                        >
                          ×
                        </button>
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Location */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-base sm:text-lg font-semibold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>Location</Label>
            <div className="space-y-2 sm:space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg border-[#001F3F]/30 hover:border-[#001F3F] hover:bg-[#001F3F]/10 text-[#001F3F] text-sm sm:text-base py-2 sm:py-3"
                onClick={handleLocationDetection}
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Detect My Location
              </Button>
              <Input 
                placeholder="Or enter address manually..." 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-lg border-[#001F3F]/30 focus:border-[#001F3F] focus:ring-[#001F3F] placeholder:text-gray-400 text-[#001F3F] text-sm sm:text-base"
              />
              {(location || (latitude && longitude)) && (
                <p className="text-xs sm:text-sm text-gray-500">
                  Location: {location || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
                </p>
              )}
            </div>
          </div>

          {/* Step 5: Visibility / Community Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-base sm:text-lg font-semibold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>Visibility / Community</Label>
            <Select 
              value={selectedVisibility} 
              onValueChange={setSelectedVisibility}
              disabled={loadingCommunities}
            >
              <SelectTrigger className="w-full rounded-lg border-[#001F3F]/30 focus:border-[#001F3F] focus:ring-[#001F3F] text-[#001F3F] text-sm sm:text-base">
                <SelectValue placeholder={loadingCommunities ? "Loading communities..." : "Select visibility option"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Only visible to you)</SelectItem>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVisibility === "private" && (
              <p className="text-xs sm:text-sm text-gray-500">
                This complaint will only be visible to you.
              </p>
            )}
            {selectedVisibility !== "private" && (
              <p className="text-xs sm:text-sm text-gray-500">
                This complaint will be visible to members of the selected community.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#001F3F] hover:bg-[#001F3F]/90 text-white font-bold py-2 sm:py-3 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
            disabled={!selectedCategory || !description.trim() || isSubmitting}
            style={{fontFamily: 'Montserrat-Bold, Helvetica'}}
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </Button>
        </form>
      </CardContent>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </Card>
  );
};

export default ComplaintForm;
