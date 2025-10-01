// components/SearchBar.js
import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  Modal,
  Pressable,
  Keyboard,
} from 'react-native';
import { Search, X, Clock, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { moderateScale, scale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const RECENT_SEARCHES_KEY = '@recent_searches';
const TRENDING_SEARCHES = [
  'Chính trị', 'Kinh tế', 'Thể thao', 'Công nghệ', 
  'Giải trí', 'Sức khỏe', 'Giáo dục', 'Văn hóa'
];

export default function SearchBar({ 
  placeholder = "Tìm kiếm tin tức...",
  style,
  onPress,
  showModal = true,
  autoFocus = true
}) {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches
  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('❌ Error loading recent searches:', error);
    }
  }, []);

  // Save search to recent
  const saveToRecentSearches = useCallback(async (query) => {
    if (!query || query.trim().length < 2) return;
    
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let recent = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      recent = recent.filter(item => item.toLowerCase() !== query.toLowerCase());
      
      // Add to beginning
      recent.unshift(query.trim());
      
      // Limit array size
      recent = recent.slice(0, 10);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
      setRecentSearches(recent);
    } catch (error) {
      console.error('❌ Error saving recent search:', error);
    }
  }, []);

  // Handle search bar press
  const handleSearchBarPress = useCallback(() => {
    if (onPress) {
      onPress();
    } else if (showModal) {
      setModalVisible(true);
      loadRecentSearches();
    } else {
      navigation.navigate('Search');
    }
  }, [onPress, showModal, navigation, loadRecentSearches]);

  // Handle search submit
  const handleSearchSubmit = useCallback((query = searchQuery) => {
    if (!query || query.trim().length < 2) return;
    
    const trimmedQuery = query.trim();
    saveToRecentSearches(trimmedQuery);
    setModalVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
    
    // Navigate to search results
    navigation.navigate('SearchResult', {
      query: trimmedQuery,
      type: 'general',
      filter: 'all'
    });
  }, [searchQuery, navigation, saveToRecentSearches]);

  // Handle suggestion tap
  const handleSuggestionTap = useCallback((suggestion) => {
    handleSearchSubmit(suggestion);
  }, [handleSearchSubmit]);

  // Clear recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('❌ Error clearing recent searches:', error);
    }
  }, []);

  // Remove single recent search
  const removeRecentSearch = useCallback(async (searchToRemove) => {
    try {
      const updatedSearches = recentSearches.filter(search => search !== searchToRemove);
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('❌ Error removing recent search:', error);
    }
  }, [recentSearches]);

  // Render recent search item
  const renderRecentSearch = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSuggestionTap(item)}
      className="py-3 px-4 flex-row items-center justify-between border-b border-gray-50"
    >
      <View className="flex-row items-center flex-1">
        <Clock size={16} color="#9CA3AF" className="mr-3" />
        <Text className="text-gray-700 font-sf-regular text-base">
          {item}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeRecentSearch(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleSuggestionTap, removeRecentSearch]);

  // Render trending search item
  const renderTrendingSearch = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSuggestionTap(item)}
      className="py-3 px-4 flex-row items-center border-b border-gray-50"
    >
      <TrendingUp size={16} color="#EF4444" className="mr-3" />
      <Text className="text-gray-700 font-sf-regular text-base">
        {item}
      </Text>
    </TouchableOpacity>
  ), [handleSuggestionTap]);

  return (
    <>
      {/* Search Bar */}
      <TouchableOpacity
        onPress={handleSearchBarPress}
        activeOpacity={0.8}
        style={style}
        className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3"
      >
        <Search size={moderateScale(20)} color="#9CA3AF" />
        <Text className="flex-1 ml-3 text-gray-500 font-sf-regular text-base">
          {placeholder}
        </Text>
      </TouchableOpacity>

      {/* Search Modal */}
      {showModal && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-white">
            {/* Modal Header */}
            <View className="px-4 py-3 border-b border-gray-100 bg-white">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="mr-3 p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color="#000" />
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <Search size={20} color="#9CA3AF" className="mr-2" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearchSubmit()}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 text-black font-sf-regular text-base"
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoFocus={autoFocus}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Modal Content */}
            <Pressable className="flex-1" onPress={Keyboard.dismiss}>
              <FlatList
                data={[]}
                keyExtractor={() => 'empty'}
                renderItem={() => null}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                  <View>
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <View className="bg-white">
                        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                          <Text className="text-gray-800 font-sf-bold text-base">
                            Tìm kiếm gần đây
                          </Text>
                          <TouchableOpacity onPress={clearRecentSearches}>
                            <Text className="text-blue-500 font-sf-medium text-sm">
                              Xóa tất cả
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <FlatList
                          data={recentSearches}
                          keyExtractor={(item, index) => `recent-${index}`}
                          renderItem={renderRecentSearch}
                          scrollEnabled={false}
                        />
                      </View>
                    )}

                    {/* Trending Searches */}
                    <View className="bg-white mt-2">
                      <View className="px-4 py-3 border-b border-gray-100">
                        <Text className="text-gray-800 font-sf-bold text-base">
                          Tìm kiếm phổ biến
                        </Text>
                      </View>
                      <FlatList
                        data={TRENDING_SEARCHES}
                        keyExtractor={(item, index) => `trending-${index}`}
                        renderItem={renderTrendingSearch}
                        scrollEnabled={false}
                      />
                    </View>
                  </View>
                )}
              />
            </Pressable>
          </View>
        </Modal>
      )}
    </>
  );
}