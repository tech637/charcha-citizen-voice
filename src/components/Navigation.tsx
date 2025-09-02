import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { LoginDialog } from "./LoginDialog";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
            </div>
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
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
              <div className="pt-4 pb-3 border-t border-border">
                <div className="flex flex-col space-y-3 px-3">
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