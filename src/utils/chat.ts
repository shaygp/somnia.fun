import { ChatMessage, TokenChatData } from '@/types/profile';
import { getProfile } from './profile';

const CHAT_STORAGE_KEY = 'somnia_token_chats';

export const getTokenChat = (tokenAddress: string): TokenChatData => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    const allChats: Record<string, TokenChatData> = stored ? JSON.parse(stored) : {};
    
    return allChats[tokenAddress.toLowerCase()] || {
      tokenAddress: tokenAddress.toLowerCase(),
      messages: [],
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error loading chat:', error);
    return {
      tokenAddress: tokenAddress.toLowerCase(),
      messages: [],
      lastUpdated: Date.now()
    };
  }
};

export const saveTokenChat = (chatData: TokenChatData): void => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    const allChats: Record<string, TokenChatData> = stored ? JSON.parse(stored) : {};
    
    allChats[chatData.tokenAddress.toLowerCase()] = {
      ...chatData,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allChats));
  } catch (error) {
    console.error('Error saving chat:', error);
  }
};

export const addMessage = (tokenAddress: string, userAddress: string, message: string, replyToMessageId?: string): ChatMessage => {
  const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userProfile = getProfile(userAddress);
  
  // Find the message being replied to
  let replyTo: ChatMessage['replyTo'] = undefined;
  if (replyToMessageId) {
    const chatData = getTokenChat(tokenAddress);
    const originalMessage = chatData.messages.find(msg => msg.id === replyToMessageId);
    if (originalMessage) {
      replyTo = {
        messageId: originalMessage.id,
        userAddress: originalMessage.userAddress,
        userDisplayName: originalMessage.userProfile?.displayName || 
                        `${originalMessage.userAddress.slice(0, 6)}...${originalMessage.userAddress.slice(-4)}`,
        originalMessage: originalMessage.message
      };
    }
  }
  
  const newMessage: ChatMessage = {
    id: messageId,
    tokenAddress: tokenAddress.toLowerCase(),
    userAddress: userAddress.toLowerCase(),
    message: message.trim(),
    timestamp: Date.now(),
    userProfile: userProfile || undefined,
    replyTo
  };
  
  const chatData = getTokenChat(tokenAddress);
  chatData.messages.push(newMessage);
  
  // Keep only last 1000 messages to prevent storage bloat
  if (chatData.messages.length > 1000) {
    chatData.messages = chatData.messages.slice(-1000);
  }
  
  saveTokenChat(chatData);
  return newMessage;
};

export const getMessages = (tokenAddress: string): ChatMessage[] => {
  const chatData = getTokenChat(tokenAddress);
  
  // Update user profiles for messages that might not have them
  return chatData.messages.map(message => {
    if (!message.userProfile) {
      const profile = getProfile(message.userAddress);
      return { ...message, userProfile: profile || undefined };
    }
    return message;
  });
};

export const deleteMessage = (tokenAddress: string, messageId: string, userAddress: string): boolean => {
  try {
    const chatData = getTokenChat(tokenAddress);
    const messageIndex = chatData.messages.findIndex(msg => 
      msg.id === messageId && msg.userAddress.toLowerCase() === userAddress.toLowerCase()
    );
    
    if (messageIndex === -1) {
      return false; // Message not found or user doesn't own it
    }
    
    chatData.messages.splice(messageIndex, 1);
    saveTokenChat(chatData);
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

export const formatMessageTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};