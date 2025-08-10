import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useSocket } from "../../contexts/SocketContext";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../UI/LoadingSpinner";

/**
 * Chat Sidebar Component
 * Displays list of chats with search functionality
 */
const ChatSidebar = ({ onNewChat, onCloseSidebar }) => {
  const { chats, currentChat, selectChat, loading, getUnreadCount } = useChat();
  const { isUserOnline } = useSocket();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);

  // Filter chats based on search term
  React.useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) => {
        const chatName =
          chat.name ||
          (chat.type === "direct" && chat.participants?.length > 0
            ? chat.participants.find((p) => p.user.username)?.user.username ||
              "Unknown"
            : "Group Chat");

        return chatName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredChats(filtered);
    }
  }, [chats, searchTerm]);

  const handleChatSelect = async (chat) => {
    await selectChat(chat);
    onCloseSidebar();
  };

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getLastMessage = (chat) => {
    if (!chat.lastMessage) return "No messages yet";

    const message = chat.lastMessage;
    if (typeof message === "string") return "New message";

    if (message.isDeleted) return "Message deleted";
    if (message.content?.type === "image") return "📷 Image";
    if (message.content?.type === "file") return "📎 File";

    return message.content?.text || "Message";
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewChat}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="New Chat"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onCloseSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200 lg:hidden"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8 px-4">
            {searchTerm ? (
              <div>
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No chats found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div>
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No chats yet</p>
                <button
                  onClick={onNewChat}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  Start your first conversation
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            {filteredChats.map((chat) => {
              const isSelected = currentChat?._id === chat._id;
              const unreadCount = getUnreadCount(chat);

              // Get other participant for direct chats
              const otherParticipant =
                chat.type === "direct" && chat.participants?.length > 0
                  ? chat.participants.find((p) => p.user._id !== chat.creator)
                      ?.user
                  : null;

              const chatName =
                chat.name ||
                (otherParticipant
                  ? otherParticipant.fullName || otherParticipant.username
                  : "Unknown User");

              const chatAvatar = chat.avatar || otherParticipant?.avatar;
              const isOnline = otherParticipant
                ? isUserOnline(otherParticipant._id)
                : false;

              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`
                    w-full p-3 text-left hover:bg-gray-50 transition-colors duration-200 border-r-2
                    ${
                      isSelected
                        ? "bg-blue-50 border-blue-500"
                        : "border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {chatAvatar ? (
                          <img
                            src={chatAvatar}
                            alt={chatName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {chatName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Online indicator for direct chats */}
                      {chat.type === "direct" && otherParticipant && (
                        <div
                          className={`
                          absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                          ${isOnline ? "bg-green-400" : "bg-gray-400"}
                        `}
                        ></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`
                          text-sm font-medium truncate
                          ${isSelected ? "text-blue-900" : "text-gray-900"}
                        `}
                        >
                          {chatName}
                        </p>
                        <span
                          className={`
                          text-xs
                          ${isSelected ? "text-blue-700" : "text-gray-500"}
                        `}
                        >
                          {formatLastActivity(chat.lastActivity)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`
                          text-sm truncate
                          ${
                            unreadCount > 0
                              ? "text-gray-900 font-medium"
                              : isSelected
                              ? "text-blue-700"
                              : "text-gray-500"
                          }
                        `}
                        >
                          {getLastMessage(chat)}
                        </p>

                        {/* Unread count */}
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
