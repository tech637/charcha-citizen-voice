import * as React from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline"
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md"
}) => {
  const sizeClasses = {
    sm: {
      container: "py-8 px-4",
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-sm"
    },
    md: {
      container: "py-12 px-6",
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-base"
    },
    lg: {
      container: "py-16 px-8",
      icon: "h-20 w-20",
      title: "text-2xl",
      description: "text-lg"
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn("text-center", classes.container, className)}>
      <div className="mx-auto flex flex-col items-center space-y-4">
        {Icon && (
          <div className="p-4 rounded-2xl bg-muted/50">
            <Icon className={cn("text-muted-foreground", classes.icon)} />
          </div>
        )}
        
        <div className="space-y-2 max-w-sm">
          <h3 className={cn("font-semibold text-foreground", classes.title)}>
            {title}
          </h3>
          {description && (
            <p className={cn("text-muted-foreground leading-relaxed", classes.description)}>
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="pt-2">
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              size="lg"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export { EmptyState }
