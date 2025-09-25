import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Shield } from "lucide-react";
import { LoginDialog } from "./LoginDialog";
import { useAuth } from "@/contexts/AuthContext";
import { isUserAdmin } from "@/lib/communities";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#001F3F] shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => navigate("/")}
              className="text-xl sm:text-2xl md:text-3xl font-black text-[#F5F5DC] hover:text-white transition-colors"
              style={{fontFamily: 'Montserrat-Black, Helvetica'}}
            >
              Charcha
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button 
                onClick={() => navigate("/")}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </button>
              <a href="#how-it-works" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                How It Works
              </a>
              <button 
                onClick={() => navigate("/communities")}
                className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Communities
              </button>
              {user && (
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-2 lg:gap-4">
                <span className="text-xs lg:text-sm text-gray-200 truncate max-w-32 lg:max-w-none">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  size="icon"
                  className="h-8 w-8"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
                    size="sm"
                  >
                    <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsLoginOpen(true)}
                  className="mr-2 lg:mr-4 text-xs lg:text-sm"
                  size="sm"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' })}
                  size="sm"
                  className="text-xs lg:text-sm"
                >
                  <span className="hidden lg:inline">File Complaint</span>
                  <span className="lg:hidden">File</span>
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
              className="h-10 w-10 text-[#F5F5DC] hover:bg-white/20 hover:text-white transition-all duration-200"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-2 bg-[#001F3F]/95 backdrop-blur-sm border-t border-[#F5F5DC]/20 shadow-xl">
              <button 
                onClick={() => {
                  navigate("/");
                  setIsMenuOpen(false);
                }}
                className="text-[#F5F5DC] hover:text-white hover:bg-white/20 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center"
              >
                Home
              </button>
              <a 
                href="#how-it-works" 
                onClick={() => setIsMenuOpen(false)}
                className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center"
              >
                How It Works
              </a>
              <button 
                onClick={() => {
                  navigate("/communities");
                  setIsMenuOpen(false);
                }}
                className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center"
              >
                Communities
              </button>
              {user && (
                <button 
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMenuOpen(false);
                  }}
                  className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center"
                >
                  Dashboard
                </button>
              )}
              <button 
                onClick={() => {
                  document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
                className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center"
              >
                Track Complaint
              </button>
              <div className="pt-4 pb-2 border-t border-[#F5F5DC]/20">
                <div className="flex flex-col space-y-3">
                  {user ? (
                    <>
                      <div className="text-sm text-[#F5F5DC]/80 px-4 py-2 text-center bg-white/10 rounded-lg">
                        {user.user_metadata?.full_name || user.email}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-sm h-10 bg-white/10 border-[#F5F5DC]/30 text-[#F5F5DC] hover:bg-white/20 hover:border-[#F5F5DC] justify-center"
                        size="sm"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigate("/admin");
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 text-sm h-10 bg-white/10 border-[#F5F5DC]/30 text-[#F5F5DC] hover:bg-white/20 hover:border-[#F5F5DC]"
                          size="sm"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsLoginOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-sm h-10 bg-white/10 border-[#F5F5DC]/30 text-[#F5F5DC] hover:bg-white/20 hover:border-[#F5F5DC] justify-center"
                        size="sm"
                      >
                        Login / Sign Up
                      </Button>
                      <Button 
                        onClick={() => {
                          document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-sm h-10 bg-[#F5F5DC] text-[#001F3F] hover:bg-white font-semibold justify-center"
                        size="sm"
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