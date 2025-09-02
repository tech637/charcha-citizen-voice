import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Raise Your Voice. Fix Your City.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Report civic problems in your area – from garbage to waterlogging – and track them until resolved.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => {
              document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            File a Complaint
          </Button>
        </div>
      </div>

      {/* Complaint Form Section */}
      <div id="complaint-form" className="py-16 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">File Your Complaint</h2>
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <p className="text-center text-muted-foreground">
              Complaint form will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
