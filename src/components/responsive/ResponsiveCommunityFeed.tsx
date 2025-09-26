import React, { useState } from "react"
import AdaptiveNavigation from "./AdaptiveNavigation"
import DesktopSidebar from "./DesktopSidebar"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveSection, ResponsiveCard } from "./ResponsiveLayout"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ComplaintCard } from "../ui/complaint-card"
import { StatusBadge } from "../ui/status-badge"
import { FloatingActionButton } from "../ui/floating-action-button"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  TrendingUp,
  Clock,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Share,
  Bookmark
} from "lucide-react"

const ResponsiveCommunityFeed: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  // Mock data - more comprehensive for density demonstration
  const communityStats = [
    { label: "Active Communities", value: "45", icon: Users, change: "+3 this month" },
    { label: "Total Complaints", value: "1,247", icon: TrendingUp, change: "+89 this week" },
    { label: "Resolved Issues", value: "1,089", icon: Clock, change: "87% resolution rate" },
    { label: "Active Users", value: "2,156", icon: Eye, change: "+156 this week" }
  ]

  const communityComplaints = [
    {
      id: "comp-101",
      title: "Streetlight outage affecting entire neighborhood",
      description: "Multiple streetlights along Maple Avenue have been out for over a week, creating safety concerns for residents walking at night. The issue seems to be affecting the entire block from 1st Street to 5th Street.",
      status: "in-progress" as const,
      category: "Infrastructure",
      location: "Maple Avenue, Downtown District",
      createdAt: "2024-01-20T08:30:00Z",
      author: "Sarah Johnson",
      hasImages: true,
      hasDocuments: false,
      engagement: { views: 156, likes: 23, comments: 8, shares: 4 }
    },
    {
      id: "comp-102", 
      title: "Park playground equipment needs urgent repair",
      description: "The playground at Central Park has several pieces of equipment that are becoming unsafe. The swing set chains are severely rusted, and there's a large crack in the main slide.",
      status: "submitted" as const,
      category: "Recreation",
      location: "Central Park, West Side",
      createdAt: "2024-01-19T14:15:00Z",
      author: "Mike Chen",
      hasImages: true,
      hasDocuments: true,
      engagement: { views: 89, likes: 15, comments: 12, shares: 2 }
    },
    {
      id: "comp-103",
      title: "Traffic signal malfunction at major intersection",
      description: "The traffic light at Main St and Oak Ave has been stuck on red for the north-south direction for several hours, causing significant traffic backups during rush hour.",
      status: "resolved" as const,
      category: "Traffic",
      location: "Main St & Oak Ave Intersection",
      createdAt: "2024-01-18T16:45:00Z",
      author: "Jennifer Davis",
      hasImages: false,
      hasDocuments: false,
      engagement: { views: 234, likes: 45, comments: 18, shares: 12 }
    },
    {
      id: "comp-104",
      title: "Garbage collection missed for three consecutive weeks",
      description: "Our residential area hasn't had garbage collection for three weeks straight. The bins are overflowing and creating hygiene issues. Multiple residents have called but no response.",
      status: "submitted" as const,
      category: "Sanitation",
      location: "Elm Street Residential Area",
      createdAt: "2024-01-17T11:20:00Z",
      author: "Robert Wilson",
      hasImages: true,
      hasDocuments: false,
      engagement: { views: 178, likes: 34, comments: 22, shares: 8 }
    },
    {
      id: "comp-105",
      title: "Pothole cluster causing vehicle damage",
      description: "A series of large potholes have formed on Pine Street near the school zone. Multiple parents have reported tire damage, and it's becoming a safety hazard for children walking to school.",
      status: "in-progress" as const,
      category: "Roads",
      location: "Pine Street, School Zone",
      createdAt: "2024-01-16T09:30:00Z",
      author: "Lisa Thompson",
      hasImages: true,
      hasDocuments: true,
      engagement: { views: 267, likes: 56, comments: 31, shares: 15 }
    },
    {
      id: "comp-106",
      title: "Public Wi-Fi not working in community center",
      description: "The free public Wi-Fi service at the community center has been down for over a month. This affects students who rely on it for homework and job seekers using it for applications.",
      status: "submitted" as const,
      category: "Technology",
      location: "Community Center, Main Building",
      createdAt: "2024-01-15T13:45:00Z",
      author: "David Garcia",
      hasImages: false,
      hasDocuments: false,
      engagement: { views: 145, likes: 28, comments: 14, shares: 6 }
    }
  ]

  const filterOptions = [
    { id: "all", label: "All", count: communityComplaints.length },
    { id: "submitted", label: "Submitted", count: 3 },
    { id: "in-progress", label: "In Progress", count: 2 },
    { id: "resolved", label: "Resolved", count: 1 }
  ]

  const filteredComplaints = activeFilter === "all" 
    ? communityComplaints 
    : communityComplaints.filter(complaint => complaint.status === activeFilter)

  const handleCreateComplaint = () => {
    console.log("Navigate to complaint creation")
  }

  const handleViewComplaint = (id: string) => {
    console.log("Navigate to complaint:", id)
  }

  return (
    <div className="min-h-screen bg-background">
      <AdaptiveNavigation />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <ResponsiveContainer className="py-6 lg:py-8">
            
            {/* Mobile Header */}
            <div className="lg:hidden mb-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Community Feed</h1>
                  <p className="text-muted-foreground">Stay connected with local issues</p>
                </div>
                
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search complaints, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Mobile Filter Pills */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {filterOptions.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                      className="flex-shrink-0"
                    >
                      {filter.label}
                      <span className="ml-1 text-xs opacity-75">({filter.count})</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <ResponsiveSection 
              title="Community Feed"
              description="Discover and engage with civic issues in your area"
              spacing="lg"
              className="hidden lg:block"
              action={
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon-sm"
                      onClick={() => setViewMode("grid")}
                      title="Grid view"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon-sm"
                      onClick={() => setViewMode("list")}
                      title="List view"
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

            {/* Stats Overview - Responsive Density */}
            <ResponsiveGrid 
              mobile={2} 
              tablet={4} 
              desktop={4}
              gap="md"
              className="mb-8"
            >
              {communityStats.map((stat, index) => (
                <ResponsiveCard key={index} variant="elevated" padding="sm" className="lg:p-6">
                  <div className="space-y-2 lg:space-y-3">
                    <div className="flex items-center justify-between">
                      <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                      <div className="text-right">
                        <div className="text-lg font-bold lg:text-2xl">{stat.value}</div>
                        <div className="text-xs font-medium text-muted-foreground lg:text-sm">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground lg:text-sm">
                      {stat.change}
                    </div>
                  </div>
                </ResponsiveCard>
              ))}
            </ResponsiveGrid>

            {/* Desktop Filter Bar */}
            <div className="hidden lg:flex items-center justify-between mb-6 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {filterOptions.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.label}
                      <span className="ml-2 px-1.5 py-0.5 bg-background/50 rounded text-xs">
                        {filter.count}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Complaints Feed - Adaptive Layout */}
            <div className={cn(
              "space-y-4",
              // Mobile: Always stack vertically
              "lg:space-y-0",
              // Desktop: Grid or list based on view mode
              viewMode === "grid" && "lg:grid lg:grid-cols-2 lg:gap-6 xl:grid-cols-3",
              viewMode === "list" && "lg:space-y-4"
            )}>
              {filteredComplaints.map((complaint, index) => (
                <div key={complaint.id} className={cn(
                  // Mobile: Full width cards with engagement
                  "lg:h-fit",
                  viewMode === "grid" && "lg:mb-0"
                )}>
                  <ComplaintCard
                    {...complaint}
                    variant={viewMode === "list" ? "compact" : "default"}
                    onView={() => handleViewComplaint(complaint.id)}
                    className="h-full"
                  />
                  
                  {/* Engagement Bar - Mobile and Desktop Different Densities */}
                  <div className={cn(
                    "mt-2 px-3 py-2 bg-muted/30 rounded-lg",
                    "flex items-center justify-between text-sm text-muted-foreground",
                    viewMode === "list" && "lg:hidden" // Hide in list view on desktop
                  )}>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span className="hidden sm:inline">Views:</span>
                        <span>{complaint.engagement.views}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span className="hidden sm:inline lg:hidden xl:inline">Likes:</span>
                        <span>{complaint.engagement.likes}</span>
                      </span>
                      <span className="hidden sm:flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="hidden lg:hidden xl:inline">Comments:</span>
                        <span>{complaint.engagement.comments}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                        <Bookmark className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                        <Share className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More - Desktop shows more, mobile shows less */}
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Load More Complaints
                <span className="ml-2 hidden lg:inline">(Showing {filteredComplaints.length} of 247)</span>
              </Button>
            </div>

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

export default ResponsiveCommunityFeed
