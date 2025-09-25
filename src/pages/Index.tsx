
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import JoinCommunityForm from "@/components/JoinCommunityForm";
import HowItWorks from "@/components/HowItWorks";
import { ComplaintNotificationsDemo } from "@/components/ComplaintNotifications";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#E2EEF9]">
      <Navigation />
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
