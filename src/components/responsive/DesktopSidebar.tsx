import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { StatusBadge } from "../ui/status-badge"
import { cn } from "@/lib/utils"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  Bell,
  Bookmark,
  Heart
} from "lucide-react"

interface DesktopSidebarProps {
  className?: string
  onFilterChange?: (filters: any) => void
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ 
  className, 
  onFilterChange 
}) => {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true)
  const [isStatsExpanded, setIsStatsExpanded] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    category: [],
    location: "",
    dateRange: "all"
  })

  const quickStats = [
    { label: "Total Complaints", value: "247", icon: FileText, color: "text-blue-600" },
    { label: "In Progress", value: "89", icon: Clock, color: "text-amber-600" },
    { label: "Resolved", value: "158", icon: CheckCircle, color: "text-green-600" },
    { label: "This Week", value: "12", icon: TrendingUp, color: "text-purple-600" }
  ]

  const statusFilters = [
    { id: "submitted", label: "Submitted", count: 45, color: "bg-blue-100 text-blue-700" },
    { id: "in-progress", label: "In Progress", count: 89, color: "bg-amber-100 text-amber-700" },
    { id: "resolved", label: "Resolved", count: 158, color: "bg-green-100 text-green-700" },
    { id: "closed", label: "Closed", count: 23, color: "bg-gray-100 text-gray-700" }
  ]

  const categoryFilters = [
    { id: "infrastructure", label: "Infrastructure", count: 67 },
    { id: "sanitation", label: "Sanitation", count: 45 },
    { id: "roads", label: "Roads", count: 89 },
    { id: "utilities", label: "Utilities", count: 34 },
    { id: "safety", label: "Safety", count: 23 }
  ]

  const quickActions = [
    { label: "My Complaints", icon: User, href: "/dashboard" },
    { label: "Saved Items", icon: Bookmark, href: "/saved" },
    { label: "Following", icon: Heart, href: "/following" },
    { label: "Notifications", icon: Bell, href: "/notifications" }
  ]

  const handleFilterToggle = (type: string, value: string) => {
    const newFilters = { ...selectedFilters }
    if (newFilters[type].includes(value)) {
      newFilters[type] = newFilters[type].filter(item => item !== value)
    } else {
      newFilters[type] = [...newFilters[type], value]
    }
    setSelectedFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  return (
    <div className={cn(
      "hidden lg:block w-80 h-screen sticky top-16 bg-card border-r border-border overflow-y-auto",
      className
    )}>
      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Search
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search complaints, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  location.pathname === action.href
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <button
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Quick Stats
            </h3>
            {isStatsExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {isStatsExpanded && (
            <div className="space-y-3">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                    <span className="text-sm font-medium">{stat.label}</span>
                  </div>
                  <span className="text-lg font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Filters
            </h3>
            {isFiltersExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {isFiltersExpanded && (
            <div className="space-y-4">
              {/* Status Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="space-y-1">
                  {statusFilters.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => handleFilterToggle('status', status.id)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedFilters.status.includes(status.id)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span>{status.label}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        status.color
                      )}>
                        {status.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Category</h4>
                <div className="space-y-1">
                  {categoryFilters.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterToggle('category', category.id)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedFilters.category.includes(category.id)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span>{category.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="text-sm font-medium mb-2">Date Range</h4>
                <select 
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                  value={selectedFilters.dateRange}
                  onChange={(e) => setSelectedFilters({
                    ...selectedFilters,
                    dateRange: e.target.value
                  })}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(selectedFilters.status.length > 0 || 
                selectedFilters.category.length > 0 || 
                selectedFilters.dateRange !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFilters({
                      status: [],
                      category: [],
                      location: "",
                      dateRange: "all"
                    })
                    onFilterChange?.({
                      status: [],
                      category: [],
                      location: "",
                      dateRange: "all"
                    })
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Recent Activity
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                  <p className="text-sm">Streetlight complaint resolved</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                  <p className="text-sm">New complaint submitted</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="h-2 w-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                  <p className="text-sm">Pothole repair in progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesktopSidebar
