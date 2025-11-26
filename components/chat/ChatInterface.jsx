import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Plus, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import NewConversationModal from './NewConversationModal';

const ChatInterface = () => {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Convex queries and mutations
  const conversations = useQuery(api.conversations.list);
  const messages = useQuery(
    api.messages.list,
    selectedConversation ? { conversationId: selectedConversation._id } : "skip"
  );
  const sendMessage = useMutation(api.messages.send);
  const markAsRead = useMutation(api.conversations.markAsRead);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead({ conversationId: selectedConversation._id });
    }
  }, [selectedConversation, markAsRead]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await sendMessage({
        conversationId: selectedConversation._id,
        body: messageInput.trim()
      });
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getConversationTitle = (conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants?.filter(
      p => p.userId !== user?.id
    );
    
    if (otherParticipants?.length > 0) {
      return otherParticipants.map(p => `${p.firstName} ${p.lastName}`).join(', ');
    }
    
    return 'New Conversation';
  };

  const getConversationAvatar = (conversation) => {
    const otherParticipants = conversation.participants?.filter(
      p => p.userId !== user?.id
    );
    
    if (otherParticipants?.length === 1) {
      return otherParticipants[0].imageUrl;
    }
    
    return null;
  };

  const getInitials = (conversation) => {
    const title = getConversationTitle(conversation);
    return title.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredConversations = conversations?.filter(conv => 
    getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleConversationCreated = async (conversationId) => {
    // Find the newly created conversation and select it
    const conversation = conversations?.find(c => c._id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-200px)] bg-background border border-border rounded-lg overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-card-foreground">Messages</h2>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0"
              onClick={() => setShowNewConversationModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No conversations yet</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setShowNewConversationModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Card 
                  key={conversation._id}
                  className={`mb-2 cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedConversation?._id === conversation._id 
                      ? 'bg-accent border-primary' 
                      : 'border-border'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getConversationAvatar(conversation)} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(conversation)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-card-foreground truncate">
                            {getConversationTitle(conversation)}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.latestMessage?.body || 'Start a conversation...'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.latestMessage?.createdAt 
                            ? formatDistanceToNow(new Date(conversation.latestMessage.createdAt), { addSuffix: true })
                            : formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getConversationAvatar(selectedConversation)} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedConversation)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-card-foreground">
                      {getConversationTitle(selectedConversation)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.participants?.length || 0} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages?.page?.map((message) => (
                  <div
                    key={message._id}
                    className={`flex gap-3 ${
                      message.senderId === user?.id ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.imageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {message.sender?.firstName?.[0] || 'U'}
                        {message.sender?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col max-w-[70%] ${
                      message.senderId === user?.id ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`px-3 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <p className="text-sm">{message.body}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!messageInput.trim()}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Choose a conversation from the sidebar to start chatting with clients and team members.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        open={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </>
  );
};

export default ChatInterface;