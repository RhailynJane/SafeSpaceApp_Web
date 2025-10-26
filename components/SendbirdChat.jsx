"use client";

import { useState, useEffect, useRef } from 'react';
import { useSendbird } from '../hooks/useSendbird';

const SendbirdChat = ({ channelUrl }) => {
  const { sb, user } = useSendbird();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (sb && channelUrl) {
      sb.GroupChannel.getChannel(channelUrl).then((channel) => {
        setChannel(channel);
      });
    }
  }, [sb, channelUrl]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.messageId} className={`flex ${msg.sender.userId === user.userId ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`rounded-lg px-4 py-2 ${msg.sender.userId === user.userId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded-l-lg px-4 py-2"
          />
          <button onClick={sendMessage} className="bg-blue-500 text-white rounded-r-lg px-4 py-2">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendbirdChat;