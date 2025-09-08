
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaint } from "@/contexts/ComplaintContext";
import { useFiles } from "@/contexts/FileContext";
import { LoginDialog } from "./LoginDialog";
import { createComplaint } from "@/lib/complaints";
import { getIndiaCommunityId } from "@/lib/india-community";
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
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
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
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          toast({
            title: "Location Detected",
            description: `Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Error",
            description: "Unable to detect location. Please enable location services or enter address manually.",
            variant: "destructive",
          });
        }
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

    // Get India community ID for public complaints
    let indiaCommunityId = null;
    if (isPublic) {
      try {
        indiaCommunityId = await getIndiaCommunityId();
        if (!indiaCommunityId) {
          console.warn('India community not found, creating complaint without community assignment');
        }
      } catch (error) {
        console.error('Error fetching India community ID:', error);
      }
    }

    // Prepare complaint data
    const complaintData = {
      category: selectedCategory,
      description: description.trim(),
      location_address: location || undefined,
      latitude,
      longitude,
      is_public: isPublic,
      community_id: indiaCommunityId || undefined,
      files: files.length > 0 ? files : undefined,
    };

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
      setIsPublic(false);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">File Your Complaint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Category Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Complaint Category</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors flex flex-col items-center gap-2 ${
                      selectedCategory === category.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Complaint Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              maxLength={300}
              className="min-h-[100px]"
            />
            <div className="text-sm text-muted-foreground text-right">
              {description.length}/300 characters
            </div>
          </div>

          {/* Step 3: File Upload */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Upload Photos/Videos</Label>
            <div className="space-y-3">
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <Badge
                        variant="secondary"
                        className="w-full justify-between p-2 h-auto"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Camera className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-2 text-muted-foreground hover:text-destructive"
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
          <div className="space-y-3">
            <Label className="text-base font-semibold">Location</Label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleLocationDetection}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Detect My Location
              </Button>
              <Input 
                placeholder="Or enter address manually..." 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {(latitude && longitude) && (
                <p className="text-sm text-muted-foreground">
                  Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Step 5: Public Sharing */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            />
            <Label htmlFor="public" className="text-sm font-medium">
              Share publicly
            </Label>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={!selectedCategory || !description.trim() || isSubmitting}
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
