import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '@clerk/clerk-react';
import { userAPI, chatAPI, setAuthToken } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * User Search Modal Component
 * Modal for searching and adding users to start new conversations
 */
const UserSearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);
  
  const { fetchChats } = useChat();
  const { getToken } = useAuth();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        if (token) {
          // Set the auth token for API calls
          setAuthToken(token);
          
          const results = await userAPI.searchUsers(query);
          setSearchResults(results.data || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 300),
    [getToken, userAPI]
  );

  // Effect for search
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleUserSelect = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setCreatingChat(true);
    try {
      const token = await getToken();
      if (token) {
        // Set the auth token for API calls
        setAuthToken(token);
        
        const participants = selectedUsers.map(user => user._id);
        
        // Create individual chats for each selected user
        const chatPromises = participants.map(participantId =>
          chatAPI.createChat({ participants: [participantId], isGroup: false })
        );

        await Promise.all(chatPromises);
      }
      
      toast.success(`${selectedUsers.length > 1 ? 'Chats' : 'Chat'} created successfully!`);
      
      // Refresh chats list
      await fetchChats();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error('Failed to create chat');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleCreateGroupChat = async () => {
    if (selectedUsers.length < 2) {
      toast.error('Group chat requires at least 2 users');
      return;
    }

    setCreatingChat(true);
    try {
      const token = await getToken();
      if (token) {
        // Set the auth token for API calls
        const { setAuthToken } = await import('../../services/api');
        setAuthToken(token);
        
        const participants = selectedUsers.map(user => user._id);
        
        await chatAPI.createChat({ 
          participants, 
          isGroup: true,
          name: `Group with ${selectedUsers.map(u => u.name).join(', ')}`
        });
      }
      
      toast.success('Group chat created successfully!');
      
      // Refresh chats list
      await fetchChats();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Create group chat error:', error);
      toast.error('Failed to create group chat');
    } finally {
      setCreatingChat(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Start New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{user.name}</span>
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="ml-2 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => {
                const isSelected = selectedUsers.find(u => u._id === user._id);
                return (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {isSelected && (
                      <CheckIcon className="h-5 w-5 text-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : searchQuery && !loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <UserPlusIcon className="h-12 w-12 mb-4" />
              <p>No users found</p>
              <p className="text-sm">Try searching with a different term</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <MagnifyingGlassIcon className="h-12 w-12 mb-4" />
              <p>Search for users to start chatting</p>
              <p className="text-sm">Enter a name or email to find users</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={handleCreateChat}
                disabled={creatingChat}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingChat ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  `Start Chat${selectedUsers.length > 1 ? 's' : ''}`
                )}
              </button>
              
              {selectedUsers.length > 1 && (
                <button
                  onClick={handleCreateGroupChat}
                  disabled={creatingChat}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Debounce utility function
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

export default UserSearchModal;
