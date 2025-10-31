const handleOptionPress = () => {
    setShowModal(false);
  };import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { ChevronRight, BookOpen, Users, FileText, X, ChevronLeft } from 'lucide-react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FONT_CONFIG } from '../constants/fonts';

const { height: screenHeight } = Dimensions.get('window');

export default function NoteBookScreen() {
  const [activeTab, setActiveTab] = useState('intro');
  const [showModal, setShowModal] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();

  const sections = [
    {
      id: 'intro',
      icon: BookOpen,
      title: 'Giới thiệu Viện kiểm sát',
      description: 'Cơ cấu, chức năng và vai trò',
      color: '#007AFF',
      lightBg: '#F0F7FF',
      router: 'Info',
    },
    {
      id: 'prosecutor',
      icon: Users,
      title: 'Kiểm sát viên cần biết',
      description: 'Hướng dẫn, quy trình và kiến thức',
      color: '#AF52DE',
      lightBg: '#FAF5FF',
      link: 'https://hpu.vn/ksv-can-biet',
    },
    {
      id: 'documents',
      icon: FileText,
      title: 'Tài liệu nghiệp vụ',
      description: 'Mẫu, biểu mẫu và tài liệu hỗ trợ',
      color: '#FF9500',
      lightBg: '#FFF8F0',
      router: 'phattrien',
    },
  ];



  const handlePress = (section) => {
    if (section.link) {
      Linking.openURL(section.link).catch((err) =>
        console.log('Không thể mở liên kết:', err)
      );
    } else {
      if (section.router === 'phattrien') {
        setShowModal(true);
      } else {
        navigation.navigate(section.router);
      }
    }
  };

  const handleOptionPress = (url) => {
    setShowModal(false);
    setTimeout(() => {
      Linking.openURL(url).catch((err) =>
        console.log('Không thể mở liên kết:', err)
      );
    }, 300);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F9F9F9"
        translucent={false}
      />

      {/* Header */}
      <View className="py-4 px-4 bg-white relative">

        {/* Tiêu đề ở giữa */}
        <Text
          className="text-xl font-sf-bold text-black text-center"
          numberOfLines={1}
        >
          Sổ tay kiểm sát
        </Text>

        {/* Bóng đổ */}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 24,
          paddingTop: 16,
          paddingHorizontal: 12,
        }}
      >
        {/* Section Cards */}
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => handlePress(section)}
            activeOpacity={0.6}
            className="mb-3"
          >
            <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <View className="flex-row items-start justify-between px-4 py-4">
                {/* Icon & Text */}
                <View className="flex-1 mr-3">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: section.lightBg }}
                  >
                    <section.icon
                      size={24}
                      color={section.color}
                      strokeWidth={2.5}
                    />
                  </View>

                  <Text
                    className="text-base text-black mb-1.5"
                    style={{ fontFamily: FONT_CONFIG.bold }}
                    numberOfLines={2}
                  >
                    {section.title}
                  </Text>

                  <Text
                    className="text-sm text-gray-600 leading-5"
                    style={{ fontFamily: FONT_CONFIG.regular }}
                    numberOfLines={2}
                  >
                    {section.description}
                  </Text>
                </View>

                {/* Chevron */}
                <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center">
                  <ChevronRight
                    size={18}
                    color="#999999"
                    strokeWidth={2.5}
                  />
                </View>
              </View>

              {/* Accent Line */}
              <View
                className="h-1 w-10 rounded-full ml-4"
                style={{ backgroundColor: section.color }}
              />
            </View>
          </TouchableOpacity>
        ))}

        {/* Info Banner */}
        <View className="mt-6 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-200 flex-row items-start">
          <View className="w-1 h-full bg-blue-500 rounded mr-3 mt-0.5" />

          <View className="flex-1">
            <Text
              className="text-sm text-blue-900 mb-1"
              style={{ fontFamily: FONT_CONFIG.bold }}
              numberOfLines={1}
            >
              Cập nhật thường xuyên
            </Text>
            <Text
              className="text-xs text-blue-700 leading-4"
              style={{ fontFamily: FONT_CONFIG.regular }}
              numberOfLines={3}
            >
              Nội dung được cập nhật định kỳ để đảm bảo bạn luôn có thông tin
              mới nhất
            </Text>
          </View>
        </View>

        {/* Empty State Message */}
        <View className="mt-8 items-center">
          <Text
            className="text-xs text-gray-500 text-center leading-4"
            style={{ fontFamily: FONT_CONFIG.regular }}
          >
            Chọn một mục để xem chi tiết
          </Text>
        </View>
      </ScrollView>

      {/* Modal Popup */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowModal(false)}
          className="flex-1 bg-black/40 justify-end"
        >
          {/* Modal Content */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl pt-4"
          >
            {/* Handle Bar */}
            <View className="items-center py-2">
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-200">
              <Text
                className="text-lg text-black flex-1"
                style={{ fontFamily: FONT_CONFIG.bold }}
              >
                Tài liệu nghiệp vụ
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={20} color="#666666" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              scrollEnabled={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 28,
              }}
            >
              {/* Icon Container */}
              <View className="items-center mb-6">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-5"
                  style={{ backgroundColor: '#FFF8F0' }}
                >
                  <FileText size={40} color="#FF9500" strokeWidth={2} />
                </View>

                {/* Title */}
                <Text
                  className="text-xl text-black text-center mb-2"
                  style={{ fontFamily: FONT_CONFIG.bold, letterSpacing: -0.3 }}
                >
                  Tài liệu được tải lên sau
                </Text>

                {/* Description */}
                <Text
                  className="text-sm text-gray-600 text-center leading-5"
                  style={{ fontFamily: FONT_CONFIG.regular }}
                >
                  Chúng tôi đang chuẩn bị các tài liệu nghiệp vụ mới. Vui lòng
                  quay lại trong thời gian tới
                </Text>
              </View>

              {/* Info Box */}
              <View className="bg-orange-50 rounded-2xl border border-orange-200 p-4 mb-6 flex-row items-start">
                <View
                  className="w-1 h-full bg-orange-500 rounded mr-3"
                  style={{ height: '100%', minHeight: 60 }}
                />
                <View className="flex-1">
                  <Text
                    className="text-sm text-orange-900 mb-1"
                    style={{ fontFamily: FONT_CONFIG.bold }}
                  >
                    Thông báo
                  </Text>
                  <Text
                    className="text-xs text-orange-700 leading-4"
                    style={{ fontFamily: FONT_CONFIG.regular }}
                  >
                    Hãy đăng ký để nhận thông báo khi có nội dung mới
                  </Text>
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="bg-orange-500 rounded-xl py-3 items-center mb-3"
              >
                <Text
                  className="text-white text-center text-base"
                  style={{ fontFamily: FONT_CONFIG.bold }}
                >
                  Đã hiểu
                </Text>
              </TouchableOpacity>

              {/* Secondary Button */}
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text
                  className="text-gray-700 text-center text-base"
                  style={{ fontFamily: FONT_CONFIG.bold }}
                >
                  Đóng
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}