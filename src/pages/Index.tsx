
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import JoinCommunityForm from "@/components/JoinCommunityForm";
import HowItWorks from "@/components/HowItWorks";
import { ComplaintNotificationsDemo } from "@/components/ComplaintNotifications";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Building2, User } from "lucide-react";

// Mobile Bottom Navigation Component
const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className={`h-5 w-5 ${isActive('/') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          
          <button
            onClick={() => navigate('/communities')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/communities') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className={`h-5 w-5 ${isActive('/communities') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
            <span className="text-xs mt-1 font-medium">Communities</span>
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className={`h-5 w-5 ${isActive('/dashboard') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Desktop Navigation Only */}
      <div className="hidden md:block">
        <Navigation />
      </div>
      
      {/* Hero Section - Responsive Video Background */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden">
        {/* Responsive Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
            {/* Fallback image if video doesn't load */}
            <img 
              src="/images/image.png" 
              alt="Community illustration"
              className="w-full h-full object-cover"
            />
          </video>
          {/* Responsive overlay - lighter on mobile, darker on desktop */}
          <div className="absolute inset-0 bg-black/20 md:bg-black/40"></div>
        </div>
        
        {/* Content Overlay */}
        <div className="max-w-7xl mx-auto relative z-20 px-4">
          {/* Logo */}
          <h1 className="text-5xl sm:text-7xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight mb-4 md:mb-6 drop-shadow-lg" style={{fontFamily: 'Montserrat-Black, Helvetica'}}>
            Charcha
          </h1> 
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            Raise Your Voice. Fix Your City.
          </p>
          
          {/* Platform Description */}
          <p className="text-sm sm:text-base md:text-sm lg:text-base xl:text-lg font-semibold text-white/90 mb-8 md:mb-12 tracking-wide drop-shadow-lg" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            COMMUNITY FIRST PLATFORM
          </p>
          
          {/* Primary CTA Button */}
          <div className="flex justify-center">
            <button 
              className="inline-flex items-center gap-3 px-6 py-4 md:px-10 md:py-6 bg-[#001F3F] hover:bg-[#001F3F]/90 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base md:text-xl"
              onClick={() => {
                document.getElementById('join-community-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{fontFamily: 'Montserrat-Bold, Helvetica'}}
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828l2.828 2.828Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Join Your Community
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Join Community Form Section */}
      <div id="join-community-form" className="py-12 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <JoinCommunityForm />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 md:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <HowItWorks />
        </div>
      </div>

      {/* Live Community Activity Section */}
      <div className="py-12 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#001F3F] mb-4 md:mb-6" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
              Live Community Activity
            </h2>
            <p className="text-base md:text-base lg:text-lg xl:text-xl text-[#001F3F]/80 max-w-3xl mx-auto leading-relaxed">
              See real-time complaints being filed by citizens across India. Join the community and make your voice heard.
            </p>
          </div>
          
          <div className="h-[60vh] md:h-[80vh]">
            <ComplaintNotificationsDemo className="h-full" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#001F3F] py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold text-white mb-4" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>Charcha</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Empowering communities through transparent civic engagement.
              </p>
            </div>
            
            {/* Links Section */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Links</h4>
                <ul className="space-y-3 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Social</h4>
                <ul className="space-y-3 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 md:mt-12 pt-8 text-center text-gray-400">
            © 2025 Charcha. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  );
};

export default Index;
