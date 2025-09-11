
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import ComplaintForm from "@/components/ComplaintForm";
import HowItWorks from "@/components/HowItWorks";
import { ComplaintNotificationsDemo } from "@/components/ComplaintNotifications";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#A73728]/70">
      <Navigation />
      {/* Hero Section with Image Background */}
      <div 
        className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/image.png)'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-[#A73728]/70 z-10"></div>
        
        <div className="max-w-4xl mx-auto relative z-20 px-4">
          <h1 className="text-6xl sm:text-8xl md:text-[132px] font-black text-[#F5F5DC] tracking-[0] leading-[normal] mb-2 sm:mb-4" style={{fontFamily: 'Montserrat-Black, Helvetica'}}>
            Charcha
          </h1>
          
          {/* Decorative line */}
          <div className="w-48 sm:w-80 md:w-[666px] h-px bg-[#F5F5DC] mx-auto mb-2 sm:mb-4"></div>
          
          <p className="text-lg sm:text-2xl md:text-[38.4px] font-black text-[#F5F5DC] tracking-[0] leading-[normal] mb-4 sm:mb-8" style={{fontFamily: 'Montserrat-Black, Helvetica'}}>
            Raise Your Voice. Fix Your City.
          </p>
          
          <p className="text-sm sm:text-lg md:text-xl font-bold text-[#F5F5DC] tracking-[0] leading-[normal] mb-6 sm:mb-12" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            COMMUNITY FIRST PLATFORM
          </p>
          
          {/* File Complaint Button */}
          <div className="flex justify-center">
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-white border border-gray-300 rounded-lg text-black font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
              onClick={() => {
                document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              File a Complaint
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Complaint Form Section */}
      <div id="complaint-form" className="py-6 sm:py-8 md:py-16 px-4 bg-[#A73728]/70">
        <ComplaintForm />
        <HowItWorks />
      </div>

      {/* Live Complaints Section */}
      <div className="py-6 sm:py-8 md:py-16 px-4 bg-[#A73728]/70">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 md:mb-12 text-[#F5F5DC]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
              Live Community Activity
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#F5F5DC]/90 max-w-2xl mx-auto leading-relaxed">
              See real-time complaints being filed by citizens across India. Join the community and make your voice heard.
            </p>
          </div>
          
          <div className="bg-[#A73728]/20 rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-[#F5F5DC]/10">
            <ComplaintNotificationsDemo className="h-[500px]" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#A73728]/70 py-6 sm:py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 md:mb-4 text-[#F5F5DC]">Charcha</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#F5F5DC]/90 mb-4 leading-relaxed">
                Empowering communities through transparent civic engagement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-8">
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm md:text-base text-[#F5F5DC]">Links</h4>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-[#F5F5DC]/80">
                  <li><a href="#" className="hover:text-[#F5F5DC] transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-[#F5F5DC] transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-[#F5F5DC] transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-[#F5F5DC] transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm md:text-base text-[#F5F5DC]">Social</h4>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-[#F5F5DC]/80">
                  <li><a href="#" className="hover:text-[#F5F5DC] transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-[#F5F5DC] transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-[#F5F5DC]/20 mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 md:pt-8 text-center text-xs sm:text-sm text-[#F5F5DC]/80">
            © 2025 Charcha. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
