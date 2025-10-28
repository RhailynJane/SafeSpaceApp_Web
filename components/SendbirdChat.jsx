"use client";

import { useState, useEffect, useRef } from 'react';
import { useSendbird } from '../hooks/useSendbird';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Check, CheckCheck, Send, Smile, Paperclip } from 'lucide-react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const ReadReceipt = ({ message, channel }) => {
  if (!channel) return null;
  const unreadCount = channel.getUnreadMemberCount(message);

  if (unreadCount === 0) {
    return <CheckCheck size={14} className="text-blue-400" />;
  } else {
    return <Check size={14} className="text-gray-400" />;
  }
};

const SendbirdChat = ({ channelUrl, onChannelReady }) => {
  const { sb, user } = useSendbird();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (sb && channelUrl) {
      sb.GroupChannel.getChannel(channelUrl).then((channel) => {
        setChannel(channel);
        if (onChannelReady) {
          onChannelReady(channel);
        }
        const query = channel.createPreviousMessageListQuery();
        query.load(100, true, (loadedMessages, error) => {
          if (error) {
            console.error('Error loading messages:', error);
          } else {
            const sortedMessages = loadedMessages.reverse();
            setMessages(sortedMessages);
            channel.markAsRead();
          }
        });
      });
    }
  }, [sb, channelUrl, onChannelReady]);

  useEffect(() => {
    if (channel) {
      const channelHandler = new sb.ChannelHandler();
      
      channelHandler.onMessageReceived = (channel, message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        channel.markAsRead();
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100);
      };

      channelHandler.onTypingStatusUpdated = (channel) => {
        setTypingUsers(channel.getTypingUsers());
      };

      channelHandler.onReadStatusUpdated = (channel) => {
        setMessages((prevMessages) => [...prevMessages]);
      };

      sb.addChannelHandler(channel.url, channelHandler);

      return () => {
        sb.removeChannelHandler(channel.url);
      };
    }
  }, [channel, sb]);

  useEffect(() => {
    if (messages.length > 0 && messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    channel.sendUserMessage(params, (sentMessage, error) => {
      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        setMessage('');
        handleTyping(false);
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const params = new sb.FileMessageParams();
    params.file = file;
    params.fileName = file.name;
    params.fileSize = file.size;
    params.mimeType = file.type;

    channel.sendFileMessage(params, (sentMessage, error) => {
      if (error) {
        console.error('Error sending file:', error);
        alert('Failed to send file. Please try again.');
      } else {
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });

    event.target.value = '';
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

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

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessageContent = (msg) => {
    if (msg.messageType === 'file') {
      const fileUrl = msg.url;
      const fileName = msg.name || 'file';
      
      if (msg.type && msg.type.startsWith('image/')) {
        return (
          <div>
            <img src={fileUrl} alt={fileName} className="max-w-full rounded-lg" />
            <p className="text-xs mt-1">{fileName}</p>
          </div>
        );
      } else {
        return (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
            <Paperclip size={14} />
            {fileName}
          </a>
        );
      }
    }
    return <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>;
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white flex flex-col flex-1 min-h-0">
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-6 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
                      ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                  }`}>
                    {renderMessageContent(msg)}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <p className={`text-[11px] ${isOwnMessage ? 'text-teal-100' : 'text-gray-500'}`}>
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
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-100" 
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

      <div className="p-4 bg-white border-t border-gray-200 relative">
        {showEmojiPicker && (
  <div
    ref={emojiPickerRef}
    className="absolute bottom-[72px] right-2 z-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
    style={{
      maxHeight: "260px",
      width: "300px",
    }}
  >
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      width="100%"
      height={350}
      theme="light"
    />
  </div>
)}


        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1 border border-gray-200 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gray-200 rounded-full h-9 w-9 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
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
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={18} className="text-gray-500" />
          </Button>
          
          <Button 
            onClick={sendMessage}
            disabled={!message.trim()}
            className="rounded-full h-9 w-9 p-0 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendbirdChat;