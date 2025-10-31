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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = 'https://saigon247.au/chatbot';

class LawChatService {
  static async askQuestion(messages, onMessage) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let fullText = '';
      let lastProcessedIndex = 0;
      let buffer = '';
      
      xhr.open('POST', `${API_BASE_URL}/ask`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      xhr.onprogress = (event) => {
        try {
          const responseText = xhr.responseText || '';
          const newData = responseText.substring(lastProcessedIndex);
          lastProcessedIndex = responseText.length;
          
          if (!newData.trim()) return;
          
          this.processSSEDataWithBuffer(newData, onMessage, (text) => {
            fullText = text;
          }, buffer);
        } catch (error) {
          console.error('Progress processing error:', error);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            const responseText = xhr.responseText || '';
            const remainingData = responseText.substring(lastProcessedIndex);
            
            if (remainingData.trim()) {
              this.processSSEDataWithBuffer(remainingData, onMessage, (text) => {
                fullText = text;
              }, buffer);
            }
            
            if (buffer.trim()) {
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
      
      xhr.onerror = () => reject(new Error('Network error occurred'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      xhr.timeout = 60000;
      
      try {
        xhr.send(JSON.stringify({ messages }));
      } catch (error) {
        reject(new Error('Failed to send request'));
      }
    });
  }
  
  static processSSEDataWithBuffer(data, onMessage, onTextReceived, buffer) {
    buffer += data;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.startsWith('data: ')) {
        const sseData = trimmedLine.substring(6);
        if (sseData === '[DONE]') return true;
        this.processSingleSSEMessage(sseData, onMessage, onTextReceived);
      }
    }
    
    return false;
  }
  
  static processBufferedData(buffer, onMessage, onTextReceived) {
    const lines = buffer.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      if (trimmedLine.startsWith('data: ')) {
        const sseData = trimmedLine.substring(6);
        this.processSingleSSEMessage(sseData, onMessage, onTextReceived);
      }
    }
  }
  
  static processSingleSSEMessage(sseData, onMessage, onTextReceived) {
    try {
      if (!sseData || sseData === '[DONE]') return;
      if (!sseData.startsWith('{') || !sseData.endsWith('}')) return;
      
      const json = JSON.parse(sseData);
      if (json.text || json.full_text) {
        const textToDisplay = json.full_text || json.text;
        const formattedText = this.formatTextForDisplay(textToDisplay);
        onTextReceived(formattedText);
        if (onMessage && json.text) {
          setTimeout(() => onMessage(json.text), 5);
        }
      } else if (json.error) {
        throw new Error(json.error);
      }
    } catch (error) {
      console.warn('JSON parse error (skipping):', error.message);
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
      const response = await fetch(`${API_BASE_URL}/test`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

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
      const isConnected = await LawChatService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
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
                return { ...msg, content: msg.content + chunk };
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
    } catch (error) {
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
          style={{
            flexDirection: 'row',
            marginBottom: 16,
            justifyContent: 'flex-start',
            opacity: typingAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1]
            })
          }}
        >
          <View style={{
            width: SCREEN_WIDTH < 768 ? 36 : 40,
            height: SCREEN_WIDTH < 768 ? 36 : 40,
            borderRadius: SCREEN_WIDTH < 768 ? 18 : 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            marginBottom: 4,
            backgroundColor: '#DBEAFE'
          }}>
            <LinearGradient
              colors={['#007AFF', '#00C6FF']}
              style={{
                width: SCREEN_WIDTH < 768 ? 36 : 40,
                height: SCREEN_WIDTH < 768 ? 36 : 40,
                borderRadius: SCREEN_WIDTH < 768 ? 18 : 20,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image
                source={require('../assets/icon_app.png')}
                style={{
                  width: SCREEN_WIDTH < 768 ? 36 : 40,
                  height: SCREEN_WIDTH < 768 ? 36 : 40,
                  position: 'absolute',
                  top: 0
                }}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>
          <View style={{
            maxWidth: SCREEN_WIDTH < 768 ? SCREEN_WIDTH * 0.75 : SCREEN_WIDTH * 0.65,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 20,
            borderBottomLeftRadius: 6,
            backgroundColor: '#FFFFFF'
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                {[0, 1, 2].map((index) => (
                  <Animated.View
                    key={index}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#3B82F6',
                      marginHorizontal: 2,
                      opacity: typingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1]
                      }),
                      transform: [{
                        scale: typingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2]
                        })
                      }]
                    }}
                  />
                ))}
              </View>
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 11 : 13, color: '#64748B' }}>
                AI đang suy nghĩ...
              </Text>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    return (
      <View key={message.id} style={{
        flexDirection: 'row',
        marginBottom: 16,
        justifyContent: isBot ? 'flex-start' : 'flex-end'
      }}>
        {isBot && (
          <View style={{
            width: SCREEN_WIDTH < 768 ? 36 : 40,
            height: SCREEN_WIDTH < 768 ? 36 : 40,
            borderRadius: SCREEN_WIDTH < 768 ? 18 : 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            marginBottom: 4,
            backgroundColor: isWelcome ? '#DBEAFE' : isError ? '#EF444420' : '#DBEAFE'
          }}>
            {isWelcome || !isError ? (
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={{
                  width: SCREEN_WIDTH < 768 ? 36 : 40,
                  height: SCREEN_WIDTH < 768 ? 36 : 40,
                  borderRadius: SCREEN_WIDTH < 768 ? 18 : 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require('../assets/icon_app.png')}
                  style={{
                    width: SCREEN_WIDTH < 768 ? 36 : 40,
                    height: SCREEN_WIDTH < 768 ? 36 : 40,
                    position: 'absolute',
                    top: 0
                  }}
                  resizeMode="contain"
                />
              </LinearGradient>
            ) : (
              <AlertCircle size={SCREEN_WIDTH < 768 ? 16 : 18} color="#EF4444" />
            )}
          </View>
        )}
        
        <View style={{
          maxWidth: SCREEN_WIDTH < 768 ? SCREEN_WIDTH * 0.75 : SCREEN_WIDTH * 0.65,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 20,
          backgroundColor: isBot ? (isWelcome ? '#FFFBEB' : isError ? '#EF444410' : '#FFFFFF') : '#2563EB',
          borderBottomLeftRadius: isBot ? 6 : 20,
          borderBottomRightRadius: isBot ? 20 : 6
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Text style={{
              fontSize: SCREEN_WIDTH < 768 ? 15 : 17,
              lineHeight: SCREEN_WIDTH < 768 ? 22 : 24,
              marginBottom: 6,
              color: isBot ? (isError ? '#EF4444' : '#0F172A') : '#FFFFFF'
            }}>
              {message.content}
            </Text>
            {isStreaming && (
              <Animated.View style={{
                width: 2,
                height: 16,
                backgroundColor: '#3B82F6',
                marginLeft: 2,
                borderRadius: 1,
                opacity: typingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1]
                })
              }}/>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{
              fontSize: SCREEN_WIDTH < 768 ? 11 : 13,
              color: isBot ? '#64748B' : 'rgba(255, 255, 255, 0.7)'
            }}>
              {message.timestamp.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {isBot && !isWelcome && (
              <TouchableOpacity
                onPress={() => copyMessage(message.content)}
                style={{ padding: 4 }}
              >
                <Copy size={SCREEN_WIDTH < 768 ? 12 : 14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {!isBot && (
          <View style={{
            width: SCREEN_WIDTH < 768 ? 36 : 40,
            height: SCREEN_WIDTH < 768 ? 36 : 40,
            borderRadius: SCREEN_WIDTH < 768 ? 18 : 20,
            backgroundColor: '#2563EB',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
            marginBottom: 4
          }}>
            <User size={SCREEN_WIDTH < 768 ? 16 : 18} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  }, [copyMessage, typingAnim, isLoading]);

  const renderQuickActions = useCallback(() => {
    if (!showQuickActions) return null;

    return (
      <Animated.View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        opacity: quickActionsAnim,
        transform: [{
          translateY: quickActionsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}>
        <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 13 : 15, color: '#0F172A', marginBottom: 12, fontWeight: '500' }}>
          Câu hỏi thường gặp
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {QUICK_QUESTIONS.map((question, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleQuickQuestion(question)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EFF6FF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                maxWidth: SCREEN_WIDTH < 768 ? SCREEN_WIDTH * 0.8 : SCREEN_WIDTH * 0.7,
                gap: 8
              }}
              disabled={isLoading}
            >
              <HelpCircle size={SCREEN_WIDTH < 768 ? 16 : 18} color="#2563EB" />
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 13 : 15, color: '#1D4ED8', fontWeight: '500' }}>
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: safeAreaInsets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? safeAreaInsets.bottom : 0}
        style={{ flex: 1 }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0'
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: SCREEN_WIDTH < 768 ? 40 : 44,
              height: SCREEN_WIDTH < 768 ? 40 : 44,
              borderRadius: SCREEN_WIDTH < 768 ? 20 : 22,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={SCREEN_WIDTH < 768 ? 20 : 22} color="#2563EB" />
          </TouchableOpacity>
          
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 12,
            gap: 6
          }}>
            <View style={{
              width: SCREEN_WIDTH < 768 ? 40 : 44,
              height: SCREEN_WIDTH < 768 ? 40 : 44,
              borderRadius: SCREEN_WIDTH < 768 ? 20 : 22,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={{
                  width: SCREEN_WIDTH < 768 ? 40 : 44,
                  height: SCREEN_WIDTH < 768 ? 40 : 44,
                  borderRadius: SCREEN_WIDTH < 768 ? 20 : 22,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require('../assets/icon_app.png')}
                  style={{
                    width: SCREEN_WIDTH < 768 ? 40 : 44,
                    height: SCREEN_WIDTH < 768 ? 40 : 44,
                    position: 'absolute',
                    top: 0
                  }}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 17 : 19, color: '#0F172A', fontWeight: 'bold' }}>
                AI Tư vấn Luật
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isLoading ? '#F59E0B' : connectionStatus === 'connected' ? '#10B981' : '#EF4444',
                  marginRight: 6
                }}/>
                <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 13 : 15, color: '#10B981' }}>
                  {isLoading ? 'Đang xử lý...' : 'Sẵn sàng hỗ trợ'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={toggleMenu}
            style={{
              width: SCREEN_WIDTH < 768 ? 40 : 44,
              height: SCREEN_WIDTH < 768 ? 40 : 44,
              borderRadius: SCREEN_WIDTH < 768 ? 20 : 22,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MoreVertical size={SCREEN_WIDTH < 768 ? 18 : 20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {showMenu && (
          <Animated.View style={{
            position: 'absolute',
            top: SCREEN_WIDTH < 768 ? 70 : 80,
            right: 16,
            borderRadius: 16,
            overflow: 'hidden',
            opacity: menuAnim,
            transform: [{
              scale: menuAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
              })
            }]
          }}>
            <BlurView intensity={100} style={{ borderRadius: 16, overflow: 'hidden' }}>
              <TouchableOpacity 
                onPress={clearChat}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  minWidth: 200,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                <Trash2 size={SCREEN_WIDTH < 768 ? 16 : 18} color="#EF4444" />
                <Text style={{ marginLeft: 12, fontSize: SCREEN_WIDTH < 768 ? 15 : 17, color: '#EF4444', fontWeight: '500' }}>
                  Xóa cuộc trò chuyện
                </Text>
              </TouchableOpacity>
              
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 }}/>
              
              <TouchableOpacity 
                onPress={() => setShowMenu(false)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  minWidth: 200,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                <Share2 size={SCREEN_WIDTH < 768 ? 16 : 18} color="#2563EB" />
                <Text style={{ marginLeft: 12, fontSize: SCREEN_WIDTH < 768 ? 15 : 17, color: '#2563EB', fontWeight: '500' }}>
                  Chia sẻ cuộc trò chuyện
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: safeAreaInsets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {messages.map(renderMessage)}
          
          {messages.length > 1 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F59E0B10',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              marginTop: 16,
              gap: 8
            }}>
              <AlertCircle size={SCREEN_WIDTH < 768 ? 14 : 16} color="#F59E0B" />
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#64748B', flex: 1, lineHeight: SCREEN_WIDTH < 768 ? 16 : 18 }}>
                Thông tin do AI trả lời chỉ mang tính chất tham khảo. Vui lòng tham khảo chuyên gia pháp luật để được tư vấn chính xác.
              </Text>
            </View>
          )}
        </ScrollView>

        {renderQuickActions()}

        <View style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: safeAreaInsets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#F1F5F9',
              borderRadius: 8,
              paddingHorizontal: 16,
              minHeight: SCREEN_WIDTH < 768 ? 44 : 48,
              maxHeight: 120,
              justifyContent: 'center'
            }}>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nhập câu hỏi về luật pháp..."
                placeholderTextColor="#94A3B8"
                style={{
                  fontSize: SCREEN_WIDTH < 768 ? 15 : 17,
                  color: '#0F172A',
                  maxHeight: 100,
                  lineHeight: SCREEN_WIDTH < 768 ? 22 : 24
                }}
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
              style={{
                width: SCREEN_WIDTH < 768 ? 40 : 44,
                height: SCREEN_WIDTH < 768 ? 40 : 44,
                borderRadius: SCREEN_WIDTH < 768 ? 20 : 22,
                overflow: 'hidden',
                opacity: shouldDisableSend ? 0.6 : 1
              }}
            >
              <LinearGradient
                colors={shouldDisableSend ? ['#94A3B8', '#94A3B8'] : ['#3B82F6', '#1D4ED8']}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={SCREEN_WIDTH < 768 ? 18 : 20} color={shouldDisableSend ? '#64748B' : '#FFFFFF'} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Gavel size={SCREEN_WIDTH < 768 ? 12 : 14} color="#2563EB" />
              <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#2563EB', fontWeight: '500' }}>
                Tư vấn pháp lý AI
              </Text>
            </View>
            
            <Text style={{ fontSize: SCREEN_WIDTH < 768 ? 12 : 14, color: '#94A3B8' }}>
              {inputText.length}/2000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}