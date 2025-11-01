import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { isUserAnyLeader, getUserLeaderTypes } from '@/lib/leaders';
import LeaderDashboard from './LeaderDashboard';

const MPDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      // Check if user is assigned as MP for any community
      const isLeader = await isUserAnyLeader(user.id);
      if (!isLeader) {
        toast({
          title: "Access Denied",
          description: "You are not assigned as a leader for any community",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Check if user is specifically an MP
      const leaderTypes = await getUserLeaderTypes(user.id);
      if (!leaderTypes.includes('mp')) {
        toast({
          title: "Access Denied",
          description: "You are not assigned as an MP for any community",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error checking MP access:', error);
      navigate('/');
    }
  };

  return <LeaderDashboard leaderType="mp" />;
};

export default MPDashboard;
