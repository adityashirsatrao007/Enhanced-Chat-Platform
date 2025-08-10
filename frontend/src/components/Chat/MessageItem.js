import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";

/**
 * Message Item Component
 * Individual message with reactions, editing, and actions
 */
const MessageItem = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  isGrouped = false,
}) => {
  const { editMessage, deleteMessage, addReaction } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content?.text || "");

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleEdit = async () => {
    if (editText.trim() && editText !== message.content.text) {
      try {
        await editMessage(message._id, editText.trim());
        setIsEditing(false);
      } catch (error) {
        console.error("Error editing message:", error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(message._id, message.chat);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const handleReaction = async (emoji) => {
    try {
      await addReaction(message._id, emoji);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 border border-gray-200">
          <p className="text-gray-500 italic text-sm">
            This message was deleted
          </p>
          {showTimestamp && (
            <p className="text-xs text-gray-400 mt-1">
              {formatTime(message.createdAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-end space-x-2 ${
        isOwn ? "flex-row-reverse space-x-reverse" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {message.sender.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Spacer for grouped messages */}
      {!showAvatar && !isOwn && <div className="w-8 flex-shrink-0" />}

      {/* Message content */}
      <div
        className={`flex flex-col ${
          isOwn ? "items-end" : "items-start"
        } max-w-xs lg:max-w-md`}
      >
        {/* Sender name (for group chats) */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.sender.firstName || message.sender.username}
          </span>
        )}

        {/* Message bubble */}
        <div className={`relative group/message ${isGrouped ? "mt-1" : ""}`}>
          {/* Reply indicator */}
          {message.replyTo && (
            <div className="mb-2 px-3 py-2 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg">
              <p className="text-xs text-gray-500">
                Replying to {message.replyTo.sender?.username}
              </p>
              <p className="text-sm text-gray-700 truncate">
                {message.replyTo.content?.text}
              </p>
            </div>
          )}

          {/* Message content */}
          <div
            className={`
            message-bubble relative
            ${isOwn ? "sent" : "received"}
            ${isGrouped ? "rounded-lg" : ""}
          `}
          >
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm"
                  rows={1}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEdit();
                    }
                  }}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(message.content.text);
                    }}
                    className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content.text}
                </p>

                {/* Edit indicator */}
                {message.isEdited && (
                  <span className="text-xs opacity-70 ml-2">(edited)</span>
                )}
              </>
            )}
          </div>

          {/* Message actions */}
          {showActions && !isEditing && (
            <div
              className={`
              absolute top-0 flex items-center space-x-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200
              ${isOwn ? "-left-20" : "-right-20"}
            `}
            >
              {/* Quick reactions */}
              <button
                onClick={() => handleReaction("👍")}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="React"
              >
                <FaceSmileIcon className="w-4 h-4" />
              </button>

              {/* Reply */}
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Reply"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
              </button>

              {/* Edit (own messages only) */}
              {isOwn && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}

              {/* More actions */}
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="More"
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
              </button>

              {/* Delete (own messages only) */}
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors duration-200"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <span
            className={`text-xs text-gray-400 mt-1 ${
              isOwn ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
