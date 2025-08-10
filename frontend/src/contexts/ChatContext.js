import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { chatAPI, messageAPI } from '../services/api';
import toast from 'react-hot-toast';

const ChatContext = createContext({});

/**
 * Chat Context Provider
 * Manages chat state, messages, and real-time updates
 */
export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, connected, joinChat, leaveChat } = useSocket();
  
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Load all chats for the current user
   */
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatAPI.getChats();
      
      if (response.success) {
        setChats(response.data.chats || []);
      } else {
        throw new Error(response.message || 'Failed to load chats');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setError(error.message);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load messages for a specific chat
   */
  const loadMessages = useCallback(async (chatId, page = 1, append = false) => {
    try {
      setMessageLoading(true);
      
      const response = await messageAPI.getMessages(chatId, page);
      
      if (response.success) {
        const newMessages = response.data.messages || [];
        
        setMessages(prev => {
          const chatMessages = prev[chatId] || [];
          if (append) {
            // Append older messages (for pagination)
            return {
              ...prev,
              [chatId]: [...newMessages, ...chatMessages]
            };
          } else {
            // Replace messages (for initial load)
            return {
              ...prev,
              [chatId]: newMessages
            };
          }
        });
        
        setHasMoreMessages(response.data.pagination?.hasMore || false);
        setCurrentPage(page);
      } else {
        throw new Error(response.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setMessageLoading(false);
    }
  }, []);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async (chatId) => {
    if (!hasMoreMessages || messageLoading) return;
    
    await loadMessages(chatId, currentPage + 1, true);
  }, [hasMoreMessages, messageLoading, currentPage, loadMessages]);

  /**
   * Create a new chat
   */
  const createChat = useCallback(async (chatData) => {
    try {
      setLoading(true);
      
      const response = await chatAPI.createChat(chatData);
      
      if (response.success) {
        const newChat = response.data.chat;
        setChats(prev => [newChat, ...prev]);
        
        // Join the new chat
        if (connected) {
          joinChat(newChat._id);
        }
        
        toast.success('Chat created successfully');
        return newChat;
      } else {
        throw new Error(response.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error(error.message || 'Failed to create chat');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, joinChat]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (chatId, content, replyTo = null) => {
    try {
      const response = await messageAPI.sendMessage(chatId, content, replyTo);
      
      if (response.success) {
        const newMessage = response.data.message;
        
        // Update local messages state
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), newMessage]
        }));
        
        // Update chat's last activity
        setChats(prev => prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, lastActivity: new Date(), lastMessage: newMessage }
            : chat
        ));
        
        return newMessage;
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      throw error;
    }
  }, []);

  /**
   * Edit a message
   */
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const response = await messageAPI.editMessage(messageId, newContent);
      
      if (response.success) {
        const updatedMessage = response.data.message;
        
        // Update message in local state
        setMessages(prev => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach(chatId => {
            newMessages[chatId] = newMessages[chatId].map(msg =>
              msg._id === messageId ? updatedMessage : msg
            );
          });
          return newMessages;
        });
        
        toast.success('Message updated');
        return updatedMessage;
      } else {
        throw new Error(response.message || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error(error.message || 'Failed to edit message');
      throw error;
    }
  }, []);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(async (messageId, chatId) => {
    try {
      const response = await messageAPI.deleteMessage(messageId);
      
      if (response.success) {
        // Update message in local state to show as deleted
        setMessages(prev => ({
          ...prev,
          [chatId]: prev[chatId]?.map(msg =>
            msg._id === messageId 
              ? { ...msg, isDeleted: true, content: { ...msg.content, text: '[Message deleted]' } }
              : msg
          ) || []
        }));
        
        toast.success('Message deleted');
      } else {
        throw new Error(response.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error.message || 'Failed to delete message');
      throw error;
    }
  }, []);

  /**
   * Add reaction to message
   */
  const addReaction = useCallback(async (messageId, emoji) => {
    try {
      const response = await messageAPI.addReaction(messageId, emoji);
      
      if (response.success) {
        // Update message reactions in local state
        setMessages(prev => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach(chatId => {
            newMessages[chatId] = newMessages[chatId].map(msg => {
              if (msg._id === messageId) {
                const existingReaction = msg.reactions?.find(r => 
                  r.user === user.id && r.emoji === emoji
                );
                
                if (existingReaction) {
                  // Remove existing reaction
                  return {
                    ...msg,
                    reactions: msg.reactions.filter(r => 
                      !(r.user === user.id && r.emoji === emoji)
                    )
                  };
                } else {
                  // Add new reaction
                  return {
                    ...msg,
                    reactions: [
                      ...(msg.reactions || []),
                      { user: user.id, emoji, createdAt: new Date() }
                    ]
                  };
                }
              }
              return msg;
            });
          });
          return newMessages;
        });
      } else {
        throw new Error(response.message || 'Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error(error.message || 'Failed to add reaction');
    }
  }, [user]);

  /**
   * Select a chat and load its messages
   */
  const selectChat = useCallback(async (chat) => {
    if (currentChat && currentChat._id !== chat._id) {
      leaveChat(currentChat._id);
    }
    
    setCurrentChat(chat);
    setCurrentPage(1);
    setHasMoreMessages(true);
    
    // Join the chat room
    if (connected) {
      joinChat(chat._id);
    }
    
    // Load messages if not already loaded
    if (!messages[chat._id]) {
      await loadMessages(chat._id);
    }
  }, [currentChat, connected, joinChat, leaveChat, messages, loadMessages]);

  /**
   * Get unread message count for a chat
   */
  const getUnreadCount = useCallback((chat) => {
    if (!user || !chat.participants) return 0;
    
    const userParticipant = chat.participants.find(p => p.user._id === user.id);
    if (!userParticipant) return 0;
    
    const chatMessages = messages[chat._id] || [];
    const lastRead = new Date(userParticipant.lastRead);
    
    return chatMessages.filter(msg => 
      new Date(msg.createdAt) > lastRead && msg.sender._id !== user.id
    ).length;
  }, [user, messages]);

  // Real-time event handlers
  useEffect(() => {
    const handleNewMessage = (event) => {
      const { message, chatId } = event.detail;
      
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message]
      }));
      
      // Update chat order and last message
      setChats(prev => {
        const updatedChats = prev.map(chat =>
          chat._id === chatId
            ? { ...chat, lastActivity: new Date(), lastMessage: message }
            : chat
        );
        
        // Sort by last activity
        return updatedChats.sort((a, b) => 
          new Date(b.lastActivity) - new Date(a.lastActivity)
        );
      });
    };

    const handleMessageUpdated = (event) => {
      const { message, chatId } = event.detail;
      
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.map(msg =>
          msg._id === message._id ? message : msg
        ) || []
      }));
    };

    const handleMessageDeleted = (event) => {
      const { messageId, chatId } = event.detail;
      
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.filter(msg => msg._id !== messageId) || []
      }));
    };

    const handleReactionAdded = (event) => {
      const { messageId, userId, emoji } = event.detail;
      
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId].map(msg => {
            if (msg._id === messageId) {
              return {
                ...msg,
                reactions: [
                  ...(msg.reactions || []),
                  { user: userId, emoji, createdAt: new Date() }
                ]
              };
            }
            return msg;
          });
        });
        return newMessages;
      });
    };

    // Add event listeners
    window.addEventListener('new-message', handleNewMessage);
    window.addEventListener('message-updated', handleMessageUpdated);
    window.addEventListener('message-deleted', handleMessageDeleted);
    window.addEventListener('reaction-added', handleReactionAdded);

    return () => {
      window.removeEventListener('new-message', handleNewMessage);
      window.removeEventListener('message-updated', handleMessageUpdated);
      window.removeEventListener('message-deleted', handleMessageDeleted);
      window.removeEventListener('reaction-added', handleReactionAdded);
    };
  }, []);

  // Load chats when component mounts
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  const contextValue = {
    chats,
    currentChat,
    messages: messages[currentChat?._id] || [],
    loading,
    error,
    messageLoading,
    hasMoreMessages,
    loadChats,
    loadMessages,
    loadMoreMessages,
    createChat,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    selectChat,
    getUnreadCount
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Hook to use chat context
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export default ChatContext;
