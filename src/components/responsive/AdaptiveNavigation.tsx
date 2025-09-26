import React, { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "../ui/button"
import { Container } from "../ui/layout"
import { LoginDialog } from "../LoginDialog"
import { cn } from "@/lib/utils"
import { 
  Home, 
  FileText, 
  Users, 
  Bell,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Search,
  Plus,
  ChevronDown,
  MapPin
} from "lucide-react"

const AdaptiveNavigation: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false)
    }
    
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: FileText, description: "Your complaints and activity" },
    { href: "/communities", label: "Communities", icon: Users, description: "Local community groups" },
    { href: "/india", label: "India Feed", icon: MapPin, description: "National complaint feed" },
    { href: "/ui-showcase", label: "UI Showcase", icon: Settings, description: "Design system demo" }
  ]

  const isActiveLink = (href: string) => {
    if (href === "/" && location.pathname === "/") return true
    return href !== "/" && location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <Container size="full" className="max-w-none px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-xl">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-black text-primary">Charcha</div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    "hover:bg-muted/80",
                    isActiveLink(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Desktop User Actions */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {/* Search */}
                  <Button variant="ghost" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>

                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></div>
                  </Button>

                  {/* User Menu */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUserMenuOpen(!isUserMenuOpen)
                      }}
                      className="flex items-center space-x-2 px-3"
                    >
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-32">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-large border border-border py-2">
                        <div className="px-3 py-2 border-b border-border">
                          <div className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                        
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Profile & Settings</span>
                        </Link>
                        
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors w-full text-left text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Action */}
                  <Button size="sm" className="ml-2">
                    <Plus className="h-4 w-4 mr-2" />
                    New Complaint
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsLoginOpen(true)} size="sm">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </Container>
      </nav>

      {/* Mobile Navigation Header */}
      <nav className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-xl font-black text-primary">Charcha</div>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <Button variant="ghost" size="icon-sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full"></div>
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Content */}
            <div className="fixed top-14 left-0 right-0 bg-card border-b border-border z-50 shadow-large">
              <div className="px-4 py-6 space-y-6">
                {/* User Section */}
                {user ? (
                  <div className="flex items-center space-x-3 pb-4 border-b border-border">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.user_metadata?.full_name || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pb-4 border-b border-border">
                    <Button 
                      onClick={() => {
                        setIsLoginOpen(true)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200",
                        isActiveLink(item.href)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Quick Actions */}
                {user && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <Button className="w-full justify-start" size="lg">
                      <Plus className="h-4 w-4 mr-3" />
                      File New Complaint
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Bottom Navigation for Mobile (when logged in) */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navigationItems.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-xl transition-all duration-200",
                  "active:scale-95",
                  isActiveLink(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  isActiveLink(item.href) && "bg-primary/10"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium mt-1 truncate">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  )
}

export default AdaptiveNavigation
