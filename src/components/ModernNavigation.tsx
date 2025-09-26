import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { BottomNavigation, type NavigationItem } from "./ui/bottom-navigation"
import { Button } from "./ui/button"
import { Container } from "./ui/layout"
import { LoginDialog } from "./LoginDialog"
import { 
  Home, 
  FileText, 
  Users, 
  User, 
  Settings,
  Bell,
  Menu,
  LogOut,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

const ModernNavigation: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  // Define navigation items for bottom navigation
  const navigationItems: NavigationItem[] = [
    {
      href: "/",
      label: "Home",
      icon: Home
    },
    {
      href: "/dashboard",
      label: "Dashboard", 
      icon: FileText
    },
    {
      href: "/communities",
      label: "Communities",
      icon: Users
    },
    {
      href: "/india",
      label: "India Feed",
      icon: Bell
    }
  ]

  // Top navigation bar for branding and user actions
  const TopNavigation = () => (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/"
            className="flex items-center space-x-2"
          >
            <div className="text-2xl font-black text-primary">
              Charcha
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link 
              to="/communities"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/communities" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Communities
            </Link>
            <Link 
              to="/india"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/india" ? "text-primary" : "text-muted-foreground"
              )}
            >
              India Feed
            </Link>
            <Link 
              to="/ui-showcase"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/ui-showcase" ? "text-primary" : "text-muted-foreground"
              )}
            >
              UI Showcase
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <Button variant="ghost" size="icon-sm">
                  <Bell className="h-4 w-4" />
                </Button>

                {/* User Menu */}
                <div className="hidden md:flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="truncate max-w-24">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSignOut}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginOpen(true)}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {showMobileMenu && user && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/dashboard")
                setShowMobileMenu(false)
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/ui-showcase")
                setShowMobileMenu(false)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              UI Showcase
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => {
                handleSignOut()
                setShowMobileMenu(false)
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </Container>
    </nav>
  )

  return (
    <>
      <TopNavigation />
      
      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden">
        <BottomNavigation items={navigationItems} />
      </div>

      {/* Login Dialog */}
      <LoginDialog 
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
      />
    </>
  )
}

export default ModernNavigation
