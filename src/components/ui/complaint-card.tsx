import * as React from "react"
import { Card, CardContent, CardHeader } from "./card"
import { StatusBadge } from "./status-badge"
import { Button } from "./button"
import { Stack } from "./layout"
import { cn } from "@/lib/utils"
import { MapPin, Calendar, User, ChevronRight, Image, FileText } from "lucide-react"

interface ComplaintCardProps {
  id: string
  title: string
  description: string
  status: "submitted" | "in-progress" | "resolved" | "closed" | "rejected"
  category: string
  location: string
  createdAt: string
  author?: string
  hasImages?: boolean
  hasDocuments?: boolean
  onView?: () => void
  onStatusChange?: (newStatus: string) => void
  variant?: "default" | "compact" | "detailed"
  className?: string
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({
  id,
  title,
  description,
  status,
  category,
  location,
  createdAt,
  author,
  hasImages,
  hasDocuments,
  onView,
  onStatusChange,
  variant = "default",
  className
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "submitted": return "submitted"
      case "in-progress": return "in-progress"
      case "resolved": return "resolved"
      case "closed": return "closed"
      case "rejected": return "rejected"
      default: return "default"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  if (variant === "compact") {
    return (
      <Card 
        className={cn("cursor-pointer hover:shadow-card-hover", className)}
        onClick={onView}
      >
        <CardContent className="p-4">
          <Stack direction="horizontal" spacing="md" align="center" justify="between">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge variant={getStatusVariant(status)} size="sm" />
                <span className="text-xs text-muted-foreground">{category}</span>
              </div>
              <h3 className="font-medium text-sm truncate">{title}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(createdAt)}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      variant="default"
      className={cn("cursor-pointer transition-all duration-200", className)}
      onClick={onView}
    >
      <CardHeader>
        <Stack direction="horizontal" spacing="md" align="start" justify="between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge variant={getStatusVariant(status)} />
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {category}
              </span>
            </div>
            <h3 className="font-semibold text-lg leading-tight mb-2">{title}</h3>
          </div>
          {onView && (
            <Button variant="ghost" size="icon-sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </Stack>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed line-clamp-3">
          {description}
        </p>

        {/* Media indicators */}
        {(hasImages || hasDocuments) && (
          <div className="flex items-center gap-3">
            {hasImages && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-blue-50 px-2 py-1 rounded-md">
                <Image className="h-3 w-3" />
                Images
              </div>
            )}
            {hasDocuments && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-green-50 px-2 py-1 rounded-md">
                <FileText className="h-3 w-3" />
                Documents
              </div>
            )}
          </div>
        )}

        {/* Footer information */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(createdAt)}
            </span>
            {author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {author}
              </span>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            #{id.slice(-6).toUpperCase()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ComplaintCard }
