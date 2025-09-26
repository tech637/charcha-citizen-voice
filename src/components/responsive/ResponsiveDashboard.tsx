import React, { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import AdaptiveNavigation from "./AdaptiveNavigation"
import DesktopSidebar from "./DesktopSidebar"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveSection, ResponsiveCard } from "./ResponsiveLayout"
import { Button } from "../ui/button"
import { ComplaintCard } from "../ui/complaint-card"
import { EmptyState } from "../ui/empty-state"
import { StatusBadge } from "../ui/status-badge"
import { FloatingActionButton } from "../ui/floating-action-button"
import { cn } from "@/lib/utils"
import {
  Plus,
  FileText,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  Filter,
  Grid3X3,
  List,
  Search
} from "lucide-react"

const ResponsiveDashboard: React.FC = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState<any>({})

  // Mock data - in real app this would come from API
  const stats = [
    { 
      title: "Total Complaints", 
      value: "24", 
      change: "+3 this week", 
      icon: FileText, 
      color: "text-blue-600 bg-blue-50",
      trend: "up"
    },
    { 
      title: "In Progress", 
      value: "8", 
      change: "2 updated today", 
      icon: Clock, 
      color: "text-amber-600 bg-amber-50",
      trend: "neutral"
    },
    { 
      title: "Resolved", 
      value: "16", 
      change: "+2 this week", 
      icon: CheckCircle, 
      color: "text-green-600 bg-green-50",
      trend: "up"
    },
    { 
      title: "Community Impact", 
      value: "89%", 
      change: "Resolution rate", 
      icon: TrendingUp, 
      color: "text-purple-600 bg-purple-50",
      trend: "up"
    }
  ]

  const recentComplaints = [
    {
      id: "comp-001",
      title: "Broken streetlight causing safety concerns",
      description: "The streetlight on Main Street has been flickering for weeks and is now completely dark. This creates a significant safety hazard for pedestrians, especially during evening hours. Multiple residents have expressed concerns about walking in this area after sunset.",
      status: "in-progress" as const,
      category: "Infrastructure",
      location: "Main Street, Downtown",
      createdAt: "2024-01-15T10:30:00Z",
      author: "You",
      hasImages: true,
      hasDocuments: false
    },
    {
      id: "comp-002",
      title: "Large pothole damaging vehicles",
      description: "There's a significant pothole on Oak Avenue that's been growing larger over the past month. Several residents have reported tire damage and vehicle alignment issues after driving over it.",
      status: "submitted" as const,
      category: "Roads",
      location: "Oak Avenue, Sector 5",
      createdAt: "2024-01-14T14:20:00Z",
      author: "You",
      hasImages: true,
      hasDocuments: true
    },
    {
      id: "comp-003",
      title: "Garbage collection schedule inconsistency",
      description: "Our street's garbage collection has been irregular for the past three weeks. Sometimes it's collected on time, other times it's delayed by 2-3 days, causing hygiene issues.",
      status: "resolved" as const,
      category: "Sanitation",
      location: "Pine Street, Block B",
      createdAt: "2024-01-13T09:15:00Z",
      author: "You",
      hasImages: false,
      hasDocuments: false
    },
    {
      id: "comp-004",
      title: "Park equipment needs maintenance",
      description: "The playground equipment at Central Park is showing signs of wear and potentially unsafe conditions. The swing set chains are rusty and one of the slides has a crack.",
      status: "submitted" as const,
      category: "Recreation",
      location: "Central Park",
      createdAt: "2024-01-12T16:45:00Z",
      author: "You",
      hasImages: true,
      hasDocuments: false
    }
  ]

  const handleCreateComplaint = () => {
    console.log("Navigate to complaint creation")
  }

  const handleViewComplaint = (id: string) => {
    console.log("Navigate to complaint:", id)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AdaptiveNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <EmptyState
            icon={FileText}
            title="Sign in to view your dashboard"
            description="Access your complaints, track their progress, and manage your civic engagement activities."
            action={{
              label: "Sign In",
              onClick: () => console.log("Open login dialog")
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdaptiveNavigation />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar onFilterChange={setFilters} />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <ResponsiveContainer className="py-6 lg:py-8">
            
            {/* Welcome Section - Mobile Priority */}
            <ResponsiveSection 
              spacing="md"
              className="lg:hidden"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">
                  Welcome back, {user.user_metadata?.full_name || "User"}!
                </h1>
                <p className="text-muted-foreground">
                  Track your complaints and community impact
                </p>
              </div>
            </ResponsiveSection>

            {/* Desktop Header */}
            <ResponsiveSection 
              title="Dashboard"
              description="Track your complaints and community engagement"
              spacing="lg"
              className="hidden lg:block"
              action={
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon-sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon-sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={handleCreateComplaint}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Complaint
                  </Button>
                </div>
              }
            />

            {/* Stats Grid - Responsive */}
            <ResponsiveGrid 
              mobile={2} 
              tablet={2} 
              desktop={4}
              gap="md"
              className="mb-8"
            >
              {stats.map((stat, index) => (
                <ResponsiveCard key={index} variant="elevated" padding="md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg", stat.color)}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <StatusBadge 
                        variant={stat.trend === "up" ? "approved" : "default"}
                        size="sm"
                      >
                        {stat.trend === "up" ? "↑" : "→"}
                      </StatusBadge>
                    </div>
                    <div>
                      <div className="text-2xl font-bold lg:text-3xl">{stat.value}</div>
                      <div className="text-sm font-medium text-muted-foreground">{stat.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
                    </div>
                  </div>
                </ResponsiveCard>
              ))}
            </ResponsiveGrid>

            {/* Quick Actions - Mobile Only */}
            <div className="lg:hidden mb-6">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleCreateComplaint}
                  className="h-12 justify-start"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Complaint
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 justify-start"
                  size="lg"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Recent Complaints Section */}
            <ResponsiveSection
              title="Your Recent Complaints"
              description="Track the progress of your submitted complaints"
              spacing="lg"
              action={
                <div className="lg:hidden">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              }
            >
              {recentComplaints.length > 0 ? (
                <div className={cn(
                  viewMode === "grid" 
                    ? "space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 xl:grid-cols-3"
                    : "space-y-4"
                )}>
                  {recentComplaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      {...complaint}
                      variant={viewMode === "list" ? "compact" : "default"}
                      onView={() => handleViewComplaint(complaint.id)}
                      className={cn(
                        "transition-all duration-200",
                        viewMode === "grid" && "lg:h-full"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No complaints yet"
                  description="Start by filing your first civic complaint to help improve your community."
                  action={{
                    label: "File Your First Complaint",
                    onClick: handleCreateComplaint
                  }}
                />
              )}
            </ResponsiveSection>

            {/* Community Engagement - Desktop Only */}
            <ResponsiveSection
              title="Community Engagement"
              description="See how your contributions are making a difference"
              spacing="lg"
              className="hidden lg:block"
            >
              <ResponsiveGrid desktop={3} gap="lg">
                <ResponsiveCard variant="outline" padding="lg">
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-blue-50 rounded-xl w-fit mx-auto">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">156</div>
                      <div className="text-sm text-muted-foreground">Community Members Helped</div>
                    </div>
                  </div>
                </ResponsiveCard>

                <ResponsiveCard variant="outline" padding="lg">
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-green-50 rounded-xl w-fit mx-auto">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-muted-foreground">Areas Improved</div>
                    </div>
                  </div>
                </ResponsiveCard>

                <ResponsiveCard variant="outline" padding="lg">
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-purple-50 rounded-xl w-fit mx-auto">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">45</div>
                      <div className="text-sm text-muted-foreground">Days Active</div>
                    </div>
                  </div>
                </ResponsiveCard>
              </ResponsiveGrid>
            </ResponsiveSection>

          </ResponsiveContainer>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden">
        <FloatingActionButton
          onClick={handleCreateComplaint}
          position="bottom-right"
        >
          Create New Complaint
        </FloatingActionButton>
      </div>
    </div>
  )
}

export default ResponsiveDashboard
