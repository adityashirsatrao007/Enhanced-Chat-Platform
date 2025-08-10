import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MessageItem from './MessageItem';

/**
 * Message List Component
 * Displays list of messages with virtual scrolling for performance
 */
const MessageList = ({ messages = [] }) => {
  const { user } = useAuth();
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">No messages yet</p>
          <p className="text-gray-400 text-sm">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
    >
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
        
        // Group messages by same sender within 5 minutes
        const isSameSender = prevMessage && 
          prevMessage.sender._id === message.sender._id &&
          new Date(message.createdAt) - new Date(prevMessage.createdAt) < 5 * 60 * 1000;

        const isLastInGroup = !nextMessage || 
          nextMessage.sender._id !== message.sender._id ||
          new Date(nextMessage.createdAt) - new Date(message.createdAt) > 5 * 60 * 1000;

        const isOwn = message.sender._id === user?.id;

        return (
          <MessageItem
            key={message._id}
            message={message}
            isOwn={isOwn}
            showAvatar={!isSameSender}
            showTimestamp={isLastInGroup}
            isGrouped={isSameSender}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
