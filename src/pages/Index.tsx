
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
      <div 
        className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("/images/community.jpg")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            Raise Your Voice. Fix Your City.
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            Report civic problems in your area – from garbage to waterlogging – and track them until resolved.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 shadow-lg"
            onClick={() => {
              document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            File a Complaint
          </Button>
        </div>
      </div>

      {/* Complaint Form Section */}
      <div id="complaint-form" className="py-16 px-4">
        <ComplaintForm />
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Community Preview Section */}
      <CommunityPreview />

      {/* Footer */}
      <footer className="bg-muted py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Charcha</h3>
              <p className="text-muted-foreground mb-4">
                Empowering communities through transparent civic engagement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Links</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">About</a></li>
                  <li><a href="#" className="hover:text-foreground">FAQ</a></li>
                  <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                  <li><a href="#" className="hover:text-foreground">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Social</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Twitter</a></li>
                  <li><a href="#" className="hover:text-foreground">LinkedIn</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Charcha. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
