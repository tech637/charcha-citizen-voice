import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { LoginDialog } from "./LoginDialog";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary">Charcha</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Home
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                How It Works
              </a>
              <a href="#community" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Community
              </a>
              {user && (
                <a href="/dashboard" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="mr-4"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button 
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsLoginOpen(true)}
                  className="mr-4"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  File Complaint
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
              <a href="#" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Home
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                How It Works
              </a>
              <a href="#community" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Community
              </a>
              {user && (
                <a href="/dashboard" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                  Dashboard
                </a>
              )}
              <div className="pt-4 pb-3 border-t border-border">
                <div className="flex flex-col space-y-3 px-3">
                  {user ? (
                    <>
                      <div className="text-sm text-muted-foreground px-3 py-2">
                        {user.user_metadata?.full_name || user.email}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      <Button 
                        onClick={() => {
                          navigate("/dashboard");
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Dashboard
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsLoginOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Login / Sign Up
                      </Button>
                      <Button 
                        onClick={() => {
                          document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        File Complaint
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </nav>
  );
};

export default Navigation;