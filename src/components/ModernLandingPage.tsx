import React from "react"
import { Link } from "react-router-dom"
import { Container, Section, Grid, Stack } from "./ui/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { EmptyState } from "./ui/empty-state"
import { StatusBadge } from "./ui/status-badge"
import ModernNavigation from "./ModernNavigation"
import { 
  FileText, 
  Users, 
  MapPin, 
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Globe,
  MessageSquare
} from "lucide-react"

const ModernLandingPage: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: "File Complaints",
      description: "Quickly report civic issues with photos, location, and detailed descriptions."
    },
    {
      icon: Users,
      title: "Community Engagement",
      description: "Connect with neighbors and collaborate on local improvement initiatives."
    },
    {
      icon: MapPin,
      title: "Location-Based",
      description: "View and track issues specific to your area with precise geolocation."
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor the status of your complaints from submission to resolution."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security measures."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications when there are updates to your complaints."
    }
  ]

  const stats = [
    { number: "2,450+", label: "Complaints Filed", icon: FileText },
    { number: "89%", label: "Resolution Rate", icon: CheckCircle },
    { number: "45", label: "Active Communities", icon: Users },
    { number: "24/7", label: "System Availability", icon: Clock }
  ]

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Community Member",
      content: "The platform made it so easy to report the broken streetlight. It was fixed within a week!",
      location: "Mumbai, Maharashtra"
    },
    {
      name: "Rajesh Kumar", 
      role: "Local Resident",
      content: "I love how I can track the progress of my complaints and see what's happening in my neighborhood.",
      location: "Delhi, NCR"
    },
    {
      name: "Anita Desai",
      role: "Community Leader",
      content: "This tool has transformed how our community communicates with local authorities.",
      location: "Bangalore, Karnataka"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <StatusBadge variant="approved" size="lg">
                <Globe className="h-4 w-4" />
                Trusted by 50,000+ Citizens
              </StatusBadge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Voice for a
              <span className="text-primary block">Better Community</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Report civic issues, track their progress, and collaborate with your community 
              to create positive change in your neighborhood.
            </p>
            
            <Stack direction="horizontal" spacing="md" justify="center" className="flex-wrap">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild>
                <Link to="/ui-showcase">
                  View UI Components
                </Link>
              </Button>
            </Stack>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <Container>
          <Grid cols={4} gap="lg">
            {stats.map((stat, index) => (
              <Card key={index} variant="elevated" className="text-center">
                <CardContent className="p-6">
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-4">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Features Section */}
      <Section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need for Civic Engagement
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools necessary for effective community 
              participation and issue resolution.
            </p>
          </div>
          
          <Grid cols={3} gap="lg">
            {features.map((feature, index) => (
              <Card key={index} variant="default" className="h-full">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to make your voice heard
            </p>
          </div>
          
          <Grid cols={3} gap="lg">
            <div className="text-center">
              <div className="p-4 bg-primary rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Report an Issue</h3>
              <p className="text-muted-foreground">
                Snap a photo, add location details, and describe the civic problem you've encountered.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-warning rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-warning-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your complaint's journey from submission through investigation to resolution.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-success rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-success-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">See Results</h3>
              <p className="text-muted-foreground">
                Celebrate as your community issue gets resolved and your neighborhood improves.
              </p>
            </div>
          </Grid>
        </Container>
      </section>

      {/* Testimonials */}
      <Section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Citizens Are Saying</h2>
            <p className="text-lg text-muted-foreground">
              Real stories from community members making a difference
            </p>
          </div>
          
          <Grid cols={3} gap="lg">
            {testimonials.map((testimonial, index) => (
              <Card key={index} variant="elevated">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <MessageSquare className="h-6 w-6 text-primary mb-3" />
                    <p className="text-muted-foreground leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {testimonial.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of citizens who are already using Charcha to improve 
              their communities. Start filing your first complaint today.
            </p>
            
            <Stack direction="horizontal" spacing="md" justify="center" className="flex-wrap">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  <Smartphone className="h-4 w-4" />
                  Start Filing Complaints
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild>
                <Link to="/communities">
                  <Users className="h-4 w-4" />
                  Join Communities
                </Link>
              </Button>
            </Stack>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <Container>
          <div className="text-center">
            <div className="text-2xl font-black text-primary mb-4">Charcha</div>
            <p className="text-muted-foreground mb-6">
              Empowering citizens to create positive change in their communities
            </p>
            
            <Stack direction="horizontal" spacing="md" justify="center" className="flex-wrap">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/communities" className="text-sm text-muted-foreground hover:text-foreground">
                Communities
              </Link>
              <Link to="/ui-showcase" className="text-sm text-muted-foreground hover:text-foreground">
                UI Showcase
              </Link>
            </Stack>
          </div>
        </Container>
      </footer>
    </div>
  )
}

export default ModernLandingPage
