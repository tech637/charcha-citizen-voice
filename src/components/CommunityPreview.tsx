
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";

const CommunityPreview = () => {
  const sampleComplaints = [
    {
      id: 1,
      category: "Garbage",
      description: "Overflowing garbage bins at Green Park, causing health hazards...",
      location: "Green Park, Sector 15",
      status: "Open",
      timeAgo: "2 hours ago"
    },
    {
      id: 2,
      category: "Waterlogging", 
      description: "Severe waterlogging on Main Street after recent rains...",
      location: "Main Street, Downtown",
      status: "In Progress",
      timeAgo: "1 day ago"
    },
    {
      id: 3,
      category: "Street Lights",
      description: "Multiple street lights not working in residential area...",
      location: "Residential Area, Block A",
      status: "Open",
      timeAgo: "3 days ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive";
      case "In Progress":
        return "secondary";
      case "Resolved":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Community Feed</h2>
          <p className="text-muted-foreground">See what issues your neighbors are reporting</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sampleComplaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{complaint.category}</Badge>
                  <Badge variant={getStatusColor(complaint.status) as any}>
                    {complaint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3 line-clamp-2">{complaint.description}</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{complaint.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{complaint.timeAgo}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg">
            View More →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPreview;
