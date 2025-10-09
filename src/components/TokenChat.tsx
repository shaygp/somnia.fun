import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, User, Settings, Reply, X, Trash2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ChatMessage } from '@/types/profile';
import { addMessage, getMessages, formatMessageTime, deleteMessage } from '@/utils/chat';
import { getProfile, createDefaultProfile } from '@/utils/profile';
import { useToast } from '@/hooks/use-toast';
import ProfileModal from './ProfileModal';

interface TokenChatProps {
  tokenAddress: string;
  tokenName: string;
}

const TokenChat: React.FC<TokenChatProps> = ({ tokenAddress, tokenName }) => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [tokenAddress]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    const tokenMessages = getMessages(tokenAddress);
    setMessages(tokenMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!address || !isConnected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to send messages',
        variant: 'destructive'
      });
      return;
    }

    if (!newMessage.trim()) return;

    setIsSubmitting(true);

    try {
      // Ensure user has a profile
      let userProfile = getProfile(address);
      if (!userProfile) {
        userProfile = createDefaultProfile(address);
      }

      // Add the message
      const message = addMessage(tokenAddress, address, newMessage, replyingTo?.id);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setReplyingTo(null);
      
      toast({
        title: 'Message sent!',
        description: 'Your message has been added to the chat.'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openProfileModal = (userAddress?: string) => {
    if (userAddress) {
      setViewingProfile(userAddress);
    } else {
      setViewingProfile('');
    }
    setShowProfileModal(true);
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!address) return;
    
    const success = deleteMessage(tokenAddress, messageId, address);
    if (success) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: 'Message deleted',
        description: 'Your message has been removed from the chat.'
      });
    } else {
      toast({
        title: 'Failed to delete message',
        description: 'You can only delete your own messages.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="bg-somnia-card border-somnia-border h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-somnia-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {tokenName} Community Chat
          </h3>
        </div>
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openProfileModal()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No messages yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="group">
              {/* Reply indicator */}
              {message.replyTo && (
                <div className="ml-11 mb-2 p-2 bg-somnia-hover/50 border-l-2 border-primary/50 rounded-r text-xs">
                  <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                    <Reply className="w-3 h-3" />
                    <span>Replying to {message.replyTo.userDisplayName}</span>
                  </div>
                  <p className="text-muted-foreground italic truncate">
                    {message.replyTo.originalMessage}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <Avatar 
                    className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => openProfileModal(message.userAddress)}
                  >
                    <AvatarImage 
                      src={message.userProfile?.avatar} 
                      alt={message.userProfile?.displayName || 'User'}
                    />
                    <AvatarFallback className="bg-somnia-hover text-xs">
                      {message.userProfile?.displayName?.slice(0, 2).toUpperCase() || 
                       message.userAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span 
                      className="font-medium text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => openProfileModal(message.userAddress)}
                    >
                      {message.userProfile?.displayName || 
                       `${message.userAddress.slice(0, 6)}...${message.userAddress.slice(-4)}`}
                    </span>
                    {message.userProfile?.isVerified && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary text-xs px-1 py-0">
                        ✓
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {/* Action buttons */}
                    {isConnected && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Reply button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReply(message)}
                          className="p-1 h-auto hover:bg-somnia-hover"
                        >
                          <Reply className="w-3 h-3" />
                        </Button>
                        {/* Delete button - only show for own messages */}
                        {message.userAddress.toLowerCase() === address?.toLowerCase() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 h-auto hover:bg-red-500/20 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-somnia-border">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="p-3 bg-somnia-hover/50 border-b border-somnia-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Reply className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Replying to</span>
                <span className="font-medium text-foreground">
                  {replyingTo.userProfile?.displayName || 
                   `${replyingTo.userAddress.slice(0, 6)}...${replyingTo.userAddress.slice(-4)}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelReply}
                className="p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 italic truncate">
              {replyingTo.message}
            </p>
          </div>
        )}
        
        <div className="p-4">
          {isConnected ? (
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={replyingTo 
                  ? `Reply to ${replyingTo.userProfile?.displayName || 'user'}...` 
                  : `Share your thoughts about ${tokenName}...`}
                className="flex-1 bg-somnia-hover border-somnia-border focus:border-primary"
                maxLength={500}
                disabled={isSubmitting}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Connect your wallet to join the conversation
              </p>
              <Button variant="outline" onClick={() => {}}>
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        viewAddress={viewingProfile || undefined}
      />
    </Card>
  );
};

export default TokenChat;