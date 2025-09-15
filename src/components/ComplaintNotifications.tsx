"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useThoughts, Thought } from "@/contexts/ThoughtContext";

interface ComplaintItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
  location: string;
  category: string;
  isNew?: boolean;
}

const complaintTemplates: Omit<ComplaintItem, 'id' | 'time' | 'isNew'>[] = [
  {
    name: "Water logging reported",
    description: "Heavy water accumulation near Metro Station causing traffic issues",
    icon: "💧",
    color: "#00C9A7",
    location: "Rajiv Chowk, Delhi",
    category: "Water Issues"
  },
  {
    name: "Garbage collection delayed",
    description: "Waste bins overflowing in Sector 15 market area",
    icon: "🗑️",
    color: "#FFB800",
    location: "Sector 15, Gurgaon",
    category: "Garbage"
  },
  {
    name: "Street light not working",
    description: "Multiple street lights out on Ring Road causing safety concerns",
    icon: "⚡",
    color: "#FF3D71",
    location: "Ring Road, Bangalore",
    category: "Electricity"
  },
  {
    name: "Pothole on main road",
    description: "Large pothole causing vehicle damage and traffic congestion",
    icon: "🛣️",
    color: "#1E86FF",
    location: "MG Road, Mumbai",
    category: "Roads"
  },
  {
    name: "Sewage overflow",
    description: "Sewage water leaking onto residential street",
    icon: "🚰",
    color: "#8B5CF6",
    location: "Koramangala, Bangalore",
    category: "Sewage"
  },
  {
    name: "Broken footpath",
    description: "Cracked and uneven footpath near school causing safety issues",
    icon: "🚶",
    color: "#F59E0B",
    location: "Lajpat Nagar, Delhi",
    category: "Infrastructure"
  },
  {
    name: "Noise pollution",
    description: "Construction work continuing beyond permitted hours",
    icon: "🔊",
    color: "#EF4444",
    location: "Whitefield, Bangalore",
    category: "Noise"
  },
  {
    name: "Public transport issue",
    description: "Bus stop shelter damaged and needs immediate repair",
    icon: "🚌",
    color: "#10B981",
    location: "Connaught Place, Delhi",
    category: "Transport"
  },
  {
    name: "Traffic signal malfunction",
    description: "Traffic light stuck on red causing long queues",
    icon: "🚦",
    color: "#F97316",
    location: "CP, Delhi",
    category: "Traffic"
  },
  {
    name: "Drainage blocked",
    description: "Storm drain completely blocked with debris and plastic",
    icon: "🌊",
    color: "#06B6D4",
    location: "Karol Bagh, Delhi",
    category: "Drainage"
  },
  {
    name: "Public park maintenance",
    description: "Playground equipment broken and needs urgent repair",
    icon: "🌳",
    color: "#22C55E",
    location: "Lodhi Garden, Delhi",
    category: "Parks"
  },
  {
    name: "Water supply issue",
    description: "No water supply for 3 days in residential area",
    icon: "🚰",
    color: "#3B82F6",
    location: "Vasant Kunj, Delhi",
    category: "Water Supply"
  }
];

const ComplaintNotification = ({ 
  name, 
  description, 
  icon, 
  color, 
  time, 
  location, 
  category,
  isNew = false
}: ComplaintItem) => {
  return (
    <div
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[500px] cursor-pointer overflow-hidden rounded-xl p-4 mb-3",
        // animation styles
        "transition-all duration-500 ease-out hover:scale-[102%] hover:shadow-lg",
        // styling to match website theme
        "bg-white/95 backdrop-blur-sm border border-[#001F3F]/20",
        "shadow-md hover:shadow-xl",
        // new complaint animation
        isNew && "animate-slide-in-from-top"
      )}
    >
      {isNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      )}
      <div className="flex flex-row items-start gap-4">
        <div
          className="flex size-12 items-center justify-center rounded-xl flex-shrink-0 shadow-sm"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="flex flex-row items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900">{name}</h3>
            {isNew && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                NEW
              </span>
            )}
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">{time}</span>
          </div>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {description}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#001F3F]/10 text-[#001F3F] font-medium border border-[#001F3F]/20">
              {category}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600 font-medium">{location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThoughtNotification = ({ 
  thought,
  isNew = false
}: { 
  thought: Thought;
  isNew?: boolean;
}) => {
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[500px] cursor-pointer overflow-hidden rounded-xl p-4 mb-3",
        // animation styles
        "transition-all duration-500 ease-out hover:scale-[102%] hover:shadow-lg",
        // styling to match website theme
        "bg-white/95 backdrop-blur-sm border border-[#001F3F]/20",
        "shadow-md hover:shadow-xl",
        // new thought animation
        isNew && "animate-slide-in-from-top"
      )}
    >
      {isNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      )}
      <div className="flex flex-row items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl flex-shrink-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
          <span className="text-xl">💭</span>
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="flex flex-row items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900">Community Thought</h3>
            {isNew && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                NEW
              </span>
            )}
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">{formatTime(thought.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {thought.text}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium border border-blue-200">
              Thought
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600 font-medium">by {thought.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ComplaintNotificationsDemo({
  className,
}: {
  className?: string;
}) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  
  const { thoughts } = useThoughts();

  // Create a combined array of complaints and thoughts, sorted by time
  const allItems = React.useMemo(() => {
    const complaintItems = complaints.map(complaint => ({
      ...complaint,
      type: 'complaint' as const,
      timestamp: new Date() // complaints don't have real timestamps, so use current time
    }));
    
    const thoughtItems = thoughts.map(thought => ({
      id: thought.id,
      name: 'Community Thought',
      description: thought.text,
      icon: '💭',
      color: '#3B82F6',
      time: formatTime(thought.timestamp),
      location: `by ${thought.author}`,
      category: 'Thought',
      isNew: thought.isNew,
      type: 'thought' as const,
      timestamp: thought.timestamp
    }));
    
    // Combine and sort by timestamp (newest first)
    return [...thoughtItems, ...complaintItems].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [complaints, thoughts]);

  // Helper function to format time
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };


  // Generate a random complaint
  const generateRandomComplaint = (): ComplaintItem => {
    const template = complaintTemplates[Math.floor(Math.random() * complaintTemplates.length)];
    const now = new Date();
    const timeAgo = Math.floor(Math.random() * 5) + 1; // 1-5 minutes ago
    
    return {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      time: `${timeAgo}m ago`,
      isNew: true
    };
  };

  // Add initial complaints
  useEffect(() => {
    const initialComplaints: ComplaintItem[] = [];
    for (let i = 0; i < 3; i++) {
      const template = complaintTemplates[i];
      initialComplaints.push({
        ...template,
        id: Math.random().toString(36).substr(2, 9),
        time: `${(i + 1) * 2}m ago`,
        isNew: false
      });
    }
    setComplaints(initialComplaints);
  }, []);

  // Add new complaints periodically
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newComplaint = generateRandomComplaint();
      setComplaints(prev => {
        const updated = [newComplaint, ...prev];
        // Keep only last 10 complaints
        return updated.slice(0, 10);
      });

      // Remove "new" status after 2 seconds
      setTimeout(() => {
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === newComplaint.id 
              ? { ...complaint, isNew: false }
              : complaint
          )
        );
      }, 2000);
    }, 2000); // Add new complaint every 2 seconds

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden",
        className || "h-[500px]",
      )}
    >
      <div className="relative h-full overflow-y-auto">
        <div className="space-y-3 px-2">
          {allItems.map((item) => {
            if (item.type === 'thought') {
              return (
                <ThoughtNotification 
                  thought={{
                    id: item.id,
                    text: item.description,
                    author: item.location.replace('by ', ''),
                    timestamp: item.timestamp,
                    isNew: item.isNew
                  }}
                  key={`thought-${item.id}`} 
                  isNew={item.isNew}
                />
              );
            } else {
              return (
                <ComplaintNotification 
                  {...item} 
                  key={`complaint-${item.id}`} 
                />
              );
            }
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#001F3F]/20 to-transparent"></div>
      
      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-[#001F3F]/80">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live</span>
      </div>
    </div>
  );
}
