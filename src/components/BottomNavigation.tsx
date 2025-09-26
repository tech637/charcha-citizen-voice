import { NavLink } from "react-router-dom";
import { Home, Users, PlusCircle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNavigation() {
  const { user } = useAuth();

  if (!user) {
    return null; // Don't show navigation if user is not logged in
  }

  const navLinkClasses = "flex flex-col items-center gap-1 text-muted-foreground transition-colors";
  const activeNavLinkClasses = "text-primary";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ""}`
          }
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Home</span>
        </NavLink>
        <NavLink
          to="/communities"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ""}`
          }
        >
          <Users className="h-6 w-6" />
          <span className="text-xs font-medium">Communities</span>
        </NavLink>
        <NavLink
          to="/new-complaint"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ""}`
          }
        >
          <PlusCircle className="h-7 w-7" />
          <span className="text-xs font-medium">New</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ""}`
          }
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
