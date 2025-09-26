import React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "wide" | "narrow" | "full"
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      wide: "max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12",
      narrow: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8",
      full: "w-full px-4 sm:px-6 lg:px-8"
    }

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
ResponsiveContainer.displayName = "ResponsiveContainer"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  mobile?: 1 | 2
  tablet?: 2 | 3 | 4
  desktop?: 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg" | "xl"
  adaptive?: boolean // If true, will show more content on larger screens
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ 
    className, 
    mobile = 1, 
    tablet = 2, 
    desktop = 3,
    gap = "md",
    adaptive = true,
    ...props 
  }, ref) => {
    const gapClasses = {
      sm: "gap-3",
      md: "gap-4 lg:gap-6",
      lg: "gap-6 lg:gap-8",
      xl: "gap-8 lg:gap-12"
    }

    const gridClasses = adaptive 
      ? `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop} xl:grid-cols-${Math.min(desktop + 1, 6)}`
      : `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop}`

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridClasses,
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)
ResponsiveGrid.displayName = "ResponsiveGrid"

interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "mobile-vertical" | "mobile-horizontal" | "adaptive"
  spacing?: "xs" | "sm" | "md" | "lg" | "xl"
  breakpoint?: "sm" | "md" | "lg" | "xl"
}

const ResponsiveStack = React.forwardRef<HTMLDivElement, ResponsiveStackProps>(
  ({ 
    className, 
    direction = "adaptive", 
    spacing = "md",
    breakpoint = "lg",
    ...props 
  }, ref) => {
    const spacingClasses = {
      xs: "space-y-2 space-x-0",
      sm: "space-y-3 space-x-0",
      md: "space-y-4 space-x-0", 
      lg: "space-y-6 space-x-0",
      xl: "space-y-8 space-x-0"
    }

    const responsiveSpacing = {
      xs: `space-y-2 space-x-0 ${breakpoint}:space-y-0 ${breakpoint}:space-x-2`,
      sm: `space-y-3 space-x-0 ${breakpoint}:space-y-0 ${breakpoint}:space-x-3`,
      md: `space-y-4 space-x-0 ${breakpoint}:space-y-0 ${breakpoint}:space-x-4`,
      lg: `space-y-6 space-x-0 ${breakpoint}:space-y-0 ${breakpoint}:space-x-6`,
      xl: `space-y-8 space-x-0 ${breakpoint}:space-y-0 ${breakpoint}:space-x-8`
    }

    const directionClasses = {
      "mobile-vertical": `flex flex-col ${spacingClasses[spacing]}`,
      "mobile-horizontal": `flex flex-row ${spacingClasses[spacing].replace('space-y', 'space-x').replace('space-x-0', 'space-y-0')}`,
      "adaptive": `flex flex-col ${breakpoint}:flex-row ${responsiveSpacing[spacing]}`
    }

    return (
      <div
        ref={ref}
        className={cn(
          directionClasses[direction],
          className
        )}
        {...props}
      />
    )
  }
)
ResponsiveStack.displayName = "ResponsiveStack"

interface ResponsiveSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
  spacing?: "sm" | "md" | "lg" | "xl"
  titleSize?: "sm" | "md" | "lg" | "xl"
}

const ResponsiveSection = React.forwardRef<HTMLDivElement, ResponsiveSectionProps>(
  ({ 
    className, 
    title, 
    description, 
    action, 
    spacing = "lg",
    titleSize = "lg",
    children,
    ...props 
  }, ref) => {
    const spacingClasses = {
      sm: "space-y-4",
      md: "space-y-6",
      lg: "space-y-8",
      xl: "space-y-12"
    }

    const titleSizes = {
      sm: "text-lg font-semibold lg:text-xl",
      md: "text-xl font-semibold lg:text-2xl",
      lg: "text-2xl font-bold lg:text-3xl",
      xl: "text-3xl font-bold lg:text-4xl"
    }

    return (
      <section
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {(title || description || action) && (
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0 lg:space-x-8">
            <div className="flex-1 min-w-0 space-y-2">
              {title && (
                <h2 className={titleSizes[titleSize]}>
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-muted-foreground text-base lg:text-lg max-w-3xl">
                  {description}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        )}
        {children}
      </section>
    )
  }
)
ResponsiveSection.displayName = "ResponsiveSection"

interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline" | "ghost"
  padding?: "sm" | "md" | "lg" | "xl"
  hover?: boolean
}

const ResponsiveCard = React.forwardRef<HTMLDivElement, ResponsiveCardProps>(
  ({ className, variant = "default", padding = "md", hover = true, ...props }, ref) => {
    const paddingClasses = {
      sm: "p-4 lg:p-5",
      md: "p-4 lg:p-6",
      lg: "p-6 lg:p-8",
      xl: "p-8 lg:p-10"
    }

    const variantClasses = {
      default: "bg-card border border-border shadow-card",
      elevated: "bg-card border border-border shadow-medium",
      outline: "bg-card border-2 border-border",
      ghost: "bg-transparent"
    }

    const hoverClasses = hover ? {
      default: "hover:shadow-card-hover transition-shadow duration-200",
      elevated: "hover:shadow-large transition-shadow duration-200", 
      outline: "hover:border-primary/20 transition-colors duration-200",
      ghost: "hover:bg-muted/50 transition-colors duration-200"
    } : {}

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-200",
          variantClasses[variant],
          paddingClasses[padding],
          hover && hoverClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
ResponsiveCard.displayName = "ResponsiveCard"

export { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveStack, 
  ResponsiveSection,
  ResponsiveCard
}
