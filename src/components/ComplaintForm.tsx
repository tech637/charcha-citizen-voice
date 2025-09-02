
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This will need Supabase integration for authentication and data storage
    console.log("Complaint data:", {
      category: selectedCategory,
      description,
      isPublic,
      files: files.length,
    });
    alert("To submit complaints, please connect to Supabase first for authentication and data storage!");
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
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        console.log("Location:", position.coords);
                        alert(`Location detected: ${position.coords.latitude}, ${position.coords.longitude}`);
                      },
                      (error) => {
                        console.error("Location error:", error);
                        alert("Unable to detect location. Please enable location services.");
                      }
                    );
                  } else {
                    alert("Geolocation is not supported by this browser.");
                  }
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Detect My Location
              </Button>
              <Input placeholder="Or enter address manually..." />
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
              Share publicly in Community Feed
            </Label>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={!selectedCategory || !description.trim()}
          >
            Submit Complaint
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
