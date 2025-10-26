"use client";

import { useState, useEffect, useRef } from 'react';
import { useSendbird } from '../hooks/useSendbird';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Check, CheckCheck, Send, Smile, Paperclip, MoreVertical } from 'lucide-react';

const ReadReceipt = ({ message, channel }) => {
  if (!channel) return null;
  const unreadCount = channel.getUnreadMemberCount(message);

  if (unreadCount === 0) {
    return <CheckCheck size={14} className="text-blue-400" />; // Double check for read
  } else {
    return <Check size={14} className="text-gray-400" />; // Single check for delivered
  }
};

const SendbirdChat = ({ channelUrl, onClose }) => {
  const { sb, user } = useSendbird();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get channel and load message history
  useEffect(() => {
    if (sb && channelUrl) {
      sb.GroupChannel.getChannel(channelUrl).then((channel) => {
        setChannel(channel);
        const query = channel.createPreviousMessageListQuery();
        query.load(100, true, (messages, error) => {
          if (error) {
            console.error('Error loading messages:', error);
          } else {
            setMessages(messages);
            channel.markAsRead();
          }
        });
      });
    }
  }, [sb, channelUrl]);

  // Set up channel handler for real-time messages
  useEffect(() => {
    if (channel) {
      const channelHandler = new sb.ChannelHandler();
      
      channelHandler.onMessageReceived = (channel, message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        channel.markAsRead();
      };

      channelHandler.onTypingStatusUpdated = (channel) => {
        setTypingUsers(channel.getTypingUsers());
      };

      channelHandler.onReadStatusUpdated = (channel) => {
        // Force a re-render to update read receipts
        setMessages((prevMessages) => [...prevMessages]);
      };

      sb.addChannelHandler(channel.url, channelHandler);

      return () => {
        sb.removeChannelHandler(channel.url);
      };
    }
  }, [channel, sb]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleTyping = (isTyping) => {
    if (channel) {
      if (isTyping) {
        channel.startTyping();
      } else {
        channel.endTyping();
      }
    }
  };

  const sendMessage = () => {
    if (message.trim() === '') return;

    const params = new sb.UserMessageParams();
    params.message = message;

    channel.sendUserMessage(params, (message, error) => {
      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessages((prevMessages) => [...prevMessages, message]);
        setMessage('');
        handleTyping(false);
      }
    });
  };

  const getOtherParticipant = () => {
    if (!channel || !user) return null;
    const members = channel.members || [];
    return members.find(m => m.userId !== user.userId) || null;
  };

  const getDisplayName = () => {
    const otherParticipant = getOtherParticipant();
    if (otherParticipant) {
      return otherParticipant.nickname || otherParticipant.userId;
    }
    // Fallback: if channel name doesn't start with "Chat between", use it
    if (channel?.name && !channel.name.toLowerCase().includes('chat between')) {
      return channel.name;
    }
    return 'Chat';
  };

  const handleClearChat = () => {
    if (channel && window.confirm('Are you sure you want to clear this chat?')) {
      // Clear messages locally
      setMessages([]);
      setShowMenu(false);
    }
  };

  const handleMuteNotifications = () => {
    if (channel) {
      // Toggle mute - in real implementation, you'd call channel.setMyPushTriggerOption()
      alert('Notifications muted for this chat');
      setShowMenu(false);
    }
  };

  const handleBlockUser = () => {
    const otherUser = getOtherParticipant();
    if (otherUser && window.confirm(`Block ${otherUser.nickname}?`)) {
      // In real implementation, you'd call sb.blockUser()
      alert(`${otherUser.nickname} blocked`);
      setShowMenu(false);
    }
  };

  // Format date for message grouping
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Check if we should show date separator
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white flex flex-col h-full shadow-xl rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {channel && (
            <>
              <div className="relative">
                <img 
                  src={getOtherParticipant()?.profileUrl || channel.coverUrl || '/images/logo.png'} 
                  alt="profile" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100" 
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getOtherParticipant()?.nickname || channel.name || 'Chat'}
                </h3>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 relative menu-container">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gray-100 rounded-full"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} className="text-gray-600" />
          </Button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50">
              <button
                onClick={handleMuteNotifications}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Mute notifications
              </button>
              <button
                onClick={handleClearChat}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear chat history
              </button>
              <button
                onClick={handleBlockUser}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Block user
              </button>
            </div>
          )}
          
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full"
            >
              <X size={20} className="text-gray-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-6 space-y-1">
        {messages.map((msg, index) => {
          const showDateSeparator = shouldShowDateSeparator(msg, messages[index - 1]);
          const isOwnMessage = msg.sender.userId === user.userId;
          const showAvatar = !isOwnMessage && (index === messages.length - 1 || messages[index + 1]?.sender.userId !== msg.sender.userId);
          
          return (
            <div key={msg.messageId}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="bg-gray-200 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
                    {formatMessageDate(msg.createdAt)}
                  </div>
                </div>
              )}
              
              <div className={`flex items-end gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                {!isOwnMessage && (
                  <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && (
                      <img 
                        src={msg.sender.profileUrl || '/images/logo.png'} 
                        alt="sender profile" 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100" 
                      />
                    )}
                  </div>
                )}
                
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {!isOwnMessage && showAvatar && (
                    <span className="text-xs font-medium text-gray-700 mb-1 px-1">
                      {msg.sender.nickname}
                    </span>
                  )}
                  
                  <div className={`group relative rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${
                    isOwnMessage 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <p className={`text-[11px] ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isOwnMessage && <ReadReceipt message={msg} channel={channel} />}
                    </div>
                  </div>
                </div>
                
                {isOwnMessage && (
                  <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && (
                      <img 
                        src={user.profileUrl || '/images/logo.png'} 
                        alt="my profile" 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100" 
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing Indicator */}
      <div className="h-6 px-6 flex items-center">
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-gray-500">
              {typingUsers.map((user) => user.nickname).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1 border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gray-200 rounded-full h-9 w-9 flex-shrink-0"
          >
            <Paperclip size={18} className="text-gray-500" />
          </Button>
          
          <Input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              handleTyping(true);
              typingTimeoutRef.current = setTimeout(() => {
                handleTyping(false);
              }, 3000);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                handleTyping(false);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gray-200 rounded-full h-9 w-9 flex-shrink-0"
          >
            <Smile size={18} className="text-gray-500" />
          </Button>
          
          <Button 
            onClick={sendMessage}
            disabled={!message.trim()}
            className="rounded-full h-9 w-9 p-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendbirdChat;