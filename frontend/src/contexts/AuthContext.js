import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

/**
 * Authentication Context Provider
 * Manages user authentication state and profile synchronization
 */
export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Sync user data from Clerk to our database
   */
  const syncUserData = async (clerkUserData) => {
    try {
      setLoading(true);
      setError(null);

      const userData = {
        email: clerkUserData.emailAddresses[0]?.emailAddress || '',
        username: clerkUserData.username || 
                 clerkUserData.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                 'user',
        firstName: clerkUserData.firstName || 'User',
        lastName: clerkUserData.lastName || '',
        avatar: clerkUserData.imageUrl || '',
        bio: clerkUserData.publicMetadata?.bio || ''
      };

      const response = await authAPI.syncUser(userData);
      
      if (response.success) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.message || 'Failed to sync user data');
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      setError(error.message);
      toast.error('Failed to sync user profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user profile
   */
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      
      if (response.success) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.message || 'Failed to get user profile');
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(updates);
      
      if (response.success) {
        setUser(prevUser => ({
          ...prevUser,
          ...response.data.user
        }));
        toast.success('Profile updated successfully');
        return response.data.user;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user online status
   */
  const updateStatus = async (isOnline) => {
    try {
      const response = await authAPI.updateStatus(isOnline);
      
      if (response.success && user) {
        setUser(prevUser => ({
          ...prevUser,
          isOnline: response.data.isOnline,
          lastSeen: response.data.lastSeen
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Don't show toast for status updates as they're frequent
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setUser(null);
    setError(null);
  };

  // Effect to handle Clerk authentication state changes
  useEffect(() => {
    const handleAuthChange = async () => {
      if (!isLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          // Try to get existing profile first
          const existingUser = await getCurrentUser();
          
          if (!existingUser) {
            // If no profile exists, sync from Clerk
            await syncUserData(clerkUser);
          }
        } catch (error) {
          // If getting profile fails, try to sync from Clerk
          try {
            await syncUserData(clerkUser);
          } catch (syncError) {
            console.error('Failed to sync user after profile fetch error:', syncError);
          }
        }
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    };

    handleAuthChange();
  }, [isLoaded, isSignedIn, clerkUser]);

  // Update online status when user becomes active/inactive
  useEffect(() => {
    if (!user || !isSignedIn) return;

    // Set user as online when component mounts
    updateStatus(true);

    // Handle visibility change
    const handleVisibilityChange = () => {
      updateStatus(!document.hidden);
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      updateStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Set user as offline when component unmounts
      updateStatus(false);
    };
  }, [user, isSignedIn]);

  const contextValue = {
    user,
    clerkUser,
    loading,
    error,
    isAuthenticated: isSignedIn && !!user,
    syncUserData,
    getCurrentUser,
    updateProfile,
    updateStatus,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
