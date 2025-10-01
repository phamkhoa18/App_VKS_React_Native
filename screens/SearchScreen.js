// screens/SearchScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { 
  ArrowLeft, 
  Search, 
  History, 
  TrendingUp,
  X,
  SlidersHorizontal 
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { articlesAPI, CategoriesAPI } from '../services/apiService';

// Constants
const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 10;

// Default suggestions cho pháp luật
const DEFAULT_SUGGESTIONS = [
  'Văn bản pháp luật mới nhất',
  'Thủ tục kiểm sát',
  'An ninh trật tự',
  'Bản án tiêu biểu',
  'Chatbot AI pháp lý',
  'Chính sách pháp luật',
];

// 20 trending searches liên quan đến các danh mục VKS
const ALL_TRENDING_SEARCHES = [
  // Ngành kiểm sát 24/7
  'Tin tức kiểm sát mới nhất',
  'Hoạt động thanh tra VKS',
  'Giám sát thi hành pháp luật',
  'Quyết định kiểm sát quan trọng',
  
  // Văn bản trong ngành VKS
  'Văn bản VKS mới ban hành',
  'Nghị quyết ngành kiểm sát',
  'Chỉ thị VKS',
  'Hướng dẫn thực hiện VKS',
  
  // An ninh trật tự
  'Tình hình an ninh quốc gia',
  'Phòng chống tội phạm',
  'Trật tự xã hội',
  'An toàn cộng đồng',
  
  // Chính sách pháp luật mới
  'Luật sửa đổi bổ sung 2024',
  'Chính sách pháp luật mới',
  'Văn bản quy phạm pháp luật',
  'Thay đổi quy định pháp lý',
  
  // Bản án, án lệ
  'Bản án tiêu biểu VKS',
  'Án lệ tòa án tối cao',
  'Phán quyết quan trọng',
  'Xét xử các vụ án lớn'
];

// Function để lấy 10 trending searches ngẫu nhiên
const getRandomTrendingSearches = () => {
  const shuffled = [...ALL_TRENDING_SEARCHES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
};

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const inputRef = useRef(null);
  
  // Get initial search query from navigation params
  const initialQuery = route.params?.query || route.params?.category || '';
  const searchType = route.params?.type || 'general';
  
  // States
  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [currentTrendingSearches, setCurrentTrendingSearches] = useState([]);
  
  // Loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Refs
  const searchTimeout = useRef(null);

  // Load recent searches from storage
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

  // Save search to recent searches
  const saveToRecentSearches = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let recent = stored ? JSON.parse(stored) : [];
      
      recent = recent.filter(item => item.toLowerCase() !== searchQuery.toLowerCase());
      recent.unshift(searchQuery.trim());
      recent = recent.slice(0, MAX_RECENT_SEARCHES);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
      setRecentSearches(recent);
    } catch (error) {
      console.error('❌ Error saving recent search:', error);
    }
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('❌ Error clearing recent searches:', error);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const result = await CategoriesAPI.getAll();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Get search suggestions (debounced)
  const getSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setFilteredSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const result = await articlesAPI.getSuggestions(searchQuery);
      if (result.success) {
        const apiSuggestions = result.data || [];
        setSuggestions(apiSuggestions);
        
        // Combine API suggestions with filtered default suggestions
        const q = searchQuery.toLowerCase();
        const filteredDefault = DEFAULT_SUGGESTIONS.filter(s => 
          s.toLowerCase().includes(q)
        );
        
        const combined = [...apiSuggestions, ...filteredDefault];
        const unique = [...new Set(combined)];
        setFilteredSuggestions(unique.slice(0, 10));
      }
    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
      // Fallback to default filtering
      const q = searchQuery.toLowerCase();
      setFilteredSuggestions(
        DEFAULT_SUGGESTIONS.filter(s => s.toLowerCase().includes(q))
      );
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced suggestions
  const debouncedGetSuggestions = useCallback((searchQuery) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      getSuggestions(searchQuery);
    }, 300);
  }, [getSuggestions]);

  // Navigate to search results
  const navigateToSearchResults = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    
    const trimmedQuery = searchQuery.trim();
    
    // Save to recent searches
    saveToRecentSearches(trimmedQuery);
    
    // Navigate to SearchResult with parameters
    navigation.navigate('SearchResult', {
      query: trimmedQuery,
      type: searchType,
      filter: activeFilter,
      category: selectedCategory
    });
  }, [navigation, searchType, activeFilter, selectedCategory, saveToRecentSearches]);

  // Handle search input change
  const handleSearchChange = useCallback((text) => {
    setQuery(text);
    
    if (text.length >= 2) {
      debouncedGetSuggestions(text);
    } else {
      setSuggestions([]);
      setFilteredSuggestions(DEFAULT_SUGGESTIONS);
    }
  }, [debouncedGetSuggestions]);

  // Handle search submit
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      navigateToSearchResults(query);
    }
  }, [query, navigateToSearchResults]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion) => {
    const searchQuery = typeof suggestion === 'string' ? suggestion : suggestion.title;
    setQuery(searchQuery);
    navigateToSearchResults(searchQuery);
  }, [navigateToSearchResults]);

  // Handle filter change
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  }, [selectedCategory]);

  // Initialize screen
  useEffect(() => {
    loadRecentSearches();
    loadCategories();
    setCurrentTrendingSearches(getRandomTrendingSearches());
    
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Auto search if initial query exists
  useEffect(() => {
    if (initialQuery) {
      if (searchType === 'category') {
        setActiveFilter('category');
        setSelectedCategory(initialQuery);
      }
      
      setTimeout(() => {
        navigateToSearchResults(initialQuery);
      }, 500);
    }
  }, [initialQuery, searchType, navigateToSearchResults]);

  // Highlight match function
  const highlightMatch = useCallback((text, searchQuery) => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Text key={i} className="font-sf-bold text-blue-600">{part}</Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  }, []);

  // Render suggestion item
  const renderSuggestion = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      className="flex-row items-center py-2.5 border-b border-gray-200 gap-1.5"
    >
      <Search size={moderateScale(16)} color="#888" strokeWidth={2} />
      <Text style={styles.suggestionText} className="font-sf-regular text-gray-800 flex-1">
        {highlightMatch(typeof item === 'string' ? item : item.title, query)}
      </Text>
    </TouchableOpacity>
  ), [handleSelectSuggestion, highlightMatch, query]);

  // Render recent search item
  const renderRecentSearch = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      className="flex-row items-center py-2.5 border-b border-gray-200 gap-1.5"
    >
      <History size={moderateScale(16)} color="#888" strokeWidth={2} />
      <Text style={styles.suggestionText} className="font-sf-regular text-gray-800 flex-1">
        {item}
      </Text>
      <TouchableOpacity
        onPress={() => setRecentSearches(prev => prev.filter(search => search !== item))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={moderateScale(14)} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleSelectSuggestion]);

  // Render trending search item
  const renderTrendingSearch = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      className="flex-row items-center py-2.5 border-b border-gray-200 gap-1.5"
    >
      <TrendingUp size={moderateScale(16)} color="#EF4444" strokeWidth={2} />
      <Text style={styles.suggestionText} className="font-sf-regular text-gray-800 flex-1">
        {item}
      </Text>
    </TouchableOpacity>
  ), [handleSelectSuggestion]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="p-2 rounded-full bg-gray-100"
              >
                <ArrowLeft size={moderateScale(18)} color="#333" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.headerTitle} className="font-sf-bold text-gray-900 ml-2">
                Tìm kiếm
              </Text>
            </View>
            
            {/* Filter Button */}
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full ${
                activeFilter !== 'all' || selectedCategory ? 'bg-blue-500' : 'bg-gray-100'
              }`}
            >
              <SlidersHorizontal 
                size={moderateScale(18)} 
                color={activeFilter !== 'all' || selectedCategory ? '#FFF' : '#333'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <TextInput
            ref={inputRef}
            placeholder="Bạn muốn tìm gì?"
            placeholderTextColor="#999"
            className="bg-gray-100 px-10 py-2.5 rounded-xl font-sf-medium text-gray-800"
            style={styles.textInput}
            value={query}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
          />
          <Search
            size={moderateScale(18)}
            color="#999"
            style={styles.searchIcon}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setFilteredSuggestions(DEFAULT_SUGGESTIONS);
              }}
              style={styles.clearIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={moderateScale(16)} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            {/* Search Type Filters */}
            <View>
              <Text style={styles.filterLabel} className="font-sf-medium text-gray-600 mb-2">Tìm kiếm theo:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'title', label: 'Tiêu đề' },
                    { key: 'author', label: 'Tác giả' },
                    { key: 'category', label: 'Danh mục' }
                  ].map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => handleFilterChange(filter.key)}
                      className={`px-3 py-1.5 rounded-full ${
                        activeFilter === filter.key 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200'
                      }`}
                    >
                      <Text className={`font-sf-medium text-sm ${
                        activeFilter === filter.key 
                          ? 'text-white' 
                          : 'text-gray-700'
                      }`}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Categories Filter */}
            {categories.length > 0 && (
              <View style={{ marginTop: verticalScale(12) }}>
                <Text style={styles.filterLabel} className="font-sf-medium text-gray-600 mb-2">Danh mục:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {categories.map((category) => {
                      const categoryName = category.name || category.title || category;
                      return (
                        <TouchableOpacity
                          key={category._id || categoryName}
                          onPress={() => handleCategorySelect(categoryName)}
                          className={`px-3 py-1.5 rounded-full ${
                            selectedCategory === categoryName 
                              ? 'bg-green-500' 
                              : 'bg-gray-200'
                          }`}
                        >
                          <Text className={`font-sf-medium text-sm ${
                            selectedCategory === categoryName 
                              ? 'text-white' 
                              : 'text-gray-700'
                          }`}>
                            {categoryName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Suggestions List */}
        <FlatList
          data={query.length >= 2 ? filteredSuggestions : [...recentSearches, ...currentTrendingSearches]}
          keyExtractor={(item, index) => `suggestion-${index}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => {
            if (query.length >= 2) {
              return renderSuggestion({ item });
            } else if (index < recentSearches.length) {
              return renderRecentSearch({ item });
            } else {
              const trendingItem = currentTrendingSearches[index - recentSearches.length];
              return renderTrendingSearch({ item: trendingItem });
            }
          }}
          ListHeaderComponent={() => {
            if (query.length >= 2) {
              return (
                <Text style={styles.suggestionHeader} className="font-sf-medium text-gray-500 mb-1.5">
                  Gợi ý tìm kiếm:
                </Text>
              );
            } else if (recentSearches.length > 0) {
              return (
                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text style={styles.suggestionHeader} className="font-sf-medium text-gray-500">
                      Tìm kiếm gần đây:
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearButton} className="font-sf-medium text-blue-500">
                        Xóa tất cả
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } else {
              return (
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text style={styles.suggestionHeader} className="font-sf-medium text-gray-500">
                    Tìm kiếm phổ biến:
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setCurrentTrendingSearches(getRandomTrendingSearches())}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.clearButton} className="font-sf-medium text-green-500">
                      Làm mới
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText} className="font-sf-medium text-gray-400 text-center mt-6">
              Không có gợi ý phù hợp
            </Text>
          }
          contentContainerStyle={styles.flatListContent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(12),
    backgroundColor: '#f9fafb',
  },
  header: {
    marginBottom: verticalScale(12),
    paddingTop: verticalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
  },
  searchContainer: {
    marginBottom: verticalScale(12),
    position: 'relative',
  },
  textInput: {
    fontSize: moderateScale(14),
  },
  searchIcon: {
    position: 'absolute',
    left: scale(10),
    top: verticalScale(10),
  },
  clearIcon: {
    position: 'absolute',
    right: scale(10),
    top: verticalScale(10),
  },
  filtersPanel: {
    marginBottom: verticalScale(12),
    padding: scale(12),
    backgroundColor: 'white',
    borderRadius: scale(12),
  },
  filterLabel: {
    fontSize: moderateScale(12),
  },
  suggestionHeader: {
    fontSize: moderateScale(12),
  },
  clearButton: {
    fontSize: moderateScale(12),
  },
  suggestionText: {
    fontSize: moderateScale(14),
  },
  emptyText: {
    fontSize: moderateScale(14),
  },
  flatListContent: {
    paddingHorizontal: scale(12),
  },
});