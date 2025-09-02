
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23e0f2fe'/%3E%3Cstop offset='100%25' style='stop-color:%23f1f8e9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg)'/%3E%3Cg opacity='0.1'%3E%3Ccircle cx='200' cy='200' r='100' fill='%2364b5f6'/%3E%3Ccircle cx='800' cy='150' r='80' fill='%2381c784'/%3E%3Ccircle cx='1000' cy='400' r='120' fill='%23ffb74d'/%3E%3Ccircle cx='300' cy='600' r='90' fill='%23f06292'/%3E%3C/g%3E%3Cg opacity='0.05'%3E%3Cpath d='M100,300 Q300,100 500,300 T900,300' stroke='%23666' stroke-width='2' fill='none'/%3E%3Cpath d='M200,500 Q400,300 600,500 T1000,500' stroke='%23666' stroke-width='2' fill='none'/%3E%3C/g%3E%3C/svg%3E")`,
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
            © 2024 Charcha. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
