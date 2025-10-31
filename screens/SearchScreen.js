import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';

import { articlesAPI, CategoriesAPI } from '../services/apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  'Tin tức kiểm sát mới nhất',
  'Hoạt động thanh tra VKS',
  'Giám sát thi hành pháp luật',
  'Quyết định kiểm sát quan trọng',
  'Văn bản VKS mới ban hành',
  'Nghị quyết ngành kiểm sát',
  'Chỉ thị VKS',
  'Hướng dẫn thực hiện VKS',
  'Tình hình an ninh quốc gia',
  'Phòng chống tội phạm',
  'Trật tự xã hội',
  'An toàn cộng đồng',
  'Luật sửa đổi bổ sung 2024',
  'Chính sách pháp luật mới',
  'Văn bản quy phạm pháp luật',
  'Thay đổi quy định pháp lý',
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
    
    saveToRecentSearches(trimmedQuery);
    
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
        <Text key={i} style={{ fontWeight: 'bold', color: '#2563EB' }}>{part}</Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  }, []);

  // Render suggestion item
  const renderSuggestion = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SCREEN_WIDTH < 768 ? 10 : 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 6
      }}
    >
      <Search size={SCREEN_WIDTH < 768 ? 16 : 18} color="#6B7280" />
      <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 14 : 16, color: '#1F2937', flex: 1 }}>
        {highlightMatch(typeof item === 'string' ? item : item.title, query)}
      </Text>
    </TouchableOpacity>
  ), [handleSelectSuggestion, highlightMatch, query]);

  // Render recent search item
  const renderRecentSearch = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SCREEN_WIDTH < 768 ? 10 : 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 6
      }}
    >
      <History size={SCREEN_WIDTH < 768 ? 16 : 18} color="#6B7280" />
      <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 14 : 16, color: '#1F2937', flex: 1 }}>
        {item}
      </Text>
      <TouchableOpacity
        onPress={() => setRecentSearches(prev => prev.filter(search => search !== item))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={SCREEN_WIDTH < 768 ? 14 : 16} color="#6B7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleSelectSuggestion]);

  // Render trending search item
  const renderTrendingSearch = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SCREEN_WIDTH < 768 ? 10 : 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 6
      }}
    >
      <TrendingUp size={SCREEN_WIDTH < 768 ? 16 : 18} color="#EF4444" />
      <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 14 : 16, color: '#1F2937', flex: 1 }}>
        {item}
      </Text>
    </TouchableOpacity>
  ), [handleSelectSuggestion]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <KeyboardAvoidingView
        style={{ flex: 1, paddingHorizontal: 12 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{ marginBottom: 12, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  padding: 8,
                  borderRadius: 9999,
                  backgroundColor: '#F3F4F6'
                }}
              >
                <ArrowLeft size={SCREEN_WIDTH < 768 ? 18 : 20} color="#374151" />
              </TouchableOpacity>
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 18 : 20, fontWeight: 'bold', color: '#111827', marginLeft: 8 }}>
                Tìm kiếm
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={{
                padding: 8,
                borderRadius: 9999,
                backgroundColor: activeFilter !== 'all' || selectedCategory ? '#3B82F6' : '#F3F4F6'
              }}
            >
              <SlidersHorizontal 
                size={SCREEN_WIDTH < 768 ? 18 : 20} 
                color={activeFilter !== 'all' || selectedCategory ? '#FFFFFF' : '#374151'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Box */}
        <View style={{ marginBottom: 12, position: 'relative' }}>
          <TextInput
            ref={inputRef}
            placeholder="Bạn muốn tìm gì?"
            placeholderTextColor="#6B7280"
            style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 40,
              paddingVertical: SCREEN_WIDTH < 768 ? 10 : 12,
              borderRadius: 12,
              fontSize: SCREEN_WIDTH < 768 ? 14 : 16,
              color: '#1F2937'
            }}
            value={query}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
          />
          <Search
            size={SCREEN_WIDTH < 768 ? 18 : 20}
            color="#6B7280"
            style={{ position: 'absolute', left: 10, top: SCREEN_WIDTH < 768 ? 10 : 12 }}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setFilteredSuggestions(DEFAULT_SUGGESTIONS);
              }}
              style={{ position: 'absolute', right: 10, top: SCREEN_WIDTH < 768 ? 10 : 12 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={SCREEN_WIDTH < 768 ? 16 : 18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={{
            marginBottom: 12,
            padding: 12,
            backgroundColor: '#FFFFFF',
            borderRadius: 12
          }}>
            <View>
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#4B5563', marginBottom: 8, fontWeight: '500' }}>
                Tìm kiếm theo:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'title', label: 'Tiêu đề' },
                    { key: 'author', label: 'Tác giả' },
                    { key: 'category', label: 'Danh mục' }
                  ].map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => handleFilterChange(filter.key)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 9999,
                        backgroundColor: activeFilter === filter.key ? '#3B82F6' : '#E5E7EB'
                      }}
                    >
                      <Text style={{
                        fontSize: SCREEN_WIDTH < 768 ? 12 : 14,
                        color: activeFilter === filter.key ? '#FFFFFF' : '#374151',
                        fontWeight: '500'
                      }}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {categories.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#4B5563', marginBottom: 8, fontWeight: '500' }}>
                  Danh mục:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {categories.map((category) => {
                      const categoryName = category.name || category.title || category;
                      return (
                        <TouchableOpacity
                          key={category._id || categoryName}
                          onPress={() => handleCategorySelect(categoryName)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 9999,
                            backgroundColor: selectedCategory === categoryName ? '#10B981' : '#E5E7EB'
                          }}
                        >
                          <Text style={{
                            fontSize: SCREEN_WIDTH < 768 ? 12 : 14,
                            color: selectedCategory === categoryName ? '#FFFFFF' : '#374151',
                            fontWeight: '500'
                          }}>
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
                <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#6B7280', marginBottom: 6, fontWeight: '500' }}>
                  Gợi ý tìm kiếm:
                </Text>
              );
            } else if (recentSearches.length > 0) {
              return (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#6B7280', fontWeight: '500' }}>
                      Tìm kiếm gần đây:
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#3B82F6', fontWeight: '500' }}>
                        Xóa tất cả
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } else {
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#6B7280', fontWeight: '500' }}>
                    Tìm kiếm phổ biến:
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setCurrentTrendingSearches(getRandomTrendingSearches())}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#10B981', fontWeight: '500' }}>
                      Làm mới
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
          }}
          ListEmptyComponent={
            <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 14 : 16, color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
              Không có gợi ý phù hợp
            </Text>
          }
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}