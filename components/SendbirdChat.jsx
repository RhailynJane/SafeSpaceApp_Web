/**
 * 
 * comments added on this file with the help of claude ai
 * Prompt: add proper comments and documentation on this file
 * 
 * Sendbird Chat Component
 * 
 * A full-featured real-time chat interface using Sendbird SDK.
 * 
 * Features:
 * - Real-time messaging with WebSocket connection
 * - Read receipts (single/double check marks)
 * - Typing indicators
 * - File/image uploads
 * - Emoji picker
 * - Message history loading
 * - Auto-scrolling to latest messages
 * - Date separators between messages
 * - Profile pictures
 * - Responsive design
 * 
 * @module components/SendbirdChat
 */

// ==========================================
// CLIENT-SIDE DIRECTIVE
// ==========================================
// Marks this component for client-side rendering only
// Required because we use browser-specific features (WebSockets, DOM refs)
"use client";

// ==========================================
// IMPORTS - React Hooks
// ==========================================

// useState: Manages component state (messages, typing status, etc.)
// useEffect: Runs side effects (connect to chat, load messages, event listeners)
// useRef: Creates references to DOM elements and mutable values
import { useState, useEffect, useRef } from 'react';

// ==========================================
// IMPORTS - Custom Hooks and Components
// ==========================================

// Custom hook that provides Sendbird connection and current user
import { useSendbird } from '../hooks/useSendbird';

// UI components from our component library
import { Button } from './ui/button';
import { Input } from './ui/input';

// Icons from lucide-react
// Check: Single check mark (message sent)
// CheckCheck: Double check mark (message read)
// Send: Send message button icon
// Smile: Emoji picker button icon
// Paperclip: File attachment button icon
import { Check, CheckCheck, Send, Smile, Paperclip } from 'lucide-react';

// ==========================================
// DYNAMIC IMPORT
// ==========================================

// Dynamic import from Next.js for code-splitting
// Loads the emoji picker component only when needed (not on initial page load)
// this feature is added using gemini - help
import dynamic from 'next/dynamic';

// Import EmojiPicker component dynamically
// ssr: false means don't render this on the server (only in browser)
// This is necessary because emoji-picker-react uses browser-only APIs
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// ==========================================
// READ RECEIPT COMPONENT
// ==========================================

/**
 * ReadReceipt Component
 * 
 * Displays read status for sent messages:
 * - Double check (blue): Message has been read by all recipients
 * - Single check (gray): Message sent but not yet read
 * 
 * @param {Object} props
 * @param {Object} props.message - The message object from Sendbird
 * @param {Object} props.channel - The channel object from Sendbird
 * @returns {JSX.Element|null} Check icon or null
 */
const ReadReceipt = ({ message, channel }) => {
  // Safety check: if no channel, don't render anything
  if (!channel) return null;
  
  // Get number of members who haven't read this message
  // Returns 0 if everyone has read it
  const unreadCount = channel.getUnreadMemberCount(message);

  // If unread count is 0, everyone has read it
  if (unreadCount === 0) {
    // Show double check mark in blue (WhatsApp-style)
    return <CheckCheck size={14} className="text-blue-400" />;
  } else {
    // Some people haven't read it yet - show single check in gray
    return <Check size={14} className="text-gray-400" />;
  }
};

// ==========================================
// MAIN CHAT COMPONENT
// ==========================================

/**
 * SendbirdChat Component
 * 
 * Main chat interface component that handles:
 * - Loading and displaying message history
 * - Sending text messages
 * - Sending file/image attachments
 * - Real-time updates (new messages, typing indicators, read receipts)
 * - Emoji selection
 * - Auto-scrolling
 * 
 * @param {Object} props
 * @param {string} props.channelUrl - Unique identifier for the Sendbird channel
 * @param {Function} props.onChannelReady - Callback when channel is loaded
 * @returns {JSX.Element} The chat interface
 */
const SendbirdChat = ({ channelUrl, onChannelReady }) => {
  // ==========================================
  // HOOKS - Sendbird Connection
  // ==========================================
  
  // Get Sendbird instance and current user from custom hook
  // sb: Sendbird SDK instance for API calls
  // user: Current logged-in user object
  const { sb, user } = useSendbird();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Channel state: stores the current Sendbird channel object
  const [channel, setChannel] = useState(null);
  
  // Messages state: array of all messages in the chat
  const [messages, setMessages] = useState([]);
  
  // Message input state: current text being typed
  const [message, setMessage] = useState('');
  
  // Typing users state: array of users currently typing
  const [typingUsers, setTypingUsers] = useState([]);
  
  // Emoji picker visibility state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ==========================================
  // REFS - DOM Elements and Timers
  // ==========================================
  // useRef creates mutable references that persist across re-renders
  // Unlike state, changing refs doesn't trigger re-renders
  
  // Reference to the message container div for auto-scrolling
  const messageContainerRef = useRef(null);
  
  // Reference to typing indicator timeout (for debouncing)
  const typingTimeoutRef = useRef(null);
  
  // Reference to hidden file input element
  const fileInputRef = useRef(null);
  
  // Reference to emoji picker container for click-outside detection
  const emojiPickerRef = useRef(null);

  // ==========================================
  // EFFECT 1: LOAD CHANNEL AND MESSAGES
  // ==========================================
  
  /**
   * Effect: Initialize channel and load message history
   * 
   * Runs when:
   * - Sendbird SDK is ready (sb exists)
   * - channelUrl changes
   * - onChannelReady callback changes
   * 
   * Does:
   * 1. Fetches the channel from Sendbird
   * 2. Notifies parent component
   * 3. Loads last 100 messages
   * 4. Marks channel as read
   */
  useEffect(() => {
    // Only run if Sendbird SDK is initialized and we have a channel URL
    if (sb && channelUrl) {
      // Fetch the channel by its URL
      sb.GroupChannel.getChannel(channelUrl).then((channel) => {
        // Store channel in state
        setChannel(channel);
        
        // Notify parent component that channel is ready
        // This allows parent to update UI or perform actions
        if (onChannelReady) {
          onChannelReady(channel);
        }
        
        // Create a query to load previous messages
        // This is Sendbird's way of fetching message history
        const query = channel.createPreviousMessageListQuery();
        
        // Load 100 messages
        // Parameters: (limit, reverse, callback)
        // reverse: false means oldest first, we'll reverse it ourselves
        query.load(100, true, (loadedMessages, error) => {
          if (error) {
            // Log error if message loading fails
            console.error('Error loading messages:', error);
          } else {
            // Reverse messages so newest is at bottom
            // Sendbird returns newest first by default
            const sortedMessages = loadedMessages.reverse();
            
            // Update messages state
            setMessages(sortedMessages);
            
            // Mark all messages as read (updates read receipts)
            channel.markAsRead();
          }
        });
      });
    }
  }, [sb, channelUrl, onChannelReady]); // Dependencies: re-run when these change

  // ==========================================
  // EFFECT 2: SET UP REAL-TIME EVENT HANDLERS
  // ==========================================
  
  /**
   * Effect: Register Sendbird event handlers
   * 
   * Runs when:
   * - Channel object changes
   * - Sendbird SDK changes
   * 
   * Does:
   * 1. Creates event handler for real-time updates
   * 2. Listens for new messages
   * 3. Listens for typing status updates
   * 4. Listens for read receipt updates
   * 5. Cleans up on unmount
   */
  useEffect(() => {
    if (channel) {
      // Create a new channel handler instance
      // This is Sendbird's event listener system
      const channelHandler = new sb.ChannelHandler();
      
      // ===== EVENT 1: New Message Received =====
      /**
       * Called when someone sends a new message to this channel
       * Parameters are provided by Sendbird SDK
       */
      channelHandler.onMessageReceived = (channel, message) => {
        // Add new message to the end of messages array
        // Use functional update to ensure we have latest state
        setMessages((prevMessages) => [...prevMessages, message]);
        
        // Mark channel as read (updates read receipts for everyone)
        channel.markAsRead();
        
        // Auto-scroll to bottom to show new message
        // setTimeout ensures DOM has updated before scrolling
        setTimeout(() => {
          if (messageContainerRef.current) {
            // Set scrollTop to scrollHeight (bottom of container)
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100); // 100ms delay for DOM update
      };

      // ===== EVENT 2: Typing Status Changed =====
      /**
       * Called when someone starts or stops typing
       */
      channelHandler.onTypingStatusUpdated = (channel) => {
        // Get array of users currently typing in this channel
        setTypingUsers(channel.getTypingUsers());
      };

      // ===== EVENT 3: Read Status Changed =====
      /**
       * Called when someone reads messages (for updating read receipts)
       */
      channelHandler.onReadStatusUpdated = (channel) => {
        // Force re-render of messages to update read receipt icons
        // Spread operator creates new array reference, triggering re-render
        setMessages((prevMessages) => [...prevMessages]);
      };

      // Register this handler with Sendbird
      // channel.url is used as the handler ID (must be unique)
      sb.addChannelHandler(channel.url, channelHandler);

      // ===== CLEANUP FUNCTION =====
      /**
       * Runs when component unmounts or channel changes
       * Removes event handlers to prevent memory leaks
       */
      return () => {
        sb.removeChannelHandler(channel.url);
      };
    }
  }, [channel, sb]); // Dependencies: re-run when channel or SDK changes

  // ==========================================
  // EFFECT 3: AUTO-SCROLL ON NEW MESSAGES
  // ==========================================
  
  /**
   * Effect: Scroll to bottom when messages change
   * 
   * Runs when:
   * - Number of messages changes (new message added)
   * 
   * Does:
   * - Scrolls message container to bottom
   * - Ensures user sees latest messages
   */
  useEffect(() => {
    // Only scroll if we have messages and the ref exists
    if (messages.length > 0 && messageContainerRef.current) {
      // Scroll to bottom of container
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages.length]); // Dependency: re-run when message count changes

  // ==========================================
  // EFFECT 4: CLOSE EMOJI PICKER ON OUTSIDE CLICK
  // ==========================================
  
  /**
   * Effect: Handle clicking outside emoji picker
   * 
   * Runs once on mount, sets up event listener
   * 
   * Does:
   * - Adds click listener to document
   * - Closes emoji picker if click is outside
   * - Cleans up listener on unmount
   */
  useEffect(() => {
    /**
     * Handler function for mouse clicks
     * Checks if click was outside emoji picker
     */
    const handleClickOutside = (event) => {
      // Check if emoji picker ref exists and click target is NOT inside it
      // contains() returns true if element contains the target
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        // Click was outside, close the picker
        setShowEmojiPicker(false);
      }
    };

    // Add event listener to entire document
    // 'mousedown' fires before 'click', catches the event earlier
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup: remove event listener when component unmounts
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // Empty dependencies: run once on mount

  // ==========================================
  // HANDLER FUNCTIONS
  // ==========================================

  /**
   * handleTyping - Manages typing indicator status
   * 
   * Tells Sendbird when user is typing or stopped typing
   * Other users in the channel see "User is typing..." indicator
   * 
   * @param {boolean} isTyping - true if user is typing, false if stopped
   */
  const handleTyping = (isTyping) => {
    // Only proceed if channel is loaded
    if (channel) {
      if (isTyping) {
        // Start typing indicator
        // Shows "User is typing..." to other participants
        channel.startTyping();
      } else {
        // Stop typing indicator
        // Removes "User is typing..." message
        channel.endTyping();
      }
    }
  };

  /**
   * sendMessage - Sends a text message to the channel
   * 
   * Flow:
   * 1. Validate message is not empty
   * 2. Create message parameters
   * 3. Send to Sendbird
   * 4. Add to local message list
   * 5. Clear input and stop typing indicator
   * 6. Scroll to bottom
   */
  const sendMessage = () => {
    // Validation: don't send empty messages
    // trim() removes whitespace from both ends
    if (message.trim() === '') return;

    if (channel.myMutedState === "muted") {
        alert("You are muted and cannot send messages.");
        return;
    }

    // Create message parameters object
    // This is Sendbird's required format for sending messages
    const params = new sb.UserMessageParams();
    params.message = message; // Set the message text

    // Send message through Sendbird SDK
    // Parameters: (params, callback)
    // Callback receives the sent message or error
    channel.sendUserMessage(params, (sentMessage, error) => {
      if (error) {
        // Log error if sending fails
        console.error('Error sending message:', error);
      } else {
        // Success: add message to local state immediately
        // This provides instant feedback (optimistic update)
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        
        // Clear the input field
        setMessage('');
        
        // Stop typing indicator
        handleTyping(false);
        
        // Auto-scroll to show the new message
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });
  };

  /**
   * handleFileUpload - Sends a file attachment to the channel
   * 
   * Flow:
   * 1. Get file from input event
   * 2. Validate file exists
   * 3. Create file message parameters
   * 4. Send to Sendbird
   * 5. Add to message list
   * 6. Reset file input
   * 7. Scroll to bottom
   * 
   * @param {Event} event - File input change event
   */
  const handleFileUpload = (event) => {
    // Extract first file from the file input
    // event.target.files is a FileList, we take index 0
    const file = event.target.files[0];
    
    // Validation: ensure file was selected
    if (!file) return;

    // Create file message parameters
    // This is Sendbird's format for file messages
    const params = new sb.FileMessageParams();
    params.file = file;              // The actual File object
    params.fileName = file.name;     // Original filename
    params.fileSize = file.size;     // File size in bytes
    params.mimeType = file.type;     // MIME type (e.g., "image/png")

    // Send file message through Sendbird
    channel.sendFileMessage(params, (sentMessage, error) => {
      if (error) {
        // Handle error
        console.error('Error sending file:', error);
        // Show user-friendly error message
        alert('Failed to send file. Please try again.');
      } else {
        // Success: add file message to chat
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        
        // Auto-scroll to show the new file message
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });

    // Reset file input value to allow selecting same file again
    // Without this, onChange won't fire if user selects same file twice
    event.target.value = '';
  };

  /**
   * handleEmojiClick - Inserts selected emoji into message input
   * 
   * @param {Object} emojiObject - Object containing emoji data
   * @param {string} emojiObject.emoji - The emoji character
   */
  const handleEmojiClick = (emojiObject) => {
    // Add emoji to end of current message
    // Use functional update to ensure we have latest value
    setMessage((prev) => prev + emojiObject.emoji);
    
    // Close emoji picker after selection
    setShowEmojiPicker(false);
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * formatMessageDate - Formats timestamp as relative date
   * 
   * Converts timestamp to user-friendly format:
   * - "Today" if message is from today
   * - "Yesterday" if from yesterday
   * - "Oct 28, 2025" for older dates
   * 
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted date string
   */
  const formatMessageDate = (timestamp) => {
    // Convert timestamp to Date object
    const date = new Date(timestamp);
    
    // Get today's date
    const today = new Date();
    
    // Calculate yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // Subtract 1 day

    // Compare dates (comparing date strings, not times)
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      // For older dates, format as "Oct 28, 2025"
      return date.toLocaleDateString('en-US', { 
        month: 'short',    // "Oct"
        day: 'numeric',    // "28"
        year: 'numeric'    // "2025"
      });
    }
  };

  /**
   * shouldShowDateSeparator - Determines if date separator is needed
   * 
   * Shows separator when date changes between consecutive messages
   * 
   * @param {Object} currentMsg - Current message object
   * @param {Object} prevMsg - Previous message object
   * @returns {boolean} true if separator should be shown
   */
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    // If no previous message, show separator (first message)
    if (!prevMsg) return true;
    
    // Get date strings (without time) for both messages
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    
    // Show separator if dates are different
    return currentDate !== prevDate;
  };

  /**
   * renderMessageContent - Renders appropriate content based on message type
   * 
   * Handles both text and file messages
   * For files: shows image preview or download link
   * For text: shows formatted text
   * 
   * @param {Object} msg - Message object from Sendbird
   * @returns {JSX.Element} Rendered message content
   */
  const renderMessageContent = (msg) => {
    // Check if this is a file message
    if (msg.messageType === 'file') {
      const fileUrl = msg.url;              // URL to access the file
      const fileName = msg.name || 'file';  // Filename with fallback
      
      // Check if file is an image
      // MIME type starting with "image/" indicates image file
      if (msg.type && msg.type.startsWith('image/')) {
        // Render image with preview
        return (
          <div>
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-w-full rounded-lg" 
            />
            {/* Show filename below image */}
            <p className="text-xs mt-1">{fileName}</p>
          </div>
        );
      } else {
        // Render download link for non-image files
        return (
          <a 
            href={fileUrl} 
            target="_blank"              // Open in new tab
            rel="noopener noreferrer"    // Security: prevent access to window.opener
            className="flex items-center gap-2 underline"
          >
            <Paperclip size={14} />
            {fileName}
          </a>
        );
      }
    }
    
    // For text messages, render the message text
    return (
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
        {msg.message}
      </p>
    );
  };

  // ==========================================
  // COMPONENT RENDER (JSX)
  // ==========================================
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white flex flex-col h-full">
      
      {/* ========== MESSAGE CONTAINER ========== */}
      {/* Scrollable area containing all messages */}
      <div 
        ref={messageContainerRef}    // Attach ref for scrolling control
        className="flex-1 overflow-y-auto p-6 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {/* Map over messages array to render each message */}
        {messages.map((msg, index) => {
          // Determine if date separator should show before this message
          const showDateSeparator = shouldShowDateSeparator(msg, messages[index - 1]);
          
          // Check if this message was sent by current user
          const isOwnMessage = msg.sender.userId === user.userId;
          
          // Determine if avatar should be shown
          // Show avatar if:
          // - Not own message (show other user's avatar)
          // - AND (it's last message OR next message is from different user)
          const showAvatar = !isOwnMessage && (
            index === messages.length - 1 || 
            messages[index + 1]?.sender.userId !== msg.sender.userId
          );
          
          return (
            <div key={msg.messageId}>
              {/* ========== DATE SEPARATOR ========== */}
              {/* Shows "Today", "Yesterday", or specific date */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="bg-gray-200 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
                    {formatMessageDate(msg.createdAt)}
                  </div>
                </div>
              )}
              
              {/* ========== MESSAGE ROW ========== */}
              {/* Own messages align right, others align left */}
              <div className={`flex items-end gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                
                {/* ========== LEFT AVATAR (Other User) ========== */}
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
                
                {/* ========== MESSAGE BUBBLE ========== */}
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  
                  {/* Sender name (only for other users, only when avatar shown) */}
                  {!isOwnMessage && showAvatar && (
                    <span className="text-xs font-medium text-gray-700 mb-1 px-1">
                      {msg.sender.nickname}
                    </span>
                  )}
                  
                  {/* Message bubble with content */}
                  <div className={`group relative rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${
                    isOwnMessage 
                      ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                  }`}>
                    {/* Render message content (text or file) */}
                    {renderMessageContent(msg)}
                    
                    {/* Timestamp and read receipt */}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {/* Format time as "2:30 PM" */}
                      <p className={`text-[11px] ${isOwnMessage ? 'text-teal-100' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {/* Show read receipt only for own messages */}
                      {isOwnMessage && <ReadReceipt message={msg} channel={channel} />}
                    </div>
                  </div>
                </div>
                
                {/* ========== RIGHT AVATAR (Own User) ========== */}
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

      {/* ========== TYPING INDICATOR ========== */}
      {/* Shows animated dots when someone is typing */}
      <div className="h-6 px-6 flex items-center">
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Animated dots */}
            <div className="flex gap-1">
              {/* Three dots with staggered animation */}
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            {/* Text showing who is typing */}
            <span className="text-sm text-gray-500">
              {/* Join multiple usernames with commas */}
              {typingUsers.map((user) => user.nickname).join(', ')}{' '}
              {/* Proper grammar: "is" for singular, "are" for plural */}
              {typingUsers.length === 1 ? 'is' : 'are'} typing
            </span>
          </div>
        )}
      </div>

      {/* ========== INPUT AREA ========== */}
      <div className="p-4 bg-white border-t border-gray-200 relative">
        
        {/* ========== EMOJI PICKER POPUP ========== */}
        {/* Positioned absolutely above the input */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}    // Ref for click-outside detection
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

        {/* ========== INPUT ROW ========== */}
        {/* Contains: file button, text input, emoji button, send button */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1 border border-gray-200 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
          
          {/* Hidden file input (triggered by button click) */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"           // Accept all file types
          />
          
          {/* ========== FILE ATTACHMENT BUTTON ========== */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gray-200 rounded-full h-9 w-9 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}  // Trigger file input
          >
            <Paperclip size={18} className="text-gray-500" />
          </Button>
          
          {/* ========== MESSAGE TEXT INPUT ========== */}
          <Input
            type="text"
            value={message}
            onChange={(e) => {
              // Update message state
              setMessage(e.target.value);
              
              // Clear existing typing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              // Start typing indicator
              handleTyping(true);
              
              // Set timeout to stop typing indicator after 3 seconds of inactivity
              typingTimeoutRef.current = setTimeout(() => {
                handleTyping(false);
              }, 3000);
            }}
            onKeyPress={(e) => {
              // Send message when Enter is pressed
              if (e.key === 'Enter') {
                sendMessage();
                
                // Clear typing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                
                // Stop typing indicator
                handleTyping(false);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          />
          
          {/* ========== EMOJI PICKER BUTTON ========== */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gray-200 rounded-full h-9 w-9 flex-shrink-0"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}  // Toggle visibility
          >
            <Smile size={18} className="text-gray-500" />
          </Button>
          
          {/* ========== SEND BUTTON ========== */}
          <Button 
            onClick={sendMessage}
            disabled={!message.trim()}    // Disabled if message is empty
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