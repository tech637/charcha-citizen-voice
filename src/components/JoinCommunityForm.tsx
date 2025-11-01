import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Home,
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { joinCommunity, createCommunityFromLocality, cleanupOrphanedRequests, syncUserCommunities } from '@/lib/communities';
import { getCommunityBlocks } from '@/lib/blocks';
import { LoginDialog } from './LoginDialog';
import PincodeLocalitySelector from './PincodeLocalitySelector';
import { supabase } from '@/lib/supabase';
import { Locality } from '@/types/locality';

interface Community {
  id: string;
  name: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

interface Block {
  id: string;
  name: string;
  community_id: string;
}

interface LocationSuggestion {
  address: string;
  latitude: number;
  longitude: number;
}

const JoinCommunityForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [customBlock, setCustomBlock] = useState('');
  const [role, setRole] = useState<'tenant' | 'owner'>('tenant');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  // State for "Other" flow
  const [showOtherFlow, setShowOtherFlow] = useState(false);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);

  // Load all active communities
  useEffect(() => {
    const loadCommunities = async () => {
      setIsLoadingCommunities(true);
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('id, name, description, location, latitude, longitude')
          .eq('is_active', true)
          .order('name', { ascending: true });
        if (error) throw error;
        setCommunities(data || []);
      } catch (err) {
        console.error('Error loading communities:', err);
        setCommunities([]);
      } finally {
        setIsLoadingCommunities(false);
      }
    };
    loadCommunities();
  }, []);

  // Load blocks for selected community
  const loadBlocks = async (communityId: string) => {
    setIsLoadingBlocks(true);
    try {
      const { data, error } = await getCommunityBlocks(communityId);
      if (error) {
        console.error('Error loading blocks:', error);
        // If no blocks exist in database, set empty array
        setBlocks([]);
      } else {
        setBlocks(data || []);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
      // If error, set empty array
      setBlocks([]);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  // Handle community selection
  const handleCommunitySelect = (communityId: string) => {
    if (communityId === 'other') {
      setShowOtherFlow(true);
      return;
    }
    
    const community = communities.find(c => c.id === communityId) || null;
    setSelectedCommunity(community);
    setSelectedBlock('');
    setCustomBlock('');
    if (community) {
      loadBlocks(community.id);
    }
  };

  // Handle successful login - submit the form after login
  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
    // Trigger form submission after successful login
    if (selectedCommunity && address.trim()) {
      handleFormSubmission();
    }
  };

  // Handle locality selection from "Other" flow
  const handleLocalitySelected = async (locality: Locality, pincode: string) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Debug: Check current user memberships before creating
    console.log('Checking user memberships before creating community...');
    try {
      const { data: memberships } = await supabase
        .from('user_communities')
        .select('*, communities!inner(name)')
        .eq('user_id', user.id);
      console.log('Current user memberships:', memberships?.map(m => ({
        id: m.id,
        community_name: m.communities?.name,
        status: m.status,
        role: m.role
      })));
    } catch (e) {
      console.error('Error checking memberships:', e);
    }

    setIsCreatingCommunity(true);
    
    try {
      // First, run comprehensive community synchronization
      console.log('Running comprehensive community synchronization...');
      const { data: syncResult, error: syncError } = await syncUserCommunities(user.id);
      
      if (syncError) {
        console.error('Error during synchronization:', syncError);
      } else if (syncResult && (
        syncResult.cleanedPendingRequests > 0 || 
        syncResult.cleanedInactiveCommunities > 0 || 
        syncResult.cleanedOrphanedRecords > 0 ||
        syncResult.reactivatedCommunities > 0 ||
        syncResult.globalCleanupApplied
      )) {
        console.log('🔧 Synchronization results:', syncResult);
        
        let description = "Database cleanup completed: ";
        const changes = [];
        
        // Global cleanup results
        if (syncResult.globalCleanupApplied && syncResult.globalCleanupResults) {
          const global = syncResult.globalCleanupResults;
          if (global.orphanedMembershipsDeleted > 0) changes.push(`🗑️ Deleted ${global.orphanedMembershipsDeleted} orphaned memberships`);
          if (global.pendingRequestsDeleted > 0) changes.push(`⏳ Cleaned ${global.pendingRequestsDeleted} pending requests for inactive communities`);
          if (global.communitiesReactivated > 0) changes.push(`🔄 Reactivated ${global.communitiesReactivated} communities`);
          if (global.communitiesDeactivated > 0) changes.push(`💤 Deactivated ${global.communitiesDeactivated} empty communities`);
        }
        
        // User-specific cleanup results
        if (syncResult.cleanedPendingRequests > 0) changes.push(`🧹 Cleaned ${syncResult.cleanedPendingRequests} user-specific pending requests`);
        if (syncResult.cleanedInactiveCommunities > 0) changes.push(`🤖 Cleaned ${syncResult.cleanedInactiveCommunities} inactive memberships`);
        if (syncResult.cleanedOrphanedRecords > 0) changes.push(`🔗 Fixed ${syncResult.cleanedOrphanedRecords} orphaned records`);
        if (syncResult.reactivatedCommunities > 0) changes.push(`🎉 Reactivated ${syncResult.reactivatedCommunities} user communities`);
        
        toast({
          title: "🌍 Global Community Synchronization Complete",
          description: description + changes.join(', '),
          variant: "default",
        });
      }

      const { data: community, error } = await createCommunityFromLocality({
        locality_name: locality.locality_name,
        pincode: pincode,
        locality_data: locality,
        description: `Community for ${locality.locality_name} residents`
      }, user.id);

      if (error) {
        console.log('Raw Supabase error from createCommunityFromLocality:', error);
        
        // Provide more helpful error messages based on actual error content
        let errorMessage = error.message || "Failed to create community. Please try again.";
        
        if (error.message?.includes('already have an active membership')) {
          errorMessage = `${error.message} Please leave your current community first before creating a new one.`;
        } else if (error.message?.includes('unique constraint')) {
          errorMessage = "You already have an active membership in another community. Please leave your current community first before creating a new one.";
        } else if (error.code === '23505') {
          errorMessage = "A community with this name already exists. Please try a different locality.";
        } else if (error.code === '42501') {
          errorMessage = "Permission denied. You may need admin privileges to create communities.";
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Community Created Successfully!",
        description: `Successfully created community for ${locality.locality_name}. You are now the admin.`,
      });

      // Redirect to the new community
      navigate(`/communities/${encodeURIComponent(community.name)}`);
      
    } catch (error: any) {
      console.error('Error creating community:', error);
      console.error('Full error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      const isMembershipConflict = error.message?.includes('already have an active membership') || 
                                  error.message?.includes('already have a pending request') ||
                                  error.message?.includes('unique constraint') ||
                                  error.code === '23505';
      
      const errorDescription = isMembershipConflict 
        ? "You're already enrolled in a community. Please leave your current community first before creating a new one."
        : error.message || "Failed to create community. Please try again.";
        
      toast({
        title: "Cannot Create Community", 
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  const handleBackFromOther = () => {
    setShowOtherFlow(false);
  };

  // No need to check login status on mount - let users fill the form first

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if we're in the "Other" flow
    if (showOtherFlow) {
      return;
    }
    
    if (!user) {
      // Show login dialog when user tries to submit
      setShowLoginDialog(true);
      return;
    }
    
    // If user is logged in, proceed with submission
    handleFormSubmission();
  };

  // Actual form submission logic
  const handleFormSubmission = async () => {
    if (!user) return; // Safety check

    if (!selectedCommunity) {
      toast({
        title: "Community Required",
        description: "Please select a community to join",
        variant: "destructive",
      });
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please provide your address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const isUsingDbBlocks = blocks.length > 0;
      const blockIdToSave = isUsingDbBlocks && selectedBlock && selectedBlock !== 'custom' ? selectedBlock : undefined;
      const blockNameToSave = isUsingDbBlocks
        ? (selectedBlock === 'custom' ? customBlock : undefined)
        : (selectedBlock === 'custom' ? customBlock : (selectedBlock || undefined));

      const { data, error } = await joinCommunity({
        communityId: selectedCommunity.id,
        userId: user.id,
        blockId: blockIdToSave,
        blockName: blockNameToSave,
        role: role,
        address: address.trim()
      });

      if (error) {
        const msg = (error as any)?.message || '';
        if (msg.includes('Only one active community membership') || msg.includes('already have an active membership')) {
          toast({
            title: "Already in a Community",
            description: "You already have an active membership or pending request in another community. Please leave or cancel it before joining a new one.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Join Request Submitted",
        description: `Your request to join ${selectedCommunity.name} has been submitted for approval.`,
      });

      // Redirect to dashboard to view request status
      navigate('/dashboard?tab=requests');
      
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Always show the form - login will be prompted on submit if needed

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#001F3F] to-[#001F3F]/90 text-white p-8 md:p-10 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Users className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            Join Your Community
          </h2>
          <p className="text-white/90 text-base md:text-lg leading-relaxed">
            Connect with your neighbors and make your voice heard
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-bold text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
                Select Community
              </Label>
              {isLoadingCommunities ? (
                <div className="flex items-center gap-3 text-gray-500 bg-gray-50 rounded-xl p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Loading communities...</span>
                </div>
              ) : (
                <Select value={showOtherFlow ? 'other' : (selectedCommunity?.id || '')} onValueChange={handleCommunitySelect}>
                  <SelectTrigger className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl text-base font-medium">
                    <SelectValue placeholder="Choose your community" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-base">
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other" className="text-base font-semibold text-blue-600">
                      Other (Create New Community)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Show "Other" flow when selected */}
            {showOtherFlow && (
              <div className="space-y-6">
                <PincodeLocalitySelector
                  onLocalitySelected={handleLocalitySelected}
                  onBack={handleBackFromOther}
                />
                {isCreatingCommunity && (
                  <div className="flex items-center justify-center gap-3 text-gray-500 bg-gray-50 rounded-xl p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Creating community...</span>
                  </div>
                )}
              </div>
            )}

            {/* Block Selection */}
            {selectedCommunity && !showOtherFlow && (
              <div className="space-y-3">
                <Label className="text-base font-semibold text-[#001F3F]">
                  Select Your Block
                </Label>
                {isLoadingBlocks ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading blocks...</span>
                  </div>
                ) : blocks.length > 0 ? (
                  <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose your block" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Other (specify below)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      No blocks defined for this community yet. Select from common blocks:
                    </p>
                    <Select
                      value={selectedBlock}
                      onValueChange={(value) => {
                        setSelectedBlock(value);
                        if (['Block A', 'Block B', 'Block C', 'Block D', 'Block E'].includes(value)) {
                          setCustomBlock(value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose your block (A–E) or Other" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Block A">Block A</SelectItem>
                        <SelectItem value="Block B">Block B</SelectItem>
                        <SelectItem value="Block C">Block C</SelectItem>
                        <SelectItem value="Block D">Block D</SelectItem>
                        <SelectItem value="Block E">Block E</SelectItem>
                        <SelectItem value="custom">Other (specify)</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedBlock === 'custom' && (
                      <Input
                        placeholder="Enter your block name (e.g., Sector 5, Tower 2, etc.)"
                        value={customBlock}
                        onChange={(e) => setCustomBlock(e.target.value)}
                        className="h-10"
                      />
                    )}
                  </div>
                )}
                
                {selectedBlock === 'custom' && (
                  <Input
                    placeholder="Enter your block name"
                    value={customBlock}
                    onChange={(e) => setCustomBlock(e.target.value)}
                    className="h-10"
                  />
                )}
              </div>
            )}

            {/* Role Selection */}
            {selectedCommunity && !showOtherFlow && (
              <div className="space-y-3">
                <Label className="text-base font-semibold text-[#001F3F]">
                  Are you a tenant or owner?
                </Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as 'tenant' | 'owner')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="tenant" />
                    <Label htmlFor="tenant" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Tenant
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="owner" />
                    <Label htmlFor="owner" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Owner
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Address Input */}
            {selectedCommunity && !showOtherFlow && (
              <div className="space-y-3">
                <Label htmlFor="address" className="text-base font-semibold text-[#001F3F]">
                  Your Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete address (house/flat number, street, etc.)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-[80px] text-base"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            {selectedCommunity && !showOtherFlow && (
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !address.trim()}
                  className="w-full h-14 bg-gradient-to-r from-[#001F3F] to-[#001F3F]/90 hover:from-[#001F3F]/90 hover:to-[#001F3F] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{fontFamily: 'Montserrat-Bold, Helvetica'}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5 mr-3" />
                      Join {selectedCommunity.name}
                    </>
                  )}
                </Button>
                {!user && (
                  <p className="text-sm text-center text-[#001F3F]/70 font-medium">
                    You'll be asked to login or sign up when you submit
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowLoginDialog(false);
          }
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default JoinCommunityForm;
