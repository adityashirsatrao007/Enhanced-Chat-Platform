import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { useSocket } from "../contexts/SocketContext";

// Components
import ChatSidebar from "../components/Chat/ChatSidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import ChatWelcome from "../components/Chat/ChatWelcome";
import UserSearchModal from "../components/Chat/UserSearchModal";
import LoadingSpinner from "../components/UI/LoadingSpinner";

/**
 * Main Chat Page Component
 * Handles chat interface with sidebar and message window
 */
const ChatPage = () => {
  const { chatId } = useParams();
  const { chats, currentChat, loading, error, selectChat } = useChat();
  const { connected } = useSocket();

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Effect to handle chat selection from URL
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c._id === chatId);
      if (chat && (!currentChat || currentChat._id !== chatId)) {
        selectChat(chat);
      }
    }
  }, [chatId, chats, currentChat, selectChat]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load chats
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Sidebar */}
      <div
        className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <ChatSidebar
          onNewChat={() => setShowUserSearch(true)}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Connection Status */}
        {!connected && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-yellow-800">
                Reconnecting to chat server...
              </span>
            </div>
          </div>
        )}

        {/* Chat Content */}
        {currentChat ? (
          <ChatWindow onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        ) : (
          <ChatWelcome
            onNewChat={() => setShowUserSearch(true)}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
      />
    </div>
  );
};

export default ChatPage;
