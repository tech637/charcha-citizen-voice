import React, { useState } from "react"
import AdaptiveNavigation from "./AdaptiveNavigation"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveSection, ResponsiveCard } from "./ResponsiveLayout"
import { TouchOptimized, TouchArea, Swipeable, PullToRefresh } from "./TouchOptimized"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { StatusBadge } from "../ui/status-badge"
import { cn } from "@/lib/utils"
import {
  Smartphone,
  Monitor,
  Tablet,
  Layout,
  Grid3X3,
  Navigation,
  Hand,
  Layers,
  Zap,
  Eye,
  Users,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from "lucide-react"

const ResponsiveShowcase: React.FC = () => {
  const [swipeAction, setSwipeAction] = useState<string>("")
  const [refreshCount, setRefreshCount] = useState(0)

  const responsiveFeatures = [
    {
      title: "Adaptive Navigation",
      description: "Full navigation bar on desktop transforms into hamburger menu + bottom tabs on mobile",
      icon: Navigation,
      mobile: "Hamburger menu + bottom navigation",
      desktop: "Full horizontal navigation bar",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "Content Density", 
      description: "More content and features visible on larger screens, prioritized content on mobile",
      icon: Layout,
      mobile: "Single column, essential info only",
      desktop: "Multi-column grids, detailed information",
      color: "bg-green-50 text-green-700"
    },
    {
      title: "Touch Optimization",
      description: "44px minimum touch targets, proper spacing, and gesture support for mobile",
      icon: Hand,
      mobile: "Optimized touch areas, swipe gestures",
      desktop: "Hover states, precise clicking",
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: "Progressive Enhancement",
      description: "Core functionality works everywhere, enhanced features on capable devices",
      icon: Layers,
      mobile: "Core features, fast loading",
      desktop: "Enhanced features, rich interactions",
      color: "bg-amber-50 text-amber-700"
    }
  ]

  const viewportSizes = [
    { name: "Mobile", icon: Smartphone, width: "375px", description: "iPhone SE, small phones" },
    { name: "Tablet", icon: Tablet, width: "768px", description: "iPad, Android tablets" },
    { name: "Desktop", icon: Monitor, width: "1024px+", description: "Laptops, desktop computers" }
  ]

  const adaptiveExamples = [
    {
      feature: "Statistics Cards",
      mobile: "2x2 grid, compact info",
      desktop: "1x4 row, detailed stats",
      benefit: "Optimal use of screen space"
    },
    {
      feature: "Complaint Cards", 
      mobile: "Stacked vertically, essential details",
      desktop: "Grid layout, full information + actions",
      benefit: "Information hierarchy"
    },
    {
      feature: "Sidebar",
      mobile: "Hidden, accessible via menu",
      desktop: "Always visible, filtering & tools",
      benefit: "Progressive disclosure"
    },
    {
      feature: "Search & Filters",
      mobile: "Simplified, modal-based",
      desktop: "Inline, always accessible",
      benefit: "Contextual complexity"
    }
  ]

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshCount(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <AdaptiveNavigation />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <ResponsiveContainer className="py-6 lg:py-8">
          
          {/* Header */}
          <ResponsiveSection
            title="Responsive Design Showcase"
            description="Experience how our design system adapts to different screen sizes and devices"
            spacing="lg"
            action={
              <div className="hidden lg:flex items-center space-x-2">
                <StatusBadge variant="approved">
                  Mobile-First Design
                </StatusBadge>
                {refreshCount > 0 && (
                  <StatusBadge variant="submitted">
                    Refreshed {refreshCount} times
                  </StatusBadge>
                )}
              </div>
            }
          />

          {/* Viewport Sizes */}
          <ResponsiveSection
            title="Adaptive Breakpoints"
            description="Our design system responds to these key viewport sizes"
            spacing="lg"
          >
            <ResponsiveGrid mobile={1} tablet={3} desktop={3} gap="lg">
              {viewportSizes.map((viewport, index) => (
                <ResponsiveCard key={index} variant="elevated" padding="lg">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-xl w-fit mx-auto">
                      <viewport.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{viewport.name}</h3>
                      <div className="text-2xl font-bold text-primary my-2">{viewport.width}</div>
                      <p className="text-sm text-muted-foreground">{viewport.description}</p>
                    </div>
                  </div>
                </ResponsiveCard>
              ))}
            </ResponsiveGrid>
          </ResponsiveSection>

          {/* Responsive Features */}
          <ResponsiveSection
            title="Key Adaptive Features"
            description="How our interface transforms across different devices"
            spacing="lg"
          >
            <div className="space-y-6">
              {responsiveFeatures.map((feature, index) => (
                <ResponsiveCard key={index} variant="outline" padding="lg">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className={cn("p-3 rounded-xl", feature.color)}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground mb-4">{feature.description}</p>
                        
                        {/* Mobile vs Desktop Comparison */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Smartphone className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Mobile</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.mobile}</p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Monitor className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Desktop</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.desktop}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResponsiveCard>
              ))}
            </div>
          </ResponsiveSection>

          {/* Touch Optimization Demo */}
          <ResponsiveSection
            title="Touch Interaction Demo"
            description="Try swiping the cards below (mobile) or hover for desktop interactions"
            spacing="lg"
          >
            <div className="space-y-4">
              {swipeAction && (
                <div className="p-4 bg-primary/10 rounded-xl text-center">
                  <p className="text-primary font-medium">Detected: {swipeAction}</p>
                </div>
              )}
              
              <ResponsiveGrid mobile={1} tablet={2} desktop={4} gap="md">
                <Swipeable
                  onSwipeLeft={() => setSwipeAction("Swipe Left")}
                  onSwipeRight={() => setSwipeAction("Swipe Right")}
                  onSwipeUp={() => setSwipeAction("Swipe Up")}
                  onSwipeDown={() => setSwipeAction("Swipe Down")}
                >
                  <TouchOptimized variant="card" feedback="scale">
                    <ResponsiveCard variant="elevated" padding="md" className="h-32">
                      <div className="text-center space-y-2">
                        <ArrowLeft className="h-6 w-6 mx-auto text-primary" />
                        <p className="text-sm font-medium">Swipe Left</p>
                      </div>
                    </ResponsiveCard>
                  </TouchOptimized>
                </Swipeable>

                <Swipeable
                  onSwipeLeft={() => setSwipeAction("Swipe Left")}
                  onSwipeRight={() => setSwipeAction("Swipe Right")}
                  onSwipeUp={() => setSwipeAction("Swipe Up")}
                  onSwipeDown={() => setSwipeAction("Swipe Down")}
                >
                  <TouchOptimized variant="card" feedback="scale">
                    <ResponsiveCard variant="elevated" padding="md" className="h-32">
                      <div className="text-center space-y-2">
                        <ArrowRight className="h-6 w-6 mx-auto text-primary" />
                        <p className="text-sm font-medium">Swipe Right</p>
                      </div>
                    </ResponsiveCard>
                  </TouchOptimized>
                </Swipeable>

                <Swipeable
                  onSwipeLeft={() => setSwipeAction("Swipe Left")}
                  onSwipeRight={() => setSwipeAction("Swipe Right")}
                  onSwipeUp={() => setSwipeAction("Swipe Up")}
                  onSwipeDown={() => setSwipeAction("Swipe Down")}
                >
                  <TouchOptimized variant="card" feedback="highlight">
                    <ResponsiveCard variant="elevated" padding="md" className="h-32">
                      <div className="text-center space-y-2">
                        <ArrowUp className="h-6 w-6 mx-auto text-primary" />
                        <p className="text-sm font-medium">Swipe Up</p>
                      </div>
                    </ResponsiveCard>
                  </TouchOptimized>
                </Swipeable>

                <Swipeable
                  onSwipeLeft={() => setSwipeAction("Swipe Left")}
                  onSwipeRight={() => setSwipeAction("Swipe Right")}
                  onSwipeUp={() => setSwipeAction("Swipe Up")}
                  onSwipeDown={() => setSwipeAction("Swipe Down")}
                >
                  <TouchOptimized variant="card" feedback="opacity">
                    <ResponsiveCard variant="elevated" padding="md" className="h-32">
                      <div className="text-center space-y-2">
                        <ArrowDown className="h-6 w-6 mx-auto text-primary" />
                        <p className="text-sm font-medium">Swipe Down</p>
                      </div>
                    </ResponsiveCard>
                  </TouchOptimized>
                </Swipeable>
              </ResponsiveGrid>
            </div>
          </ResponsiveSection>

          {/* Touch Area Examples */}
          <ResponsiveSection
            title="Touch Target Optimization"
            description="All interactive elements meet the 44px minimum touch target requirement"
            spacing="lg"
          >
            <div className="space-y-6">
              <div className="p-6 bg-muted/30 rounded-xl">
                <h4 className="font-medium mb-4">Touch-Optimized Buttons</h4>
                <div className="flex flex-wrap gap-3">
                  <TouchArea>
                    <Button size="sm">Small Button</Button>
                  </TouchArea>
                  <TouchArea>
                    <Button variant="outline" size="icon-sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TouchArea>
                  <TouchArea>
                    <StatusBadge variant="submitted">Status</StatusBadge>
                  </TouchArea>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  All elements above have minimum 44px touch areas even if they appear smaller
                </p>
              </div>

              <div className="p-6 bg-muted/30 rounded-xl">
                <h4 className="font-medium mb-4">Proper Spacing</h4>
                <div className="flex flex-wrap gap-4">
                  <TouchOptimized variant="icon">
                    <Users className="h-5 w-5" />
                  </TouchOptimized>
                  <TouchOptimized variant="icon">
                    <TrendingUp className="h-5 w-5" />
                  </TouchOptimized>
                  <TouchOptimized variant="icon">
                    <Eye className="h-5 w-5" />
                  </TouchOptimized>
                  <TouchOptimized variant="icon">
                    <Grid3X3 className="h-5 w-5" />
                  </TouchOptimized>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Icons have proper spacing to prevent accidental taps
                </p>
              </div>
            </div>
          </ResponsiveSection>

          {/* Adaptive Examples Table */}
          <ResponsiveSection
            title="Responsive Behavior Examples"
            description="See how specific components adapt across screen sizes"
            spacing="lg"
            className="hidden lg:block"
          >
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="text-left p-4 font-medium">Mobile Behavior</th>
                    <th className="text-left p-4 font-medium">Desktop Behavior</th>
                    <th className="text-left p-4 font-medium">Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  {adaptiveExamples.map((example, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-4 font-medium">{example.feature}</td>
                      <td className="p-4 text-muted-foreground">{example.mobile}</td>
                      <td className="p-4 text-muted-foreground">{example.desktop}</td>
                      <td className="p-4">
                        <StatusBadge variant="approved" size="sm">
                          {example.benefit}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResponsiveSection>

          {/* Pull to Refresh Info */}
          <ResponsiveSection
            title="Mobile Gestures"
            description="Pull down from the top of this page to see pull-to-refresh in action"
            spacing="lg"
            className="lg:hidden"
          >
            <ResponsiveCard variant="elevated" padding="lg">
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold">Pull to Refresh</h3>
                <p className="text-muted-foreground text-sm">
                  This page supports native-like pull-to-refresh gesture
                </p>
                {refreshCount > 0 && (
                  <StatusBadge variant="approved">
                    Refreshed {refreshCount} times!
                  </StatusBadge>
                )}
              </div>
            </ResponsiveCard>
          </ResponsiveSection>

        </ResponsiveContainer>
      </PullToRefresh>
    </div>
  )
}

export default ResponsiveShowcase
