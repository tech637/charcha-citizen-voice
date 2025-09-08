import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ComplaintProvider } from "@/contexts/ComplaintContext";
import { FileProvider } from "@/contexts/FileContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./components/Dashboard";
import { AuthCallback } from "./components/AuthCallback";
import AdminPanel from "./components/admin/AdminPanel";
import AdminTest from "./components/AdminTest";
import CommunityFeed from "./components/CommunityFeed";
import IndiaCommunityFeed from "./components/IndiaCommunityFeed";
import CommunityPage from "./components/CommunityPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ComplaintProvider>
        <FileProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/communities" element={<CommunityFeed />} />
              <Route path="/communities/:communityName" element={<CommunityPage />} />
              <Route path="/india" element={<IndiaCommunityFeed />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin-test" element={<AdminTest />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </FileProvider>
      </ComplaintProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
