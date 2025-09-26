
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Shield } from "lucide-react";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuth } from "@/contexts/AuthContext";
import { isUserAdmin } from "@/lib/communities";
import JoinCommunityForm from "@/components/JoinCommunityForm";
import HowItWorks from "@/components/HowItWorks";
import { ComplaintNotificationsDemo } from "@/components/ComplaintNotifications";

function IndexNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
            >
              Charcha
            </button>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                How It Works
              </a>
              <button
                onClick={() => navigate("/communities")}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Communities
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                {isAdmin && (
                  <Button variant="outline" onClick={() => navigate("/admin")} size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                <Button onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
                  Login
                </Button>
                <Button onClick={() => document.getElementById('join-community-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  Get Started
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium">
                How It Works
              </a>
              <button
                onClick={() => { navigate("/communities"); setIsMenuOpen(false); }}
                className="text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium text-left w-full"
              >
                Communities
              </button>
              <div className="pt-4 border-t">
                {user ? (
                  <div className="flex flex-col space-y-2">
                     <Button variant="ghost" onClick={() => {navigate("/dashboard"); setIsMenuOpen(false);}}>Dashboard</Button>
                     {isAdmin && <Button variant="outline" onClick={() => {navigate("/admin"); setIsMenuOpen(false);}}>Admin</Button>}
                     <Button onClick={handleSignOut}>Sign Out</Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button variant="ghost" onClick={() => {setIsLoginOpen(true); setIsMenuOpen(false);}}>Login</Button>
                    <Button onClick={() => {document.getElementById('join-community-form')?.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false);}}>Get Started</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
}

const Index = () => {
  return (
    <div className="min-h-screen bg-[#E2EEF9]">
      <IndexNavigation />
      {/* Hero Section with Video Background */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden">
        {/* Background Video */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <img 
            src="/images/image.png" 
            alt="Community illustration"
            className="w-full h-full object-cover"
          />
        </video>
        
        {/* Dark overlay for better text readability - lighter on mobile */}
        {/* <div className="absolute inset-0 bg-[#001F3F]/50 sm:bg-[#001F3F]/60 md:bg-[#001F3F]/70 z-10"></div> */}
        
        <div className="max-w-4xl mx-auto relative z-20 px-4">
          <h1 className="text-6xl sm:text-8xl md:text-[132px] font-black text-[#1f2768] tracking-[0] leading-[normal] mb-2 sm:mb-4" style={{fontFamily: 'Montserrat-Black, Helvetica'}}>
            Charcha
          </h1> 
          
          {/* Decorative line */}
          <div className="w-48 sm:w-80 md:w-[666px] h-px bg-[#90a3b5] mx-auto mb-2 sm:mb-4"></div>
          
          <p className="text-lg sm:text-2xl md:text-[38.4px] font-black text-[#E2EEF9] tracking-[0] leading-[normal] mb-4 sm:mb-8" style={{fontFamily: 'Montserrat-Black, Helvetica'}}>
            Raise Your Voice. Fix Your City.
          </p>
          
          <p className="text-sm sm:text-lg md:text-xl font-bold text-[#E2EEF9] tracking-[0] leading-[normal] mb-6 sm:mb-12" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            COMMUNITY FIRST PLATFORM
          </p>
          
          {/* Join Community Button */}
          <div className="flex justify-center">
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-[#001F3F] border border-[#001F3F] rounded-lg text-white font-medium hover:bg-[#001F3F]/90 transition-colors text-sm sm:text-base"
              onClick={() => {
                document.getElementById('join-community-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828l2.828 2.828Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Join Your Community
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Join Community Form Section */}
      <div id="join-community-form" className="py-6 sm:py-8 md:py-16 px-4 bg-[#E2EEF9]">
        <JoinCommunityForm />
        <HowItWorks />
      </div>

      {/* Live Complaints Section */}
      <div className="min-h-screen bg-[#E2EEF9]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12 pt-6 sm:pt-8 md:pt-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 md:mb-12 text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
              Live Community Activity
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#001F3F]/90 max-w-2xl mx-auto leading-relaxed">
              See real-time complaints being filed by citizens across India. Join the community and make your voice heard.
            </p>
          </div>
          
          <div className="h-[calc(100vh-150px)]">
            <ComplaintNotificationsDemo className="h-full" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#E2EEF9] py-6 sm:py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 md:mb-4 text-[#001F3F]">Charcha</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#001F3F]/90 mb-4 leading-relaxed">
                Empowering communities through transparent civic engagement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-8">
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm md:text-base text-[#001F3F]">Links</h4>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-[#001F3F]/80">
                  <li><a href="#" className="hover:text-[#001F3F] transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-[#001F3F] transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-[#001F3F] transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-[#001F3F] transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm md:text-base text-[#001F3F]">Social</h4>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-[#001F3F]/80">
                  <li><a href="#" className="hover:text-[#001F3F] transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-[#001F3F] transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-[#001F3F]/20 mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 md:pt-8 text-center text-xs sm:text-sm text-[#001F3F]/80">
            © 2025 Charcha. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
