
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ LOAD USER FROM ASYNC STORAGE
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('user');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ SAVE USER TO ASYNC STORAGE
  const saveUser = useCallback(async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw error;
    }
  }, []);

  // ✅ UPDATE USER DATA
  const updateUser = useCallback(async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }, [user]);

  // ✅ LOGOUT USER
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Error logging out:', error);
      throw error;
    }
  }, []);

  // ✅ GET USER ID
  const getUserId = useCallback(() => {
    return user?.id || null;
  }, [user]);

  // ✅ UPDATE SAVED ARTICLES COUNT
  const updateSavedArticlesCount = useCallback(async (count) => {
    try {
      const updatedUser = await updateUser({ savedArticles: count });
      return updatedUser;
    } catch (error) {
      console.error('❌ Error updating saved articles count:', error);
    }
  }, [updateUser]);

  // ✅ LOAD USER ON MOUNT
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const value = {
    // User state
    user,
    isLoading,
    isAuthenticated,
    
    // User actions
    loadUser,
    saveUser,
    updateUser,
    logout,
    getUserId,
    updateSavedArticlesCount,
    
    // Helper getters
    userId: user?.id || null,
    userName: user?.name || '',
    userEmail: user?.email || '',
    userAvatar: user?.avatar || 'https://cdn-icons-png.flaticon.com/512/9131/9131529.png',
    savedArticlesCount: user?.savedArticles || 0,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
