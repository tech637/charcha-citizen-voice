import React from "react"
import { cn } from "@/lib/utils"

interface TouchOptimizedProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "button" | "card" | "list-item" | "icon"
  feedback?: "scale" | "opacity" | "highlight" | "none"
  disabled?: boolean
}

/**
 * TouchOptimized wrapper ensures all interactive elements meet mobile touch standards
 * - Minimum 44px touch target (iOS/Android guidelines)
 * - Proper spacing between touch targets
 * - Visual feedback on touch
 * - Accessibility support
 */
const TouchOptimized = React.forwardRef<HTMLDivElement, TouchOptimizedProps>(
  ({ 
    className, 
    variant = "button", 
    feedback = "scale", 
    disabled = false,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = "relative transition-all duration-150 ease-out"
    
    const variantClasses = {
      button: "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl",
      card: "min-h-[44px] p-3 rounded-xl cursor-pointer",
      "list-item": "min-h-[48px] px-4 py-2 flex items-center cursor-pointer",
      icon: "min-h-[44px] min-w-[44px] p-2 rounded-lg cursor-pointer flex items-center justify-center"
    }

    const feedbackClasses = {
      scale: "active:scale-[0.97] hover:scale-[1.02]",
      opacity: "active:opacity-70 hover:opacity-90",
      highlight: "active:bg-primary/10 hover:bg-muted/50",
      none: ""
    }

    const disabledClasses = disabled 
      ? "opacity-50 cursor-not-allowed pointer-events-none" 
      : "cursor-pointer"

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          !disabled && feedbackClasses[feedback],
          disabledClasses,
          // Ensure proper spacing between touch targets
          "touch-manipulation",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TouchOptimized.displayName = "TouchOptimized"

interface TouchAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  minSize?: number // Minimum touch area size in pixels
  padding?: "none" | "sm" | "md" | "lg"
}

/**
 * TouchArea ensures minimum touch target size while maintaining visual design
 */
const TouchArea = React.forwardRef<HTMLDivElement, TouchAreaProps>(
  ({ className, minSize = 44, padding = "md", children, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-1",
      md: "p-2", 
      lg: "p-3"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center touch-manipulation",
          paddingClasses[padding],
          className
        )}
        style={{ minHeight: minSize, minWidth: minSize }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TouchArea.displayName = "TouchArea"

interface SwipeableProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

/**
 * Swipeable adds touch gesture support for mobile interactions
 */
const Swipeable = React.forwardRef<HTMLDivElement, SwipeableProps>(
  ({ 
    className,
    onSwipeLeft,
    onSwipeRight, 
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    children,
    ...props 
  }, ref) => {
    const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null)
    const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null)
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      })
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      })
    }

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return

      const distanceX = touchStart.x - touchEnd.x
      const distanceY = touchStart.y - touchEnd.y
      const isLeftSwipe = distanceX > threshold
      const isRightSwipe = distanceX < -threshold
      const isUpSwipe = distanceY > threshold
      const isDownSwipe = distanceY < -threshold

      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft()
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight()
      } else if (isUpSwipe && onSwipeUp) {
        onSwipeUp()
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown()
      }
    }

    return (
      <div
        ref={ref}
        className={cn("touch-pan-y", className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Swipeable.displayName = "Swipeable"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
}

/**
 * PullToRefresh adds native-like pull-to-refresh functionality
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
  onRefresh, 
  children, 
  className 
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [startY, setStartY] = React.useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY)
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 100))
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
  }

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 transition-all duration-150"
          style={{ height: pullDistance }}
        >
          <div className={cn(
            "text-primary text-sm font-medium transition-opacity",
            pullDistance > 60 ? "opacity-100" : "opacity-60"
          )}>
            {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center bg-primary/10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}

export { TouchOptimized, TouchArea, Swipeable, PullToRefresh }
