
import { FileText, Bell, Users, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const features = [
    {
      Icon: FileText,
      name: "File a Complaint",
      description: "Report civic issues with photos, location, and category selection. Auto-capture GPS location with manual map pin option.",
      cta: "Start Reporting",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      Icon: Bell,
      name: "Track Status",
      description: "Get real-time updates on your complaint progress with email notifications and status tracking.",
      cta: "View Status",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
    },
  ];

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#001F3F] mb-4 md:mb-6" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
          How It Works
        </h2>
        <p className="text-base md:text-base lg:text-lg xl:text-xl text-[#001F3F]/80 max-w-3xl mx-auto leading-relaxed">
          Simple steps to make your voice heard and track progress
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20`}
          >
            {/* Icon */}
            <div className={`w-16 h-16 md:w-18 md:h-18 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-6 md:mb-6`}>
              <feature.Icon className="w-8 h-8 md:w-9 md:h-9 text-white" />
            </div>

            {/* Content */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xl md:text-xl lg:text-2xl xl:text-3xl font-bold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
                {feature.name}
              </h3>
              
              <p className="text-[#001F3F]/80 leading-relaxed text-base md:text-base lg:text-lg">
                {feature.description}
              </p>

              {/* CTA Button */}
              <button
                className={`inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r ${feature.gradient} hover:shadow-lg text-white font-bold rounded-xl transition-all duration-300 group text-base md:text-base`}
                style={{fontFamily: 'Montserrat-Bold, Helvetica'}}
              >
                {feature.cta}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
