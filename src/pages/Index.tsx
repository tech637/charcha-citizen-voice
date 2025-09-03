
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import ComplaintForm from "@/components/ComplaintForm";
import HowItWorks from "@/components/HowItWorks";
import CommunityPreview from "@/components/CommunityPreview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section with Background */}
      <div className="relative flex flex-col items-center justify-center min-h-[80vh] md:min-h-screen px-4 text-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white drop-shadow-lg">
            Raise Your Voice. Fix Your City.
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow" >
            Report civic problems in your area from garbage to waterlogging and track them until resolved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button 
              size="lg" 
              className="text-base md:text-lg px-6 md:px-8 py-2 md:py-3 bg-primary hover:bg-primary/90 shadow-lg w-full sm:w-auto"
              onClick={() => {
                document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              File a Complaint
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="text-base md:text-lg px-6 md:px-8 py-2 md:py-3 border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
              onClick={() => {
                document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See Community
            </Button>
          </div>
        </div>
      </div>

      {/* Complaint Form Section */}
      <div id="complaint-form" className="py-8 md:py-16 px-4">
        <ComplaintForm />
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Community Preview Section */}
      <CommunityPreview />

      {/* Footer */}
      <footer className="bg-muted py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 md:mb-4">Charcha</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Empowering communities through transparent civic engagement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div>
                <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Links</h4>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">About</a></li>
                  <li><a href="#" className="hover:text-foreground">FAQ</a></li>
                  <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                  <li><a href="#" className="hover:text-foreground">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Social</h4>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Twitter</a></li>
                  <li><a href="#" className="hover:text-foreground">LinkedIn</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-6 md:mt-8 pt-6 md:pt-8 text-center text-xs md:text-sm text-muted-foreground">
            © 2025 Charcha. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
