import * as React from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ComponentType<{ className?: string }>
  position?: "bottom-right" | "bottom-left" | "bottom-center"
  size?: "default" | "lg"
  variant?: "default" | "secondary"
}

const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(({ 
  className, 
  icon: Icon = Plus, 
  position = "bottom-right",
  size = "default",
  variant = "default",
  children,
  ...props 
}, ref) => {
  const positionClasses = {
    "bottom-right": "fixed bottom-20 right-4 sm:bottom-6 sm:right-6",
    "bottom-left": "fixed bottom-20 left-4 sm:bottom-6 sm:left-6",
    "bottom-center": "fixed bottom-20 left-1/2 transform -translate-x-1/2 sm:bottom-6"
  }

  const sizeClasses = {
    default: "h-14 w-14",
    lg: "h-16 w-16"
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "z-40 rounded-full shadow-large hover:shadow-xl transition-all duration-300",
        "active:scale-95 hover:scale-105",
        positionClasses[position],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <Icon className={cn("h-6 w-6", size === "lg" && "h-7 w-7")} />
      {children && (
        <span className="sr-only">{children}</span>
      )}
    </Button>
  )
})
FloatingActionButton.displayName = "FloatingActionButton"

export { FloatingActionButton }
