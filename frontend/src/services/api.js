import axios from "axios";

// Dynamic API URL configuration like Thinkboard
const BASE_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request deduplication cache
const pendingRequests = new Map();

// Request interceptor to prevent duplicate requests
api.interceptors.request.use(
  (config) => {
    // Create a unique key for this request
    const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
    
    // If this request is already pending, return the existing promise
    if (pendingRequests.has(requestKey)) {
      console.log("Preventing duplicate request:", requestKey);
      return Promise.reject(new Error("Duplicate request prevented"));
    }
    
    // Store this request
    pendingRequests.set(requestKey, true);
    
    // Clean up when request completes
    config.requestKey = requestKey;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to set auth token (to be called from components)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Function to retry requests with exponential backoff
const retryRequest = async (originalRequest, retryCount = 0) => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  if (retryCount >= maxRetries) {
    throw new Error("Maximum retry attempts exceeded");
  }
  
  const delay = baseDelay * Math.pow(2, retryCount);
  console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  return api.request(originalRequest);
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Clean up pending request
    if (response.config?.requestKey) {
      pendingRequests.delete(response.config.requestKey);
    }
    return response.data;
  },
  async (error) => {
    // Clean up pending request
    if (error.config?.requestKey) {
      pendingRequests.delete(error.config.requestKey);
    }
    
    console.error("API Error:", error);

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const errorMessage = error.response.data?.message || "An error occurred";
      
      // Handle specific error types
      if (status === 429) {
        console.warn("Rate limit exceeded, implementing retry with backoff...");
        
        // Retry the request with exponential backoff
        try {
          const retryCount = error.config?.retryCount || 0;
          error.config.retryCount = retryCount;
          
          if (retryCount < 3) {
            return await retryRequest(error.config, retryCount);
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
        
        return Promise.reject(new Error("Too many requests. Please wait a moment and try again."));
      }
      
      if (status === 401) {
        console.warn("Unauthorized request");
        return Promise.reject(new Error("Authentication required"));
      }
      
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(
        new Error("Network error - please check your connection")
      );
    } else {
      // Something else happened
      return Promise.reject(
        new Error(error.message || "An unexpected error occurred")
      );
    }
  }
);

/**
 * Authentication API endpoints
 */
export const authAPI = {
  // Sync user data from Clerk
  syncUser: (userData) => api.post("/auth/sync", userData),

  // Get current user profile
  getProfile: () => api.get("/auth/profile"),

  // Update user profile
  updateProfile: (updates) => api.put("/auth/profile", updates),

  // Update user online status
  updateStatus: (isOnline) => api.post("/auth/status", { isOnline }),
};

/**
 * User management API endpoints
 */
export const userAPI = {
  // Search for users
  searchUsers: (query, limit = 20) =>
    api.get("/users/search", { params: { q: query, limit } }),

  // Get user by ID
  getUserById: (userId) => api.get(`/users/${userId}`),

  // Friend management
  addFriend: (userId) => api.post(`/users/${userId}/friend`),
  removeFriend: (userId) => api.delete(`/users/${userId}/friend`),
  getFriends: () => api.get("/users/friends"),

  // Block management
  blockUser: (userId) => api.post(`/users/${userId}/block`),
  unblockUser: (userId) => api.delete(`/users/${userId}/block`),
};

/**
 * Chat management API endpoints
 */
export const chatAPI = {
  // Get all chats
  getChats: () => api.get("/chats"),

  // Create new chat
  createChat: (chatData) => api.post("/chats", chatData),

  // Get specific chat
  getChat: (chatId) => api.get(`/chats/${chatId}`),

  // Update chat details
  updateChat: (chatId, updates) => api.put(`/chats/${chatId}`, updates),

  // Participant management
  addParticipants: (chatId, participantIds) =>
    api.post(`/chats/${chatId}/participants`, { participantIds }),
  removeParticipant: (chatId, participantId) =>
    api.delete(`/chats/${chatId}/participants/${participantId}`),
};

/**
 * Message API endpoints
 */
export const messageAPI = {
  // Get messages for a chat
  getMessages: (chatId, page = 1, limit = 50) =>
    api.get(`/messages/${chatId}`, { params: { page, limit } }),

  // Send a message
  sendMessage: (chatId, content, replyTo = null) =>
    api.post(`/messages/${chatId}`, { content, replyTo }),

  // Edit a message
  editMessage: (messageId, content) =>
    api.put(`/messages/${messageId}`, { content }),

  // Delete a message
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),

  // Reaction management
  addReaction: (messageId, emoji) =>
    api.post(`/messages/${messageId}/react`, { emoji }),
  removeReaction: (messageId, emoji) =>
    api.delete(`/messages/${messageId}/react`, { data: { emoji } }),

  // Mark message as read
  markAsRead: (messageId) => api.post(`/messages/${messageId}/read`),
};

/**
 * Utility functions
 */
export const apiUtils = {
  // Check API health
  healthCheck: () => api.get("/health"),

  // Handle file uploads (for future use)
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
};

export default api;
