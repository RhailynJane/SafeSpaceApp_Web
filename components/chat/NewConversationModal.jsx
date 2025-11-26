import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

const NewConversationModal = ({ open, onClose, onConversationCreated }) => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [conversationTitle, setConversationTitle] = useState('');

  // Query all users in the organization
  const users = useQuery(api.users.list, user ? { clerkId: user.id } : "skip") || [];
  const createConversation = useMutation(api.conversations.getOrCreate);

  const filteredUsers = users.filter(u => 
    u.clerkId !== user?.id && // Exclude current user
    (u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUserToggle = (selectedUser) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.clerkId === selectedUser.clerkId);
      if (exists) {
        return prev.filter(u => u.clerkId !== selectedUser.clerkId);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const participantIds = selectedUsers.map(u => u.clerkId);
      const conversationId = await createConversation({
        participantIds,
        title: conversationTitle.trim() || undefined
      });

      // Reset form
      setSelectedUsers([]);
      setConversationTitle('');
      setSearchTerm('');
      
      onConversationCreated(conversationId);
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'team_leader': return 'bg-blue-100 text-blue-800';
      case 'support_worker': return 'bg-green-100 text-green-800';
      case 'peer_support': return 'bg-purple-100 text-purple-800';
      case 'client': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (roleId) => {
    switch (roleId) {
      case 'team_leader': return 'Team Leader';
      case 'support_worker': return 'Support Worker';
      case 'peer_support': return 'Peer Support';
      case 'client': return 'Client';
      case 'admin': return 'Admin';
      default: return roleId || 'User';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conversation Title */}
          <div>
            <Label htmlFor="title">Conversation Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Enter conversation title..."
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
            />
          </div>

          {/* User Search */}
          <div>
            <Label htmlFor="search">Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <Label>Selected Participants ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map(user => (
                  <Badge 
                    key={user.clerkId}
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleUserToggle(user)}
                  >
                    {user.firstName} {user.lastName}
                    <span className="ml-1 text-xs">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User List */}
          <div>
            <ScrollArea className="h-60">
              <div className="space-y-1">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {searchTerm ? 'No users found' : 'No users available'}
                  </p>
                ) : (
                  filteredUsers.map(filteredUser => (
                    <div
                      key={filteredUser.clerkId}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                        selectedUsers.find(u => u.clerkId === filteredUser.clerkId) 
                          ? 'bg-primary/10 border border-primary/20' 
                          : ''
                      }`}
                      onClick={() => handleUserToggle(filteredUser)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={filteredUser.imageUrl || filteredUser.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {filteredUser.firstName?.[0] || 'U'}
                          {filteredUser.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {filteredUser.firstName} {filteredUser.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {filteredUser.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getRoleColor(filteredUser.roleId)}`}>
                          {formatRoleName(filteredUser.roleId)}
                        </Badge>
                        {selectedUsers.find(u => u.clerkId === filteredUser.clerkId) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0}
          >
            Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationModal;