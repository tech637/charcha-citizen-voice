import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

const AuthTest = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, signUp, signIn, signOut } = useAuth()
  const { toast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    console.log('Attempting signup with:', { email, fullName })
    
    const { error } = await signUp(email, password, fullName)
    setIsLoading(false)
    
    if (error) {
      console.error('Signup error:', error)
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      console.log('Signup successful!')
      toast({
        title: "Signup Successful",
        description: "Please check your email to verify your account.",
      })
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    console.log('Attempting signin with:', { email })
    
    const { error } = await signIn(email, password)
    setIsLoading(false)
    
    if (error) {
      console.error('Signin error:', error)
      toast({
        title: "Signin Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      console.log('Signin successful!')
      toast({
        title: "Signin Successful",
        description: "Welcome back!",
      })
    }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Signout error:', error)
      toast({
        title: "Signout Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      console.log('Signout successful!')
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      })
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Auth Test Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Logged in as:</h3>
                <p className="text-sm text-muted-foreground">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {user.id}
                </p>
              </div>
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sign Up Form */}
              <form onSubmit={handleSignUp} className="space-y-3">
                <h3 className="font-semibold">Sign Up</h3>
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing Up..." : "Sign Up"}
                </Button>
              </form>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-3">
                <h3 className="font-semibold">Sign In</h3>
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthTest
