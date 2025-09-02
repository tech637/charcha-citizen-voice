
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
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="mb-4 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
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
