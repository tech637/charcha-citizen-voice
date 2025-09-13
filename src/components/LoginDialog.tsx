import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaint } from "@/contexts/ComplaintContext";
import { useFiles } from "@/contexts/FileContext";
import { createComplaint } from "@/lib/complaints";
import { Chrome } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { pendingComplaint, clearPendingComplaint } = useComplaint();
  const { pendingFiles, clearPendingFiles } = useFiles();
  const navigate = useNavigate();

  // Handle pending complaint after successful authentication
  useEffect(() => {
    let isSubmitting = false; // Prevent multiple submissions
    
    const submitPendingComplaint = async () => {
      if (user && pendingComplaint && !isSubmitting) {
        isSubmitting = true; // Mark as submitting
        try {
          // Add a small delay to ensure user profile is created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Reconstruct files from stored data if any
          let reconstructedFiles: File[] = [];
          if (pendingFiles.length > 0) {
            reconstructedFiles = pendingFiles.map(storedFile => {
              // Convert base64 data back to File object
              const byteString = atob(storedFile.data.split(',')[1]);
              const arrayBuffer = new ArrayBuffer(byteString.length);
              const uint8Array = new Uint8Array(arrayBuffer);
              for (let i = 0; i < byteString.length; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
              }
              return new File([arrayBuffer], storedFile.name, { type: storedFile.type });
            });
          }
          
          // Create complaint data with reconstructed files
          const complaintDataWithFiles = {
            ...pendingComplaint,
            files: reconstructedFiles.length > 0 ? reconstructedFiles : undefined
          };
          
          const { data, error } = await createComplaint(complaintDataWithFiles, user.id);
          
          if (error) {
            throw error;
          }

          toast({
            title: "Complaint Submitted!",
            description: "Your complaint has been submitted successfully. You'll receive updates via email.",
          });

          clearPendingComplaint();
          clearPendingFiles();
          onOpenChange(false);
          navigate("/communities");
        } catch (error: any) {
          console.error('Complaint submission error:', error);
          toast({
            title: "Submission Failed",
            description: error.message || "Failed to submit complaint. Please try again.",
            variant: "destructive",
          });
        } finally {
          isSubmitting = false; // Reset flag
        }
      }
    };

    submitPendingComplaint();
  }, [user, pendingComplaint, pendingFiles, clearPendingComplaint, clearPendingFiles, onOpenChange, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome back! You can now join communities and track complaints.",
      });
      onOpenChange(false);
      navigate("/communities");
      // Don't close dialog here - let useEffect handle pending complaint submission
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created",
        description: "Your account has been created successfully. Please check your email to verify your account.",
      });
      onOpenChange(false);
      navigate("/communities");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Google Sign-in Failed",
        description: error.message || "Google authentication is not configured. Please use email signup instead.",
        variant: "destructive",
      });
    } else {
      // Google OAuth will redirect, so we don't need to handle success here
      toast({
        title: "Redirecting to Google...",
        description: "Please complete authentication with Google.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Charcha</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            
            <div className="text-center">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Forgot your password?
              </a>
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input 
                  id="signup-password" 
                  type="password" 
                  placeholder="Create a password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Confirm your password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};