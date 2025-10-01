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
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Image
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

const { width: screenWidth } = Dimensions.get('window');

const API_BASE_URL = 'https://saigon247.au/chatbot';

class LawChatService {
  static async askQuestion(messages, onMessage) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let fullText = '';
      let lastProcessedIndex = 0;
      let buffer = '';
      
      console.log('Starting XHR SSE request for messages:', JSON.stringify(messages));
      
      xhr.open('POST', `${API_BASE_URL}/ask`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      // Handle response progress
      xhr.onprogress = (event) => {
        console.log('XHR progress event, loaded:', event.loaded);
        
        try {
          const responseText = xhr.responseText || '';
          const newData = responseText.substring(lastProcessedIndex);
          lastProcessedIndex = responseText.length;
          
          if (!newData.trim()) return;
          
          console.log('New data received:', newData);
          
          this.processSSEDataWithBuffer(newData, onMessage, (text) => {
            fullText = text;
          }, buffer);
          
        } catch (error) {
          console.error('Progress processing error:', error);
        }
      };
      
      xhr.onreadystatechange = () => {
        console.log('ReadyState changed:', xhr.readyState, 'Status:', xhr.status);
        
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            console.log('XHR completed successfully, full response length:', xhr.responseText?.length);
            
            const responseText = xhr.responseText || '';
            const remainingData = responseText.substring(lastProcessedIndex);
            
            if (remainingData.trim()) {
              console.log('Processing remaining data:', remainingData);
              this.processSSEDataWithBuffer(remainingData, onMessage, (text) => {
                fullText = text;
              }, buffer);
            }
            
            if (buffer.trim()) {
              console.log('Processing final buffer:', buffer);
              this.processBufferedData(buffer, onMessage, (text) => {
                fullText = text;
              });
            }
            
            resolve({ success: true, response: fullText });
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };
      
      xhr.onerror = (error) => {
        console.error('XHR error:', error);
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = () => {
        console.error('XHR timeout');
        reject(new Error('Request timeout'));
      };
      
      xhr.timeout = 60000;
      
      const payload = JSON.stringify({ messages });
      console.log('Sending XHR request with payload:', payload);
      
      try {
        xhr.send(payload);
      } catch (error) {
        console.error('XHR send error:', error);
        reject(new Error('Failed to send request'));
      }
    });
  }
  
  static processSSEDataWithBuffer(data, onMessage, onTextReceived, buffer) {
    try {
      buffer += data;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        console.log('Processing line:', trimmedLine);
        
        if (trimmedLine.startsWith('data: ')) {
          const sseData = trimmedLine.substring(6);
          
          console.log('SSE data extracted:', sseData);
          
          if (sseData === '[DONE]') {
            console.log('Stream end signal received');
            return true;
          }
          
          this.processSingleSSEMessage(sseData, onMessage, onTextReceived);
        }
      }
      
      return false;
    } catch (error) {
      console.error('SSE data processing error:', error);
      throw error;
    }
  }
  
  static processBufferedData(buffer, onMessage, onTextReceived) {
    try {
      const lines = buffer.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.startsWith('data: ')) {
          const sseData = trimmedLine.substring(6);
          this.processSingleSSEMessage(sseData, onMessage, onTextReceived);
        }
      }
    } catch (error) {
      console.error('Buffer processing error:', error);
    }
  }
  
  static processSingleSSEMessage(sseData, onMessage, onTextReceived) {
    try {
      if (!sseData || sseData === '[DONE]') {
        return;
      }
      
      if (!sseData.startsWith('{') || !sseData.endsWith('}')) {
        console.warn('Invalid JSON format, skipping:', sseData);
        return;
      }
      
      const json = JSON.parse(sseData);
      console.log('Parsed SSE JSON:', json);
      
      if (json.text || json.full_text) {
        const textToDisplay = json.full_text || json.text;
        const formattedText = this.formatTextForDisplay(textToDisplay);
        
        console.log('Formatted text:', formattedText);
        onTextReceived(formattedText);
        
        if (onMessage && json.text) {
          setTimeout(() => {
            onMessage(json.text);
          }, 5);
        }
      } else if (json.error) {
        throw new Error(json.error);
      }
    } catch (parseError) {
      console.warn('JSON parse error (skipping):', parseError.message, 'Raw data:', sseData);
    }
  }

  static formatTextForDisplay(text) {
    if (!text) return '';
    
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .trim();
  }

  static async testConnection() {
    try {
      console.log('Testing connection to:', `${API_BASE_URL}/test`);
      const response = await fetch(`${API_BASE_URL}/test`);
      const result = response.ok;
      console.log('Connection test result:', result);
      
      if (result) {
        const data = await response.json();
        console.log('Test response:', data);
      }
      
      return result;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }
}

// Responsive utilities
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scaleSize = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const scaleFont = (size) => Math.round(scaleSize(size));
const vw = (percent) => (SCREEN_WIDTH * percent) / 100;
const vh = (percent) => (SCREEN_HEIGHT * percent) / 100;
const spacing = (size) => scaleSize(size);

// Colors
export const COLORS = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  secondary: {
    50: '#FFFBEB',
    200: '#FDE68A',
    600: '#D97706',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },
  border: '#E2E8F0',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

// Typography
export const TYPOGRAPHY = {
  fonts: {
    bold: 'SFPro-Bold',
    medium: 'SFPro-Medium',
    regular: 'SFPro-Regular',
    light: 'SFPro-Light',
  },
  sizes: {
    xs: scaleFont(11),
    sm: scaleFont(13),
    base: scaleFont(15),
    lg: scaleFont(17),
    xl: scaleFont(19),
  }
};

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
  
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await LawChatService.testConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      } catch (error) {
        setConnectionStatus('connected');
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setShowQuickActions(false);
      Animated.timing(quickActionsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (messages.length <= 1) {
        setShowQuickActions(true);
        Animated.timing(quickActionsAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, [messages.length]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const startTyping = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const stopTyping = useCallback(() => {
    typingAnim.stopAnimation();
    typingAnim.setValue(0);
  }, []);

  const sendMessage = useCallback(async (text = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setInputText('');
    setShowQuickActions(false);
    setIsLoading(true);
    startTyping();

    const botMessageId = (Date.now() + 1).toString();
    const typingMessageId = (Date.now() + 2).toString();

    // Thêm typing message
    setMessages(prev => [
      ...prev,
      {
        id: typingMessageId,
        role: 'assistant',
        content: '',
        sender: 'bot',
        timestamp: new Date(),
        type: 'typing'
      }
    ]);

    try {
      console.log('Sending messages:', messages.map(msg => ({ role: msg.role, content: msg.content })));
      
      // Chuẩn bị payload với tin nhắn system và lịch sử chat
      const payload = [
        {
          role: 'system',
          content: 'Bạn là trợ lý AI pháp luật Việt Nam.'
        },
        ...messages.concat([userMessage]).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      let isFirstChunk = true;
      
      const result = await LawChatService.askQuestion(payload, (chunk) => {
        console.log('Received chunk:', chunk);
        
        if (isFirstChunk) {
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => msg.id !== typingMessageId);
            return [
              ...filteredMessages,
              {
                id: botMessageId,
                role: 'assistant',
                content: chunk,
                sender: 'bot',
                timestamp: new Date(),
                type: 'answer'
              }
            ];
          });
          isFirstChunk = false;
          stopTyping();
        } else {
          setMessages(prev =>
            prev.map(msg => {
              if (msg.id === botMessageId) {
                return {
                  ...msg,
                  content: msg.content + chunk
                };
              }
              return msg;
            })
          );
        }
      });

      if (result.response) {
        const finalFormattedText = LawChatService.formatTextForDisplay(result.response);
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, content: finalFormattedText }
              : msg
          )
        );
      }

      console.log('Question completed:', result);

    } catch (error) {
      console.error('Send message error:', error);
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.id !== typingMessageId);
        return [
          ...filteredMessages,
          {
            id: botMessageId,
            role: 'assistant',
            content: `Xin lỗi, đã xảy ra lỗi: ${error.message}. Vui lòng thử lại sau.`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'error'
          }
        ];
      });
    } finally {
      setIsLoading(false);
      stopTyping();
    }
  }, [inputText, isLoading, startTyping, stopTyping, messages]);

  const toggleMenu = useCallback(() => {
    setShowMenu(prev => {
      const newValue = !prev;
      Animated.timing(menuAnim, {
        toValue: newValue ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }).start();
      return newValue;
    });
  }, []);

  const clearChat = useCallback(() => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử tư vấn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: 'Xin chào! Tôi là AI Tư vấn Luật Việt Nam. Tôi có thể giúp bạn giải đáp các vấn đề pháp lý dựa trên các Bộ luật hiện hành. Bạn có câu hỏi gì về luật pháp không?',
                sender: 'bot',
                timestamp: new Date(),
                type: 'welcome'
              }
            ]);
            setShowMenu(false);
            setShowQuickActions(true);
          }
        },
      ]
    );
  }, []);

  const copyMessage = useCallback((content) => {
    Alert.alert('Đã sao chép', 'Nội dung đã được sao chép vào clipboard');
  }, []);

  const handleQuickQuestion = useCallback((question) => {
    setShowQuickActions(false);
    sendMessage(question);
  }, [sendMessage]);

  const renderMessage = useCallback((message) => {
    const isBot = message.sender === 'bot';
    const isWelcome = message.type === 'welcome';
    const isTyping = message.type === 'typing';
    const isError = message.type === 'error';
    const isStreaming = message.type === 'answer' && isLoading;
    
    if (isTyping) {
      return (
        <Animated.View 
          key={message.id} 
          style={[
            styles.messageContainer, 
            styles.botContainer,
            {
              opacity: typingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              })
            }
          ]}
        >
          <View style={styles.botAvatar}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 30,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#007AFF',
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 27.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: "relative"
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require('../assets/icon_app.png')}
                  style={{
                    width: 40,
                    height: 40,
                    position: 'absolute',
                    top: 0
                  }}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
          </View>
          <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
            <View style={styles.typingContainer}>
              <View style={styles.typingDots}>
                {[0, 1, 2].map((index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        opacity: typingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                        transform: [{
                          scale: typingAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          })
                        }]
                      }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.typingText, { fontFamily: TYPOGRAPHY.fonts.regular }]}>
                AI đang suy nghĩ...
              </Text>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isBot ? styles.botContainer : styles.userContainer
      ]}>
        {isBot && (
          <View style={[
            styles.botAvatar, 
            isWelcome && styles.welcomeAvatar,
            isError && styles.errorAvatar
          ]}>
            {isWelcome ? (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 30,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowRadius: 10,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={['#007AFF', '#00C6FF']}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 27.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    position: "relative"
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require('../assets/icon_app.png')}
                  style={{
                    width: 40,
                    height: 40,
                    position: 'absolute',
                    top: 0
                  }}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            ) : isError ? (
              <AlertCircle size={16} color={COLORS.error} />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 30,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowRadius: 10,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={['#007AFF', '#00C6FF']}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 27.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    position: "relative"
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={require('../assets/icon_app.png')}
                    style={{
                      width: 40,
                      height: 40,
                      position: 'absolute',
                      top: 0
                    }}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble,
          isWelcome && styles.welcomeBubble,
          isError && styles.errorBubble,
          isStreaming && styles.streamingBubble
        ]}>
          <View style={styles.textContainer}>
            <Text style={[
              styles.messageText,
              { fontFamily: TYPOGRAPHY.fonts.regular },
              isBot ? styles.botText : styles.userText,
              isError && styles.errorText
            ]}>
              {message.content}
            </Text>
            {isStreaming && (
              <Animated.View
                style={[
                  styles.cursor,
                  {
                    opacity: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    })
                  }
                ]}
              />
            )}
          </View>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timeText,
              { fontFamily: TYPOGRAPHY.fonts.light },
              isBot ? styles.botTime : styles.userTime
            ]}>
              {message.timestamp.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {isBot && !isWelcome && (
              <TouchableOpacity
                onPress={() => copyMessage(message.content)}
                style={styles.actionBtn}
              >
                <Copy size={12} color={COLORS.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {!isBot && (
          <View style={styles.userAvatar}>
            <User size={16} color={COLORS.text.inverse} />
          </View>
        )}
      </View>
    );
  }, [copyMessage, typingAnim, isLoading]);

  const renderQuickActions = useCallback(() => {
    if (!showQuickActions) return null;

    return (
      <Animated.View 
        style={[
          styles.quickActionsContainer,
          {
            opacity: quickActionsAnim,
            transform: [{
              translateY: quickActionsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        <Text style={[styles.quickTitle, { fontFamily: TYPOGRAPHY.fonts.medium }]}>
          Câu hỏi thường gặp
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScrollContent}
        >
          {QUICK_QUESTIONS.map((question, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleQuickQuestion(question)}
              style={styles.quickQuestionCard}
              disabled={isLoading}
            >
              <HelpCircle size={16} color={COLORS.primary[600]} />
              <Text style={[styles.quickQuestionText, { fontFamily: TYPOGRAPHY.fonts.medium }]}>
                {question}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  }, [showQuickActions, quickActionsAnim, handleQuickQuestion, isLoading]);

  const shouldDisableSend = isLoading || !inputText.trim();

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? safeAreaInsets.bottom : 0}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ChevronLeft size={20} color={COLORS.primary[600]} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 30,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#007AFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 27.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: "relative"
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require('../assets/icon_app.png')}
                  style={{
                    width: 40,
                    height: 40,
                    position: 'absolute',
                    top: 0
                  }}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            
            <View style={styles.headerText}>
              <Text style={[styles.title, { fontFamily: TYPOGRAPHY.fonts.bold }]}>
                AI Tư vấn Luật 
              </Text>
              <View style={styles.statusRow}>
                <View style={[
                  styles.onlineDot, 
                  connectionStatus === 'connected' ? styles.connectedDot : styles.disconnectedDot,
                  isLoading && styles.loadingDot
                ]} />
                <Text style={[styles.status, { fontFamily: TYPOGRAPHY.fonts.regular }]}>
                  {isLoading ? 'Đang xử lý...' : 'Sẵn sàng hỗ trợ'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={toggleMenu}
            style={styles.menuBtn}
          >
            <MoreVertical size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {showMenu && (
          <Animated.View 
            style={[
              styles.menu,
              {
                opacity: menuAnim,
                transform: [{
                  scale: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  })
                }]
              }
            ]}
          >
            <BlurView intensity={100} style={styles.blurMenu}>
              <TouchableOpacity 
                onPress={clearChat}
                style={styles.menuItem}
              >
                <Trash2 size={16} color={COLORS.error} />
                <Text style={[styles.menuText, { fontFamily: TYPOGRAPHY.fonts.medium }]}>
                  Xóa cuộc trò chuyện
                </Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                onPress={() => setShowMenu(false)}
                style={styles.menuItem}
              >
                <Share2 size={16} color={COLORS.primary[600]} />
                <Text style={[styles.menuText, { fontFamily: TYPOGRAPHY.fonts.medium, color: COLORS.primary[600] }]}>
                  Chia sẻ cuộc trò chuyện
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: safeAreaInsets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {messages.map(renderMessage)}
          
          {messages.length > 1 && (
            <View style={styles.disclaimerContainer}>
              <AlertCircle size={14} color={COLORS.warning} />
              <Text style={[styles.disclaimerText, { fontFamily: TYPOGRAPHY.fonts.regular }]}>
                Thông tin do AI trả lời chỉ mang tính chất tham khảo. Vui lòng tham khảo chuyên gia pháp luật để được tư vấn chính xác.
              </Text>
            </View>
          )}
        </ScrollView>

        {renderQuickActions()}

        <View style={[styles.inputSection, { paddingBottom: safeAreaInsets.bottom + 12 }]}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nhập câu hỏi về luật pháp..."
                placeholderTextColor={COLORS.text.tertiary}
                style={[styles.input, { fontFamily: TYPOGRAPHY.fonts.regular }]}
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
              style={[
                styles.sendBtn,
                shouldDisableSend && styles.sendBtnDisabled
              ]}
            >
              <LinearGradient
                colors={shouldDisableSend ? 
                  [COLORS.text.tertiary, COLORS.text.tertiary] : 
                  [COLORS.primary[500], COLORS.primary[700]]
                }
                style={styles.sendGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.text.inverse} />
                ) : (
                  <Send 
                    size={18} 
                    color={shouldDisableSend ? COLORS.text.secondary : COLORS.text.inverse} 
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputFooter}>
            <View style={styles.inputStats}>
              <Gavel size={12} color={COLORS.primary[600]} />
              <Text style={[styles.statsText, { fontFamily: TYPOGRAPHY.fonts.medium }]}>
                Tư vấn pháp lý AI
              </Text>
            </View>
            
            <Text style={[styles.charCount, { fontFamily: TYPOGRAPHY.fonts.light }]}>
              {inputText.length}/2000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Styles
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing(12),
    gap: spacing(6)
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.text.primary,
    lineHeight: scaleFont(19)
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: scaleSize(4),
    backgroundColor: COLORS.success,
    marginRight: spacing(6),
  },
  connectedDot: {
    backgroundColor: COLORS.success,
  },
  disconnectedDot: {
    backgroundColor: COLORS.error,
  },
  loadingDot: {
    backgroundColor: COLORS.warning,
  },
  status: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
  },
  menuBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: scaleSize(70),
    right: spacing(16),
    borderRadius: scaleSize(16),
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  blurMenu: {
    borderRadius: scaleSize(16),
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(16),
    minWidth: scaleSize(200),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: spacing(16),
  },
  menuText: {
    marginLeft: spacing(12),
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.error,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing(16),
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing(16),
    alignItems: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    backgroundColor: COLORS.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(10),
    marginBottom: spacing(4),
  },
  welcomeAvatar: {
    backgroundColor: COLORS.primary[100],
    borderRadius: scaleSize(100)
  },
  errorAvatar: {
    backgroundColor: COLORS.error + '20',
  },
  userAvatar: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing(10),
    marginBottom: spacing(4),
  },
  messageBubble: {
    maxWidth: vw(75),
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderRadius: scaleSize(20),
  },
  botBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: scaleSize(6),
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  welcomeBubble: {
    backgroundColor: COLORS.secondary[50],
    borderColor: COLORS.secondary[200],
  },
  errorBubble: {
    backgroundColor: COLORS.error + '10',
    borderColor: COLORS.error + '30',
  },
  streamingBubble: {
    backgroundColor: COLORS.surface,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  cursor: {
    width: scaleSize(2),
    height: scaleSize(16),
    backgroundColor: COLORS.primary[600],
    marginLeft: spacing(2),
    borderRadius: scaleSize(1),
  },
  userBubble: {
    backgroundColor: COLORS.primary[600],
    borderBottomRightRadius: scaleSize(6),
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: scaleFont(22),
    marginBottom: spacing(6),
    opacity: 1,
  },
  botText: {
    color: COLORS.text.primary,
  },
  userText: {
    color: COLORS.text.inverse,
  },
  errorText: {
    color: COLORS.error,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  botTime: {
    color: COLORS.text.secondary,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionBtn: {
    padding: spacing(4),
  },
  typingBubble: {
    paddingVertical: spacing(12),
  },
  typingContainer: {
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(4),
  },
  dot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: COLORS.primary[600],
    marginHorizontal: spacing(2),
  },
  typingText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
  },
  quickActionsContainer: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  quickTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.primary,
    marginBottom: spacing(12),
  },
  quickScrollContent: {
    gap: spacing(8),
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(8),
    borderRadius: scaleSize(16),
    borderColor: COLORS.primary[200],
    maxWidth: vw(80),
    gap: spacing(8),
  },
  quickQuestionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary[700],
    flexShrink: 1,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '10',
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(8),
    borderRadius: scaleSize(12),
    marginTop: spacing(16),
    gap: spacing(8),
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: scaleFont(16),
  },
  inputSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(8),
  },
  inputContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: scaleSize(8),
    paddingHorizontal: spacing(16),
    marginRight: spacing(8),
    minHeight: scaleSize(44),
    maxHeight: scaleSize(120),
    justifyContent: 'center',
  },
  input: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text.primary,
    maxHeight: scaleSize(100),
    lineHeight: scaleFont(22),
  },
  sendBtn: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(22),
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  statsText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary[600],
  },
  charCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.tertiary,
  },
});