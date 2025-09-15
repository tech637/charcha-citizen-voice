
import { FileText, Bell, Users, MapPin, MessageSquare, CheckCircle } from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import Marquee from "@/components/magicui/marquee";
import { cn } from "@/lib/utils";

const HowItWorks = () => {
  const complaintCategories = [
    { name: "Water Issues", icon: "", description: "Water logging, supply problems" },
    { name: "Garbage", icon: "", description: "Waste collection, dumping" },
    { name: "Electricity", icon: "", description: "Power cuts, street lights" },
    { name: "Roads", icon: "🛣️", description: "Potholes, maintenance" },
    { name: "Sewage", icon: "🚰", description: "Drainage, sanitation" },
    { name: "Other", icon: "📝", description: "Other civic issues" }
  ];

  const statusUpdates = [
    { status: "Submitted", icon: "", color: "text-blue-500" },
    { status: "In Review", icon: "", color: "text-yellow-500" },
    { status: "In Progress", icon: "⚙️", color: "text-orange-500" },
    { status: "Resolved", icon: "✅", color: "text-green-500" },
    { status: "Closed", icon: "🔒", color: "text-gray-500" }
  ];

  const features = [
    {
      Icon: FileText,
      name: "File a Complaint",
      description: "Report civic issues with photos, location, and category selection. Auto-capture GPS location with manual map pin option.",
      href: "#complaint",
      cta: "Start Reporting",
      className: "col-span-1 sm:col-span-2 lg:col-span-2 lg:row-start-1",
      background: (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-wrap gap-1 sm:gap-2 max-w-[150px] sm:max-w-[200px]">
          {complaintCategories.slice(0, 3).map((category, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {category.icon && <span className="text-sm sm:text-lg">{category.icon}</span>}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{category.name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      Icon: Bell,
      name: "Track Status",
      description: "Get real-time updates on your complaint progress with email notifications and status tracking.",
      href: "#track",
      cta: "View Status",
      className: "col-span-1 sm:col-span-1 lg:col-span-1 lg:row-span-2",
      background: (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col gap-1 sm:gap-2">
          {statusUpdates.slice(0, 2).map((update, idx) => (
            <div key={idx} className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700">
              {update.icon && <span className="text-sm sm:text-lg">{update.icon}</span>}
              <span className={`text-xs font-medium ${update.color} hidden sm:inline`}>{update.status}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      Icon: Users,
      name: "Community Feed",
      description: "See public complaints in your area, collaborate with neighbors, and build stronger communities.",
      href: "#community",
      cta: "Join Community",
      className: "col-span-1 sm:col-span-2 lg:col-span-2 lg:row-start-2",
      background: (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col gap-1 sm:gap-2 max-w-[150px] sm:max-w-[250px]">
          <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">Road maintenance near Metro</div>
              <div className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">2h ago • 5 likes</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">Sewage system repair</div>
              <div className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">4h ago • 3 likes</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="py-6 sm:py-8 md:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 md:mb-12">How It Works</h2>
        <BentoGrid>
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </div>
  );
};

export default HowItWorks;
