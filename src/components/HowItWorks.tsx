
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bell, Users } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      title: "File a Complaint",
      description: "Report civic issues in your area with photos and location details"
    },
    {
      icon: Bell,
      title: "Get Updates",
      description: "Track your complaint status and receive notifications on progress"
    },
    {
      icon: Users,
      title: "Join Your Community",
      description: "See public complaints and collaborate with neighbors for solutions"
    }
  ];

  return (
    <div className="py-8 md:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="pt-4 md:pt-6">
                  <div className="mb-3 md:mb-4 mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
