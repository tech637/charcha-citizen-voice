import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ComplaintProvider } from "@/contexts/ComplaintContext";
import { FileProvider } from "@/contexts/FileContext";
import { ThoughtProvider } from "@/contexts/ThoughtContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./components/Dashboard";
import { AuthCallback } from "./components/AuthCallback";
import AdminPanel from "./components/admin/AdminPanel";
import AdminTest from "./components/AdminTest";
import CommunityFeed from "./components/CommunityFeed";
import IndiaCommunityFeed from "./components/IndiaCommunityFeed";
import CommunityPage from "./components/CommunityPage";
import ModernCommunityPage from "./components/ModernCommunityPage";
import JoinCommunities from "./components/JoinCommunities";
import UIShowcase from "./components/UIShowcase";
import ModernLandingPage from "./components/ModernLandingPage";
import ResponsiveDashboard from "./components/responsive/ResponsiveDashboard";
import ResponsiveCommunityFeed from "./components/responsive/ResponsiveCommunityFeed";
import ResponsiveShowcase from "./components/responsive/ResponsiveShowcase";
import AdminAccessHelper from "./components/admin/AdminAccessHelper";
import AdminDebug from "./components/admin/AdminDebug";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ComplaintProvider>
        <FileProvider>
          <ThoughtProvider>
            <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ModernLandingPage />} />
              <Route path="/old-home" element={<Index />} />
              <Route path="/dashboard" element={<ResponsiveDashboard />} />
              <Route path="/old-dashboard" element={<Dashboard />} />
              <Route path="/communities" element={<ResponsiveCommunityFeed />} />
              <Route path="/old-communities" element={<CommunityFeed />} />
              <Route path="/join-communities" element={<JoinCommunities />} />
              <Route path="/communities/:communityName" element={<ModernCommunityPage />} />
              <Route path="/old-communities/:communityName" element={<CommunityPage />} />
              <Route path="/india" element={<IndiaCommunityFeed />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin-helper" element={<AdminAccessHelper />} />
              <Route path="/admin-debug" element={<AdminDebug />} />
              <Route path="/admin-test" element={<AdminTest />} />
              <Route path="/ui-showcase" element={<UIShowcase />} />
              <Route path="/responsive-showcase" element={<ResponsiveShowcase />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
            </TooltipProvider>
          </ThoughtProvider>
        </FileProvider>
      </ComplaintProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
