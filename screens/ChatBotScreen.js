import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Send, 
  User, 
  Copy, 
  MoreVertical,
  Trash2,
  Share2,
  AlertCircle,
  Gavel,
  HelpCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = 'https://saigon247.au/chatbot';

// ==================== LawChatService - HOÀN CHỈNH ====================
class LawChatService {
  static async askQuestion(messages, onMessage) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let buffer = '';
      let accumulatedText = '';
      let hasFullText = false;

      xhr.open('POST', `${API_BASE_URL}/ask`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      xhr.onprogress = () => {
        try {
          const newData = xhr.responseText.substring(buffer.length);
          buffer += newData;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.substring(6).trim();
            if (data === '[DONE]') {
              resolve({ success: true, response: accumulatedText });
              return;
            }

            try {
              const json = JSON.parse(data);

              // ƯU TIÊN: full_text → cập nhật toàn bộ
              if (json.full_text !== undefined) {
                const formatted = this.formatTextForDisplay(json.full_text);
                accumulatedText = formatted;
                hasFullText = true;
                onMessage(formatted, true);
                continue;
              }

              // Nếu chưa có full_text → nối từng text
              if (json.text !== undefined && !hasFullText) {
                const formatted = this.formatTextForDisplay(json.text);
                accumulatedText += formatted;
                onMessage(formatted, false);
              }

              if (json.error) throw new Error(json.error);
            } catch (e) {
            }
          }
        } catch (error) {
          console.error('Progress error:', error);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.substring(6).trim();
                if (data !== '[DONE]') {
                  try {
                    const json = JSON.parse(data);
                    if (json.full_text !== undefined) {
                      const formatted = this.formatTextForDisplay(json.full_text);
                      accumulatedText = formatted;
                      onMessage(formatted, true);
                    } else if (json.text !== undefined && !hasFullText) {
                      const formatted = this.formatTextForDisplay(json.text);
                      accumulatedText += formatted;
                      onMessage(formatted, false);
                    }
                  } catch {}
                }
              }
            }
          }

          if (xhr.status === 200) {
            resolve({ success: true, response: accumulatedText });
          } else {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Timeout'));
      xhr.timeout = 60000;

      try {
        xhr.send(JSON.stringify({ messages }));
      } catch (error) {
        reject(error);
      }
    });
  }

  // Giữ nguyên định dạng server trả về
  static formatTextForDisplay(text) {
    if (!text) return '';
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
    // Không .trim() → giữ khoảng trắng đầu/cuối
  }

  static async testConnection() {
    try {
      const res = await fetch(`${API_BASE_URL}/test`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ==================== Câu hỏi nhanh ====================
const QUICK_QUESTIONS = [
  'Thủ tục đăng ký kết hôn cần giấy tờ gì?',
  'Quyền thừa kế theo pháp luật như thế nào?',
  'Hợp đồng mua bán nhà đất cần điều kiện gì?',
  'Thời hiệu khởi kiện trong tranh chấp dân sự?',
  'Quyền nuôi con sau ly hôn được quy định ra sao?',
  'Các tình tiết tăng nặng trách nhiệm hình sự?',
  'Tuổi chịu trách nhiệm hình sự ở Việt Nam?',
  'Sự khác biệt giữa tội cướp và tội trộm cắp?',
  'Các biện pháp tư pháp thay thế tù giam?',
  'Điều kiện được hưởng án treo?',
];

// ==================== MAIN COMPONENT ====================
export default function LawChatBotScreen({ navigation }) {
  const safeAreaInsets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Tư vấn Luật Việt Nam. Tôi có thể giúp bạn giải đáp các vấn đề pháp lý dựa trên các Bộ luật hiện hành. Bạn có câu hỏi gì về luật pháp không?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(1)).current;
  const currentBotMessageId = useRef(null);
  const thinkingDotsAnim = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3)
  ]).current;

  // Kiểm tra kết nối
  useEffect(() => {
    const check = async () => {
      const ok = await LawChatService.testConnection();
      setConnectionStatus(ok ? 'connected' : 'disconnected');
    };
    check();
  }, []);

  // Keyboard + Scroll
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setShowQuickActions(false);
      Animated.timing(quickActionsAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (messages.length <= 1) {
        setShowQuickActions(true);
        Animated.timing(quickActionsAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    });

    return () => { show.remove(); hide.remove(); };
  }, [messages.length]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Animation
  const startTyping = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const stopTyping = useCallback(() => {
    typingAnim.stopAnimation();
    typingAnim.setValue(0);
  }, []);

  // Animation cho "AI đang suy nghĩ..."
  const startThinkingAnimation = useCallback(() => {
    const animations = thinkingDotsAnim.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    });
    Animated.parallel(animations).start();
  }, [thinkingDotsAnim]);

  const stopThinkingAnimation = useCallback(() => {
    thinkingDotsAnim.forEach(anim => {
      anim.stopAnimation();
      anim.setValue(0.3);
    });
  }, [thinkingDotsAnim]);

  // GỬI TIN NHẮN - STREAMING CHUẨN
  const sendMessage = useCallback(async (text = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: text.trim(), sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setShowQuickActions(false);
    setIsLoading(true);
    startTyping();
    startThinkingAnimation();

    const botMsgId = (Date.now() + 1).toString();
    currentBotMessageId.current = botMsgId;

    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'assistant',
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      type: 'thinking'
    }]);

    try {
      const payload = [
        { role: 'system', content: 'Bạn là trợ lý AI pháp luật Việt Nam.' },
        ...messages.concat([userMsg]).map(m => ({ role: m.role, content: m.content }))
      ];

      await LawChatService.askQuestion(payload, (chunk, isFullUpdate) => {
        if (currentBotMessageId.current !== botMsgId) return;

        setMessages(prev => prev.map(m => {
          if (m.id !== botMsgId) return m;
          // Chuyển từ 'thinking' sang 'answer' khi có nội dung
          return { 
            ...m, 
            content: isFullUpdate ? chunk : m.content + chunk,
            type: m.type === 'thinking' ? 'answer' : m.type
          };
        }));
      });

      stopTyping();
      stopThinkingAnimation();
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, content: `Lỗi: ${err.message}`, type: 'error' } : m
      ));
    } finally {
      setIsLoading(false);
      stopTyping();
      stopThinkingAnimation();
    }
  }, [inputText, isLoading, messages, startTyping, stopTyping, startThinkingAnimation, stopThinkingAnimation]);

  // Các hàm phụ
  const toggleMenu = useCallback(() => {
    setShowMenu(prev => {
      const next = !prev;
      Animated.timing(menuAnim, { toValue: next ? 1 : 0, duration: 200, useNativeDriver: true }).start();
      return next;
    });
  }, []);

  const clearChat = useCallback(() => {
    Alert.alert('Xóa lịch sử', 'Xóa toàn bộ cuộc trò chuyện?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Xin chào! Tôi là AI Tư vấn Luật Việt Nam. Tôi có thể giúp bạn giải đáp các vấn đề pháp lý dựa trên các Bộ luật hiện hành. Bạn có câu hỏi gì về luật pháp không?',
          sender: 'bot',
          timestamp: new Date(),
          type: 'welcome'
        }]);
        setShowQuickActions(true);
        setShowMenu(false);
      }}
    ]);
  }, []);

  const copyMessage = useCallback((content) => {
    Alert.alert('Đã sao chép', 'Nội dung đã được sao chép');
  }, []);

  const handleQuickQuestion = useCallback((q) => {
    setShowQuickActions(false);
    sendMessage(q);
  }, [sendMessage]);

  const shouldDisableSend = isLoading || !inputText.trim();

  // Render tin nhắn
  const renderMessage = useCallback((msg) => {
    const isBot = msg.sender === 'bot';
    const isWelcome = msg.type === 'welcome';
    const isError = msg.type === 'error';
    const isThinking = msg.type === 'thinking' && !msg.content;
    const isStreaming = msg.type === 'answer' && isLoading && msg.id === currentBotMessageId.current && msg.content;

    return (
      <View key={msg.id}>
        <View style={{ flexDirection: 'row', marginBottom: 16, justifyContent: isBot ? 'flex-start' : 'flex-end', alignItems: 'flex-start' }}>
          {isBot && (
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isWelcome ? '#DBEAFE' : isError ? '#EF444420' : '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              {isWelcome || !isError ? (
                <LinearGradient colors={['#007AFF', '#00C6FF']} style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden' }}>
                  <Image source={require('../assets/icon_app.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                </LinearGradient>
              ) : <AlertCircle size={16} color="#EF4444" />}
            </View>
          )}
          {isThinking ? (
            <View style={{
              maxWidth: SCREEN_WIDTH * 0.75,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 20,
              backgroundColor: '#FFF',
              borderBottomLeftRadius: 6,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                {thinkingDotsAnim.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 4,
                      backgroundColor: '#3B82F6',
                      opacity: anim,
                    }}
                  />
                ))}
              </View>
              <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic'}}>
                AI đang suy nghĩ...
              </Text>
            </View>
          ) : (
            <View style={{
              maxWidth: SCREEN_WIDTH * 0.75,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 20,
              backgroundColor: isBot ? (isWelcome ? '#FFFBEB' : isError ? '#EF444410' : '#FFF') : '#2563EB',
              borderBottomLeftRadius: isBot ? 6 : 20,
              borderBottomRightRadius: isBot ? 20 : 6
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 15, lineHeight: 22, color: isBot ? (isError ? '#EF4444' : '#0F172A') : '#FFF', flexShrink: 1 }}>
                  {msg.content}
                </Text>
                {isStreaming && (
                  <Animated.View style={{ width: 2, height: 16, backgroundColor: '#3B82F6', marginLeft: 4, borderRadius: 1, opacity: typingAnim.interpolate({ inputRange: [0,1], outputRange: [0,1] }) }} />
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: isBot ? '#64748B' : 'rgba(255,255,255,0.7)' }}>
                  {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {isBot && !isWelcome && !isError && (
                  <TouchableOpacity onPress={() => copyMessage(msg.content)} style={{ padding: 4 }}>
                    <Copy size={12} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          {!isBot && (
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
              <User size={16} color="#FFF" />
            </View>
          )}
        </View>
      </View>
    );
  }, [copyMessage, typingAnim, isLoading, thinkingDotsAnim]);

  const renderQuickActions = useCallback(() => {
    if (!showQuickActions) return null;
    return (
      <Animated.View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        opacity: quickActionsAnim,
        transform: [{ translateY: quickActionsAnim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }]
      }}>
        <Text style={{ fontSize: 13, color: '#0F172A', marginBottom: 12, fontWeight: '500' }}>Câu hỏi thường gặp</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {QUICK_QUESTIONS.map((q, i) => (
            <TouchableOpacity key={i} onPress={() => handleQuickQuestion(q)} style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 8
            }} disabled={isLoading}>
              <HelpCircle size={16} color="#2563EB" />
              <Text style={{ fontSize: 13, color: '#1D4ED8', fontWeight: '500' }}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  }, [showQuickActions, quickActionsAnim, handleQuickQuestion, isLoading]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <KeyboardAvoidingView
         style={{ flex: 1, justifyContent: 'space-between', width: '100%' }}
         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: '#FFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0'
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#2563EB" />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 6 }}>
            <LinearGradient colors={['#007AFF', '#00C6FF']} style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}>
              <Image source={require('../assets/icon_app.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, color: '#0F172A', fontWeight: 'bold' }}>AI Tư vấn Luật</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isLoading ? '#F59E0B' : connectionStatus === 'connected' ? '#10B981' : '#EF4444', marginRight: 6 }} />
                <Text style={{ fontSize: 13, color: '#10B981' }}>{isLoading ? 'Đang xử lý...' : 'Sẵn sàng'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={toggleMenu} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
            <MoreVertical size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Menu */}
        {showMenu && (
          <Animated.View style={{
            position: 'absolute',
            top: 50,
            right: 16,
            borderRadius: 16,
            zIndex: 99,
            overflow: 'hidden',
            opacity: menuAnim,
            transform: [{ scale: menuAnim.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) }]
          }}>
            <BlurView intensity={100} style={{ borderRadius: 16 }}>
              <TouchableOpacity onPress={clearChat} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <Trash2 size={16} color="#EF4444" />
                <Text style={{ marginLeft: 12, fontSize: 15, color: '#EF4444', fontWeight: '500' }}>Xóa cuộc trò chuyện</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 }} />
              <TouchableOpacity onPress={() => setShowMenu(false)} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <Share2 size={16} color="#2563EB" />
                <Text style={{ marginLeft: 12, fontSize: 15, color: '#2563EB', fontWeight: '500' }}>Chia sẻ</Text>
              </TouchableOpacity>
            </BlurView> 
          </Animated.View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 20 ,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}
          {messages.length > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B10', padding: 12, borderRadius: 12, marginTop: 16, gap: 8 }}>
              <AlertCircle size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#64748B', flex: 1 }}>Thông tin chỉ mang tính tham khảo.</Text>
            </View>
          )}
        </ScrollView>

        {renderQuickActions()}

        {/* Input Bar */}
        <View style={{
          backgroundColor: '#FFF',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: keyboardVisible ? 12 : safeAreaInsets.bottom || 12,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 16, minHeight: 44, maxHeight: 120, justifyContent: 'center' }}>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nhập câu hỏi..."
                placeholderTextColor="#94A3B8"
                style={{ fontSize: 15, color: '#0F172A', maxHeight: 100, lineHeight: 22 }}
                multiline
                maxLength={2000}
                returnKeyType="send"
                onSubmitEditing={() => !shouldDisableSend && sendMessage()}
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={shouldDisableSend}
              style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', opacity: shouldDisableSend ? 0.6 : 1, marginLeft: 8 }}
            >
              <LinearGradient colors={shouldDisableSend ? ['#94A3B8','#94A3B8'] : ['#3B82F6','#1D4ED8']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={18} color="#FFF" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Gavel size={12} color="#2563EB" />
              <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '500' }}>Tư vấn pháp lý AI</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>{inputText.length}/2000</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}