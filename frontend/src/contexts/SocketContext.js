import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SocketContext = createContext({});

/**
 * Socket.IO Context Provider
 * Manages real-time WebSocket connections
 */
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(new Map());

  /**
   * Initialize socket connection
   */
  const initializeSocket = () => {
    if (!isAuthenticated || !user) return;

    // Dynamic URL configuration for development/production
    const isDevelopment = process.env.NODE_ENV === "development";
    const socketUrl = isDevelopment
      ? "http://localhost:5000" // Development server
      : window.location.origin; // Production (same domain)

    const newSocket = io(socketUrl, {
      transports: ["websocket"],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);

      // Authenticate with server
      newSocket.emit("authenticate", {
        userId: user.clerkId,
      });

      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on("authenticated", (data) => {
      console.log("✅ Socket authenticated:", data.message);
      toast.success("Connected to chat server");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setConnected(false);

      if (reason === "io server disconnect") {
        // Server disconnected, attempt manual reconnection
        scheduleReconnection(newSocket);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setConnected(false);
      toast.error("Failed to connect to chat server");
      scheduleReconnection(newSocket);
    });

    // Message event handlers
    newSocket.on("new-message", (data) => {
      // Handle new message - will be processed by ChatContext
      window.dispatchEvent(new CustomEvent("new-message", { detail: data }));
    });

    newSocket.on("message-updated", (data) => {
      window.dispatchEvent(
        new CustomEvent("message-updated", { detail: data })
      );
    });

    newSocket.on("message-deleted", (data) => {
      window.dispatchEvent(
        new CustomEvent("message-deleted", { detail: data })
      );
    });

    newSocket.on("reaction-added", (data) => {
      window.dispatchEvent(new CustomEvent("reaction-added", { detail: data }));
    });

    newSocket.on("reaction-removed", (data) => {
      window.dispatchEvent(
        new CustomEvent("reaction-removed", { detail: data })
      );
    });

    // Typing indicators
    newSocket.on("user-typing", (data) => {
      setTypingUsers((prev) => {
        const newTyping = new Map(prev);
        newTyping.set(`${data.chatId}-${data.userId}`, {
          userId: data.userId,
          chatId: data.chatId,
          timestamp: Date.now(),
        });
        return newTyping;
      });

      // Clear typing indicator after 3 seconds
      const key = `${data.chatId}-${data.userId}`;
      if (typingTimeoutRef.current.has(key)) {
        clearTimeout(typingTimeoutRef.current.get(key));
      }

      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const newTyping = new Map(prev);
          newTyping.delete(key);
          return newTyping;
        });
        typingTimeoutRef.current.delete(key);
      }, 3000);

      typingTimeoutRef.current.set(key, timeout);
    });

    newSocket.on("user-stopped-typing", (data) => {
      const key = `${data.chatId}-${data.userId}`;
      setTypingUsers((prev) => {
        const newTyping = new Map(prev);
        newTyping.delete(key);
        return newTyping;
      });

      if (typingTimeoutRef.current.has(key)) {
        clearTimeout(typingTimeoutRef.current.get(key));
        typingTimeoutRef.current.delete(key);
      }
    });

    // Online status updates
    newSocket.on("friend-status-change", (data) => {
      setOnlineUsers((prev) => {
        const newOnlineUsers = new Map(prev);
        if (data.isOnline) {
          newOnlineUsers.set(data.userId, {
            userId: data.userId,
            lastSeen: data.lastSeen,
          });
        } else {
          newOnlineUsers.delete(data.userId);
        }
        return newOnlineUsers;
      });
    });

    // Read receipts
    newSocket.on("messages-read", (data) => {
      window.dispatchEvent(new CustomEvent("messages-read", { detail: data }));
    });

    // Error handling
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(error.message || "Socket error occurred");
    });

    setSocket(newSocket);
    return newSocket;
  };

  /**
   * Schedule reconnection attempt
   */
  const scheduleReconnection = (socketInstance) => {
    if (reconnectTimeoutRef.current) return;

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("🔄 Attempting to reconnect...");
      if (socketInstance && !socketInstance.connected) {
        socketInstance.connect();
      }
      reconnectTimeoutRef.current = null;
    }, 3000);
  };

  /**
   * Join a chat room
   */
  const joinChat = (chatId) => {
    if (socket && connected) {
      socket.emit("join-chat", { chatId });
    }
  };

  /**
   * Leave a chat room
   */
  const leaveChat = (chatId) => {
    if (socket && connected) {
      socket.emit("leave-chat", { chatId });
    }
  };

  /**
   * Send a message
   */
  const sendMessage = (chatId, content, replyTo = null) => {
    if (socket && connected) {
      socket.emit("send-message", {
        chatId,
        content,
        replyTo,
      });
    }
  };

  /**
   * Send typing indicator
   */
  const sendTyping = (chatId, isTyping) => {
    if (socket && connected) {
      if (isTyping) {
        socket.emit("typing-start", { chatId });
      } else {
        socket.emit("typing-stop", { chatId });
      }
    }
  };

  /**
   * Add reaction to message
   */
  const addReaction = (messageId, emoji) => {
    if (socket && connected) {
      socket.emit("add-reaction", { messageId, emoji });
    }
  };

  /**
   * Mark messages as read
   */
  const markMessagesRead = (chatId) => {
    if (socket && connected) {
      socket.emit("mark-read", { chatId });
    }
  };

  /**
   * Check if user is typing in chat
   */
  const isUserTyping = (chatId, userId) => {
    const key = `${chatId}-${userId}`;
    return typingUsers.has(key);
  };

  /**
   * Get typing users for a chat
   */
  const getTypingUsers = (chatId) => {
    const typingInChat = [];
    for (const [key, data] of typingUsers) {
      if (data.chatId === chatId && data.userId !== user?.id) {
        typingInChat.push(data.userId);
      }
    }
    return typingInChat;
  };

  /**
   * Check if user is online
   */
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const socketInstance = initializeSocket();

      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    }
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Clear all typing timeouts
      for (const timeout of typingTimeoutRef.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const contextValue = {
    socket,
    connected,
    onlineUsers,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    addReaction,
    markMessagesRead,
    isUserTyping,
    getTypingUsers,
    isUserOnline,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook to use socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export default SocketContext;
