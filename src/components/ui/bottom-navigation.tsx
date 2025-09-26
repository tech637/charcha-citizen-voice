import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon?: React.ComponentType<{ className?: string }>
}

interface BottomNavigationProps {
  items: NavigationItem[]
  className?: string
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ items, className }) => {
  const location = useLocation()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && location.pathname.startsWith(item.href))
          const IconComponent = isActive && item.activeIcon ? item.activeIcon : item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1",
                "transition-all duration-200 rounded-xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <IconComponent
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-200 truncate",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export { BottomNavigation, type NavigationItem }
