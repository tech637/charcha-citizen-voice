import React from "react"
import { Container, PageHeader, Section, Grid, Stack } from "./ui/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { EmptyState } from "./ui/empty-state"
import { ComplaintCard } from "./ui/complaint-card"
import { StatusBadge, SubmittedBadge, InProgressBadge, ResolvedBadge } from "./ui/status-badge"
import { FloatingActionButton } from "./ui/floating-action-button"
import { FormField } from "./ui/form-field"
import { 
  FileText, 
  MapPin, 
  Users, 
  TrendingUp, 
  Plus, 
  Search,
  Filter,
  Bell
} from "lucide-react"

const UIShowcase: React.FC = () => {
  const handleCreateComplaint = () => {
    console.log("Create complaint clicked")
  }

  const handleViewComplaint = () => {
    console.log("View complaint clicked")
  }

  const sampleComplaints = [
    {
      id: "comp-001",
      title: "Broken streetlight on Main Street",
      description: "The streetlight has been flickering for weeks and now it's completely dark. This creates a safety hazard for pedestrians walking at night.",
      status: "submitted" as const,
      category: "Infrastructure",
      location: "Main Street, Downtown",
      createdAt: "2024-01-15T10:30:00Z",
      author: "John Doe",
      hasImages: true,
      hasDocuments: false
    },
    {
      id: "comp-002", 
      title: "Pothole causing vehicle damage",
      description: "Large pothole on Oak Avenue is causing damage to vehicles. Several residents have reported tire damage.",
      status: "in-progress" as const,
      category: "Roads",
      location: "Oak Avenue, Sector 5",
      createdAt: "2024-01-14T14:20:00Z",
      author: "Jane Smith",
      hasImages: true,
      hasDocuments: true
    },
    {
      id: "comp-003",
      title: "Garbage collection missed for 3 days",
      description: "Our street hasn't had garbage collection in 3 days. The bins are overflowing and creating hygiene issues.",
      status: "resolved" as const,
      category: "Sanitation",
      location: "Pine Street, Block B",
      createdAt: "2024-01-13T09:15:00Z",
      author: "Mike Johnson",
      hasImages: false,
      hasDocuments: false
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <Container>
        <PageHeader
          title="UI Design System Showcase"
          description="Modern, mobile-first components with clean aesthetics and intuitive interactions"
          action={
            <Button size="lg">
              <Plus className="h-4 w-4" />
              New Component
            </Button>
          }
        />

        <Stack spacing="2xl">
          {/* Cards Section */}
          <Section 
            title="Card Components"
            description="Clean, elevated cards with subtle shadows and modern styling"
          >
            <Grid cols={3} gap="lg">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>Standard card with soft shadows</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is a default card with clean styling and proper spacing.
                  </p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>Enhanced shadows for prominence</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This elevated card stands out with stronger shadows.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outline">
                <CardHeader>
                  <CardTitle>Outline Card</CardTitle>
                  <CardDescription>Subtle border styling</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This card uses borders instead of shadows.
                  </p>
                </CardContent>
              </Card>
            </Grid>
          </Section>

          {/* Buttons Section */}
          <Section
            title="Interactive Buttons"
            description="Touch-friendly buttons with clear visual hierarchy and feedback"
          >
            <Stack direction="horizontal" spacing="md" className="flex-wrap">
              <Button>Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="destructive">Destructive</Button>
            </Stack>

            <Stack direction="horizontal" spacing="md" className="flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Search className="h-4 w-4" /></Button>
              <Button size="icon-lg"><Filter className="h-5 w-5" /></Button>
            </Stack>
          </Section>

          {/* Status Badges */}
          <Section
            title="Status Indicators"
            description="Clear status communication with color coding and animations"
          >
            <Stack direction="horizontal" spacing="md" className="flex-wrap">
              <SubmittedBadge />
              <InProgressBadge />
              <ResolvedBadge />
              <StatusBadge variant="pending">Pending</StatusBadge>
              <StatusBadge variant="approved">Approved</StatusBadge>
              <StatusBadge variant="rejected">Rejected</StatusBadge>
            </Stack>
          </Section>

          {/* Form Elements */}
          <Section
            title="Form Components"
            description="Clean, accessible form elements with proper validation states"
          >
            <Grid cols={2} gap="lg">
              <FormField
                label="Email Address"
                description="We'll never share your email"
                required
              >
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                />
              </FormField>

              <FormField
                label="Password"
                error="Password must be at least 8 characters"
              >
                <Input 
                  type="password" 
                  placeholder="Enter password"
                  error
                />
              </FormField>

              <FormField
                label="Phone Number"
                success="Valid phone number format"
              >
                <Input 
                  type="tel" 
                  placeholder="+1 (555) 123-4567"
                  success
                />
              </FormField>

              <FormField
                label="Search"
                description="Search for complaints, locations, or categories"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Type to search..."
                    className="pl-10"
                  />
                </div>
              </FormField>
            </Grid>
          </Section>

          {/* Complaint Cards */}
          <Section
            title="Complaint Cards"
            description="Information-rich cards for displaying civic complaints with clear hierarchy"
          >
            <Stack spacing="lg">
              {sampleComplaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  {...complaint}
                  onView={handleViewComplaint}
                />
              ))}
            </Stack>

            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Compact Variant</h4>
              <Stack spacing="sm">
                {sampleComplaints.map((complaint) => (
                  <ComplaintCard
                    key={`compact-${complaint.id}`}
                    {...complaint}
                    variant="compact"
                    onView={handleViewComplaint}
                  />
                ))}
              </Stack>
            </div>
          </Section>

          {/* Empty States */}
          <Section
            title="Empty States"
            description="Friendly, informative empty states with clear calls to action"
          >
            <Grid cols={2} gap="lg">
              <Card>
                <EmptyState
                  icon={FileText}
                  title="No complaints yet"
                  description="Start by filing your first civic complaint to help improve your community."
                  action={{
                    label: "File Complaint",
                    onClick: handleCreateComplaint
                  }}
                  size="md"
                />
              </Card>

              <Card>
                <EmptyState
                  icon={Users}
                  title="Join a community"
                  description="Connect with neighbors and stay informed about local issues."
                  action={{
                    label: "Browse Communities",
                    onClick: () => console.log("Browse communities"),
                    variant: "outline"
                  }}
                  size="md"
                />
              </Card>
            </Grid>
          </Section>

          {/* Statistics Cards */}
          <Section
            title="Dashboard Statistics"
            description="Clean data presentation with visual hierarchy"
          >
            <Grid cols={4} gap="md">
              <Card variant="elevated">
                <CardContent className="p-6">
                  <Stack direction="horizontal" align="center" justify="between">
                    <div>
                      <p className="text-2xl font-bold">247</p>
                      <p className="text-sm text-muted-foreground">Total Complaints</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <Stack direction="horizontal" align="center" justify="between">
                    <div>
                      <p className="text-2xl font-bold">89</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <Stack direction="horizontal" align="center" justify="between">
                    <div>
                      <p className="text-2xl font-bold">158</p>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                    </div>
                    <div className="p-3 bg-success/10 rounded-xl">
                      <MapPin className="h-6 w-6 text-success" />
                    </div>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <Stack direction="horizontal" align="center" justify="between">
                    <div>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-sm text-muted-foreground">Communities</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Section>
        </Stack>
      </Container>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={handleCreateComplaint}
        position="bottom-right"
      >
        Create New Complaint
      </FloatingActionButton>
    </div>
  )
}

export default UIShowcase
