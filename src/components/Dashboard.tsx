import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";

const Dashboard = () => {
  // Mock user data
  const user = {
    name: "John Doe",
    email: "john@example.com",
    complaintsCount: 5,
  };

  // Mock complaints data
  const complaints = [
    {
      id: 1,
      title: "Broken Street Light",
      description: "Street light on MG Road has been non-functional for 2 weeks",
      status: "pending",
      date: "2024-01-15",
      category: "Infrastructure",
    },
    {
      id: 2,
      title: "Garbage Collection Issue",
      description: "Garbage not collected for 3 days in Sector 12",
      status: "in-progress",
      date: "2024-01-10",
      category: "Sanitation",
    },
    {
      id: 3,
      title: "Pothole on Highway",
      description: "Large pothole causing traffic issues near City Mall",
      status: "resolved",
      date: "2024-01-05",
      category: "Roads",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in-progress":
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.complaintsCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              File New Complaint
            </Button>
            <Button variant="outline">
              Track Existing Complaint
            </Button>
          </div>
        </div>

        {/* Recent Complaints */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Complaints</h2>
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {complaint.category} • Filed on {new Date(complaint.date).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(complaint.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{complaint.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {complaint.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;