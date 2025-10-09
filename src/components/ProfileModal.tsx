import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Edit3, Save, X, Upload, Shuffle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { UserProfile } from '@/types/profile';
import { getProfile, saveProfile, createDefaultProfile, generateAvatarUrl } from '@/utils/profile';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewAddress?: string; // If provided, view another user's profile
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, viewAddress }) => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    bio: '',
    avatar: ''
  });

  const targetAddress = viewAddress || address;
  const canEdit = !viewAddress && address; // Can only edit own profile

  useEffect(() => {
    if (targetAddress) {
      let userProfile = getProfile(targetAddress);
      if (!userProfile && targetAddress === address) {
        userProfile = createDefaultProfile(targetAddress);
      }
      setProfile(userProfile);
      
      if (userProfile) {
        setEditData({
          displayName: userProfile.displayName,
          bio: userProfile.bio || '',
          avatar: userProfile.avatar || ''
        });
      }
    }
  }, [targetAddress, address]);

  const handleSave = () => {
    if (!targetAddress || !profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      displayName: editData.displayName.trim() || profile.displayName,
      bio: editData.bio.trim(),
      avatar: editData.avatar.trim() || profile.avatar
    };

    saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsEditing(false);
    
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been saved successfully.'
    });
  };

  const generateNewAvatar = () => {
    if (!targetAddress) return;
    const newAvatar = generateAvatarUrl(Date.now().toString());
    setEditData({ ...editData, avatar: newAvatar });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          title: 'File too large',
          description: 'Please choose an image smaller than 1MB',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditData({ ...editData, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile || !targetAddress) {
    return null;
  }

  const isOwnProfile = targetAddress === address;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-somnia-card border-somnia-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{isOwnProfile ? 'Your Profile' : 'User Profile'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-somnia-border">
                <AvatarImage 
                  src={isEditing ? editData.avatar : profile.avatar} 
                  alt={profile.displayName}
                />
                <AvatarFallback className="bg-somnia-hover text-foreground">
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && canEdit && (
                <div className="absolute -bottom-2 -right-2 flex space-x-1">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80">
                      <Upload className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-6 h-6 p-0 rounded-full"
                    onClick={generateNewAvatar}
                  >
                    <Shuffle className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {profile.isVerified && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                  Verified
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {profile.tokensCreated} tokens created
              </Badge>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Display Name</Label>
              {isEditing && canEdit ? (
                <Input
                  value={editData.displayName}
                  onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                  placeholder="Enter display name"
                  className="mt-1 bg-somnia-hover border-somnia-border"
                  maxLength={50}
                />
              ) : (
                <p className="mt-1 text-sm text-foreground">{profile.displayName}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Wallet Address</Label>
              <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                {profile.address}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Bio</Label>
              {isEditing && canEdit ? (
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell the community about yourself..."
                  className="mt-1 bg-somnia-hover border-somnia-border min-h-[80px]"
                  maxLength={200}
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.bio || 'No bio added yet.'}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex space-x-2 pt-4 border-t border-somnia-border">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;