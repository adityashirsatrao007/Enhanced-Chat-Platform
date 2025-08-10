import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Bars3Icon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import LoadingSpinner from "../UI/LoadingSpinner";

/**
 * Chat Window Component
 * Main chat interface with messages and input
 */
const ChatWindow = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { currentChat, messages, sendMessage, messageLoading } = useChat();
  const { sendTyping, getTypingUsers, markMessagesRead } = useSocket();

  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when chat changes
  useEffect(() => {
    if (currentChat) {
      markMessagesRead(currentChat._id);
    }
  }, [currentChat, markMessagesRead]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);

    if (!currentChat) return;

    // Send typing start if not already typing
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(currentChat._id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(currentChat._id, false);
      }
    }, 1000);

    // Stop typing immediately if input is empty
    if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTyping(currentChat._id, false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !currentChat) return;

    const messageContent = {
      text: messageText.trim(),
      type: "text",
    };

    try {
      await sendMessage(currentChat._id, messageContent);
      setMessageText("");

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        sendTyping(currentChat._id, false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!currentChat) {
    return null;
  }

  // Get chat display info
  const isDirectChat = currentChat.type === "direct";
  const otherParticipant =
    isDirectChat && currentChat.participants?.length > 0
      ? currentChat.participants.find((p) => p.user._id !== user?.id)?.user
      : null;

  const chatName =
    currentChat.name ||
    (otherParticipant
      ? otherParticipant.fullName || otherParticipant.username
      : "Unknown User");

  const chatAvatar = currentChat.avatar || otherParticipant?.avatar;

  // Get typing users
  const typingUsers = getTypingUsers(currentChat._id);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Chat avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {chatAvatar ? (
                <img
                  src={chatAvatar}
                  alt={chatName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {chatName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Chat info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {chatName}
            </h2>
            <p className="text-sm text-gray-500">
              {isDirectChat
                ? otherParticipant?.isOnline
                  ? "Online"
                  : "Offline"
                : `${currentChat.participants?.length || 0} members`}
            </p>
          </div>
        </div>

        {/* Chat menu */}
        <div className="relative">
          <button
            onClick={() => setShowChatMenu(!showChatMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>

          {/* Dropdown menu */}
          {showChatMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                View Profile
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Chat Settings
              </button>
              <hr className="my-2" />
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messageLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <MessageList messages={messages} />

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator userIds={typingUsers} />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          {/* Attachment button */}
          <button
            type="button"
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
          </div>

          {/* Emoji button */}
          <button
            type="button"
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200"
            title="Add emoji"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!messageText.trim()}
            className={`
              flex-shrink-0 p-2 rounded-lg transition-colors duration-200
              ${
                messageText.trim()
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  : "text-gray-300 cursor-not-allowed"
              }
            `}
            title="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Click outside to close menu */}
      {showChatMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowChatMenu(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
