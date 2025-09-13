import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useComplaint } from '@/contexts/ComplaintContext';
import { useFiles } from '@/contexts/FileContext';
import { createComplaint } from '@/lib/complaints';
import { useToast } from '@/hooks/use-toast';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingComplaint, clearPendingComplaint } = useComplaint();
  const { pendingFiles, clearPendingFiles } = useFiles();
  const { toast } = useToast();

  console.log('AuthCallback mounted, pendingComplaint:', pendingComplaint);

  useEffect(() => {
    let isSubmitting = false; // Prevent multiple submissions
    
    const handleAuthCallback = async () => {
      if (isSubmitting) return; // Prevent multiple executions
      
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Failed",
            description: "There was an error with Google authentication. Please try again.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (data.session && data.session.user) {
          console.log('✅ Google authentication successful');
          console.log('User ID:', data.session.user.id);
          console.log('Pending complaint:', pendingComplaint);
          
          // If there's a pending complaint, submit it
          if (pendingComplaint && !isSubmitting) {
            isSubmitting = true; // Mark as submitting
            try {
              console.log('Submitting pending complaint...');
              console.log('Pending files:', pendingFiles.length);
              
              // Add a small delay to ensure user profile is created
              await new Promise(resolve => setTimeout(resolve, 2000));
              
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
              
              const { data: complaintData, error: complaintError } = await createComplaint(complaintDataWithFiles, data.session.user.id);
              
              if (complaintError) {
                throw complaintError;
              }

              console.log('✅ Complaint submitted successfully');
              toast({
                title: "Complaint Submitted!",
                description: "Your complaint has been submitted successfully. You'll receive updates via email.",
              });

              clearPendingComplaint();
              clearPendingFiles();
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

          // Redirect to communities
          navigate('/communities');
        } else {
          // No session, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, pendingComplaint, pendingFiles, clearPendingComplaint, clearPendingFiles, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};
