export interface UserProfile {
  address: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: number;
  tokensCreated: number;
  isVerified?: boolean;
}

export interface ChatMessage {
  id: string;
  tokenAddress: string;
  userAddress: string;
  message: string;
  timestamp: number;
  userProfile?: UserProfile;
  replyTo?: {
    messageId: string;
    userAddress: string;
    userDisplayName: string;
    originalMessage: string;
  };
}

export interface TokenChatData {
  tokenAddress: string;
  messages: ChatMessage[];
  lastUpdated: number;
}