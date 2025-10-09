export interface SocialLinks {
  telegram?: string;
  discord?: string;
  twitter?: string;
}

export const parseSocialLinksFromDescription = (description: string): { cleanDescription: string; socialLinks: SocialLinks } => {
  const socialLinksPattern = /__SOCIAL_LINKS__(.+)$/;
  const match = description.match(socialLinksPattern);
  
  if (!match) {
    return {
      cleanDescription: description,
      socialLinks: {}
    };
  }
  
  try {
    const socialLinksJson = match[1];
    const socialLinks = JSON.parse(socialLinksJson);
    const cleanDescription = description.replace(socialLinksPattern, '').trim();
    
    return {
      cleanDescription,
      socialLinks
    };
  } catch (error) {
    console.error('Error parsing social links:', error);
    return {
      cleanDescription: description,
      socialLinks: {}
    };
  }
};

export const validateSocialUrl = (url: string, platform: 'telegram' | 'discord' | 'twitter'): boolean => {
  if (!url.trim()) return true; // Empty URLs are valid (optional)
  
  const patterns = {
    telegram: /^https?:\/\/(t\.me|telegram\.me)\/.+/i,
    discord: /^https?:\/\/(discord\.gg|discord\.com\/invite)\/.+/i,
    twitter: /^https?:\/\/(twitter\.com|x\.com)\/.+/i
  };
  
  return patterns[platform].test(url);
};