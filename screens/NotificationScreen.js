import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { CheckCheck, MoreHorizontal, Bell, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonLoader from '../components/SkeletonLoader';

const fakeApiCall = () =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([]),
      1200
    )
  );

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await fakeApiCall();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Mark single notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount === 0) return;

    Alert.alert(
      'Đánh dấu đã đọc',
      `Đánh dấu ${unreadCount} thông báo là đã đọc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: () => {
            setNotifications(prev =>
              prev.map(notif => ({ ...notif, read: true }))
            );
          }
        }
      ]
    );
  };

  // Delete notification
  const deleteNotification = (id) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(notif => notif.id !== id));
          }
        }
      ]
    );
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    // You can customize this logic based on your app's requirements
    console.log('Notification pressed:', notification.title);
  };

  // Get notification type color
  const getNotificationColor = (type) => {
    switch (type) {
      case 'promotion': return '#FF6B35';
      case 'success': return '#4CAF50';
      case 'game': return '#9C27B0';
      case 'security': return '#F44336';
      case 'welcome': return '#2196F3';
      default: return '#6B7280';
    }
  };

  // Format time ago
  const formatTimeAgo = (timeString) => {
    const now = new Date();
    const time = new Date(timeString.replace(' - ', ' '));
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    
    const days = Math.floor(diffInMinutes / 1440);
    if (days < 7) return `${days} ngày trước`;
    
    return timeString;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View
        className={`mx-4 mb-3 p-4 rounded-2xl border ${
          item.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center flex-1">
            {/* Type indicator */}
            <View
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: getNotificationColor(item.type) }}
            />
            <Text 
              className={`text-lg flex-1 pr-2 ${
                item.read ? 'font-sf-medium text-gray-800' : 'font-sf-bold text-black'
              }`}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => deleteNotification(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-2"
          >
            <MoreHorizontal size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        <Text 
          className={`text-md mt-1 font-sf-regular leading-6 ml-6 ${
            item.read ? 'text-gray-500' : 'text-gray-700'
          }`}
          numberOfLines={3}
        >
          {item.description}
        </Text>
        
        <Text className="text-sm text-gray-400 mt-2 font-sf-regular ml-6">
          {formatTimeAgo(item.time)}
        </Text>
        
        {/* Unread indicator */}
        {!item.read && (
          <View className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Bell size={64} color="#D1D5DB" />
      <Text className="text-gray-500 text-lg font-sf-medium mt-4 mb-2">
        Chưa có thông báo nào
      </Text>
      <Text className="text-gray-400 text-sm font-sf-regular text-center px-8">
        Các thông báo mới sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="py-4 px-4 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="text-2xl font-sf-bold text-black text-center"
              numberOfLines={1}
            >
              Thông báo
            </Text>
            {!loading && (
              <Text className="text-sm font-sf-regular text-gray-500 text-center mt-1">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
              </Text>
            )}
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="absolute right-4 top-1/2 -translate-y-3 p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CheckCheck size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Shadow */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#000',
            opacity: 0.1,
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <SkeletonLoader itemCount={4} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 120,
            flexGrow: 1,
          }}
        />
      )}
    </SafeAreaView>
  );
}