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
      case 'admin': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800';
      case 'team_leader': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800';
      case 'support_worker': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800';
      case 'peer_support': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-800';
      case 'client': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800';
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
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold">Start New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden">
          {/* Conversation Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Conversation Title (Optional)
            </Label>
            <Input
              id="title"
              placeholder="Enter conversation title..."
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Add Participants
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Selected Participants ({selectedUsers.length})
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                {selectedUsers.map(user => (
                  <Badge 
                    key={user.clerkId}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => handleUserToggle(user)}
                  >
                    <span className="text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs opacity-70 hover:opacity-100">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User List */}
          <div className="space-y-2 flex-1 overflow-hidden">
            <Label className="text-sm font-medium">Available Users</Label>
            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="text-sm">
                        {searchTerm ? 'No users found matching your search' : 'No users available'}
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map(filteredUser => (
                      <div
                        key={filteredUser.clerkId}
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all hover:bg-accent/50 ${
                          selectedUsers.find(u => u.clerkId === filteredUser.clerkId) 
                            ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                            : 'hover:shadow-sm'
                        }`}
                        onClick={() => handleUserToggle(filteredUser)}
                      >
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={filteredUser.imageUrl || filteredUser.profileImageUrl} />
                          <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                            {filteredUser.firstName?.[0] || 'U'}
                            {filteredUser.lastName?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-medium text-sm text-foreground">
                            {filteredUser.firstName} {filteredUser.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {filteredUser.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs px-2 py-1 ${getRoleColor(filteredUser.roleId)}`}>
                            {formatRoleName(filteredUser.roleId)}
                          </Badge>
                          {selectedUsers.find(u => u.clerkId === filteredUser.clerkId) && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0}
            className="px-6"
          >
            Start Conversation ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationModal;