import { UserProfile } from '@/types/profile';

const PROFILE_STORAGE_KEY = 'somnia_user_profiles';
const CURRENT_PROFILE_KEY = 'somnia_current_profile';

export const getStoredProfiles = (): Record<string, UserProfile> => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading profiles:', error);
    return {};
  }
};

export const saveProfile = (profile: UserProfile): void => {
  try {
    const profiles = getStoredProfiles();
    profiles[profile.address.toLowerCase()] = profile;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
    localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

export const getProfile = (address: string): UserProfile | null => {
  const profiles = getStoredProfiles();
  return profiles[address.toLowerCase()] || null;
};

export const getCurrentProfile = (): UserProfile | null => {
  try {
    const stored = localStorage.getItem(CURRENT_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading current profile:', error);
    return null;
  }
};

export const createDefaultProfile = (address: string): UserProfile => {
  const profile: UserProfile = {
    address: address.toLowerCase(),
    displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
    bio: '',
    createdAt: Date.now(),
    tokensCreated: 0,
    isVerified: false
  };
  
  saveProfile(profile);
  return profile;
};

export const updateProfile = (address: string, updates: Partial<UserProfile>): UserProfile | null => {
  const profile = getProfile(address) || createDefaultProfile(address);
  const updatedProfile = { ...profile, ...updates, address: address.toLowerCase() };
  saveProfile(updatedProfile);
  return updatedProfile;
};

export const generateAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
};