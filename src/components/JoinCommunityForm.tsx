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
import { joinCommunity } from '@/lib/communities';
import { getCommunityBlocks } from '@/lib/blocks';
import { LoginDialog } from './LoginDialog';
import { supabase } from '@/lib/supabase';

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

  // No need to check login status on mount - let users fill the form first

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
            <Users className="h-8 w-8 md:h-10 md:h-10 text-white" />
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
                <Select value={selectedCommunity?.id || ''} onValueChange={handleCommunitySelect}>
                  <SelectTrigger className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl text-base font-medium">
                    <SelectValue placeholder="Choose your community" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-base">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Block Selection */}
            {selectedCommunity && (
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
            {selectedCommunity && (
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
            {selectedCommunity && (
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
            {selectedCommunity && (
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
