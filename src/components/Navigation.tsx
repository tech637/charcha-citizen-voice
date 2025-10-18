import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User, Crown } from "lucide-react";
import { LoginDialog } from "./LoginDialog";
import { useAuth } from "@/contexts/AuthContext";
import { isUserAdmin, getUserApprovedCommunities } from "@/lib/communities";
import { isUserAnyLeader, getUserLeaderTypes } from "@/lib/leaders";

const Navigation = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [leaderTypes, setLeaderTypes] = useState<string[]>([]);
  const [joinedCommunityName, setJoinedCommunityName] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin and leader
  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        try {
          const [adminStatus, leaderStatus, userLeaderTypes] = await Promise.all([
            isUserAdmin(user.id),
            isUserAnyLeader(user.id),
            getUserLeaderTypes(user.id)
          ]);
          setIsAdmin(adminStatus);
          setIsLeader(leaderStatus);
          setLeaderTypes(userLeaderTypes);
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      } else {
        setIsAdmin(false);
        setIsLeader(false);
        setLeaderTypes([]);
      }
    };

    checkUserStatus();
  }, [user]);

  // Fetch user's approved community (single-membership)
  useEffect(() => {
    const loadJoinedCommunity = async () => {
      if (!user) {
        setJoinedCommunityName(null);
        return;
      }
      try {
        const { data } = await getUserApprovedCommunities(user.id);
        if (data && data.length > 0) {
          setJoinedCommunityName(data[0].name);
        } else {
          setJoinedCommunityName(null);
        }
      } catch (e) {
        setJoinedCommunityName(null);
      }
    };
    loadJoinedCommunity();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#001F3F] shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Logo - Centered on mobile, left-aligned on desktop */}
          <div className="flex-shrink-0 md:flex-shrink-0">
            <button 
              onClick={() => navigate("/")}
              className="text-xl sm:text-2xl md:text-3xl font-black text-[#F5F5DC] hover:text-white transition-colors md:ml-0 mx-auto md:mx-0"
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
              <button 
                onClick={() => {
                  if (!user) {
                    setIsLoginOpen(true);
                  } else if (joinedCommunityName) {
                    navigate(`/communities/${encodeURIComponent(joinedCommunityName)}`)
                  } else {
                    // Show message to join community
                    alert("Please join a community first. You can join a community from the home page.");
                  }
                }}
                className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {user ? "My Circle" : "Communities"}
              </button>
              {/* Dashboard link removed from top navbar */}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Dashboard button */}
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
                  size="sm"
                >
                  <span className="hidden lg:inline">My Dashboard</span>
                  <span className="lg:hidden">Dashboard</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  size="icon"
                  className="h-8 w-8"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                {/* Leader Dashboard Buttons */}
                {isLeader && leaderTypes.map((leaderType) => (
                  <Button
                    key={leaderType}
                    variant="outline"
                    onClick={() => navigate(`/${leaderType}-dashboard`)}
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
                    size="sm"
                  >
                    <Crown className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden lg:inline">{leaderType.toUpperCase()}</span>
                  </Button>
                ))}
                
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

          {/* Mobile Auth Buttons - Only show on mobile */}
          <div className="md:hidden">
            {user ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  size="sm"
                  className="text-xs text-white border-white/30 hover:bg-white/20"
                >
                  Dashboard
                </Button>
                
                {/* Mobile Leader Dashboard Buttons */}
                {isLeader && leaderTypes.map((leaderType) => (
                  <Button
                    key={leaderType}
                    variant="outline"
                    onClick={() => navigate(`/${leaderType}-dashboard`)}
                    size="icon"
                    className="h-8 w-8 text-white border-white/30 hover:bg-white/20"
                    title={`${leaderType.toUpperCase()} Dashboard`}
                  >
                    <Crown className="h-4 w-4" style={{ color: 'white', fill: 'white' }} />
                  </Button>
                ))}
                
                {isAdmin && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/admin")}
                    size="icon"
                    className="h-8 w-8 text-white border-white/30 hover:bg-white/20"
                    title="Admin Panel"
                  >
                    <Shield className="h-4 w-4" style={{ color: 'white', fill: 'white' }} />
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  size="icon"
                  className="h-8 w-8 text-white border-white/30 hover:bg-white/20"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" style={{ color: 'white', fill: 'white' }} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsLoginOpen(true)}
                  size="sm"
                  className="text-xs text-white border-white/30 hover:bg-white/20"
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </nav>
  );
};

export default Navigation;