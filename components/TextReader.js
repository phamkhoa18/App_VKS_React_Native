// SimpleGoogleTextReader.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet
} from 'react-native';
import Slider from '@react-native-community/slider';
import GoogleTTSService from '../services/GoogleTTSService';
import {
  Pause,
  Play,
  X,
  RotateCcw,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react-native';
import Constants from 'expo-constants';

export default function SimpleGoogleTextReader({
  content = '',
  onClose = () => {},
}) {
  const googleApiKey = Constants.expoConfig?.extra?.API_GOOGLE_SPEED;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-Wavenet-A');
  const [audioCache, setAudioCache] = useState(new Map());

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  
  const intervalRef = useRef(null);
  const isSeekingRef = useRef(false);
  const startTimeRef = useRef(0);
  const isMountedRef = useRef(true);
  const googleTTSRef = useRef(null);

  useEffect(() => {
    if (googleApiKey) {
      googleTTSRef.current = new GoogleTTSService(googleApiKey);
      googleTTSRef.current.onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded && status.durationMillis) {
          const progressValue = status.positionMillis / status.durationMillis;
          if (!isSeekingRef.current) {
            setProgress(progressValue);
          }
        }
      };
    } else {
      console.warn('Google API key not found');
      Alert.alert('Lỗi', 'Không tìm thấy Google API key. Vui lòng kiểm tra cấu hình.');
    }
  }, [googleApiKey]);

  useEffect(() => {
    if (content && content.length > 0) {
      const wordCount = content.trim().split(/\s+/).length;
      const wordsPerMinute = 180 * speed;
      const estimatedMs = (wordCount / wordsPerMinute) * 60 * 1000;
      setDuration(estimatedMs);
    }
  }, [content, speed]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stopSpeech();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const chunkText = useCallback((text, maxLength = 4000) => {
    if (text.length <= maxLength) return [text];
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }, []);

  const playWithGoogleTTS = useCallback(async (text, startProgress = 0) => {
    if (!googleTTSRef.current) {
      Alert.alert('Lỗi', 'Google TTS không khả dụng');
      return false;
    }

    try {
      setIsLoading(true);
      const startIndex = Math.floor(text.length * startProgress);
      const textToRead = text.slice(startIndex);
      const cacheKey = `${textToRead.substring(0, 100)}-${selectedVoice}-${speed}`;
      let audioContent = audioCache.get(cacheKey);
      
      if (!audioContent) {
        audioContent = await googleTTSRef.current.synthesizeText(textToRead, {
          voiceName: selectedVoice,
          speakingRate: speed,
          pitch: 0,
          volumeGainDb: 2.0
        });
        
        setAudioCache(prev => new Map(prev).set(cacheKey, audioContent));
        console.log('Audio cached successfully');
      } else {
        console.log('Using cached audio');
      }

      setIsLoading(false);

      await googleTTSRef.current.playAudio(audioContent, {
        onStart: () => {
          if (isMountedRef.current) {
            console.log('Google TTS playback started');
            setIsSpeaking(true);
            startTimeRef.current = Date.now() - (startProgress * duration);
            startProgressTracking();
          }
        },
        onComplete: () => {
          if (isMountedRef.current) {
            console.log('Google TTS playback completed');
            handleSpeechComplete();
          }
        },
        onError: (error) => {
          console.error('Google TTS playback error:', error);
          if (isMountedRef.current) {
            setIsLoading(false);
            setIsSpeaking(false);
            Alert.alert('Lỗi', `Không thể phát âm thanh: ${error.message}`);
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Google TTS error:', error);
      setIsLoading(false);
      if (isMountedRef.current) {
        Alert.alert('Lỗi', `Google TTS error: ${error.message}`);
      }
      return false;
    }
  }, [selectedVoice, speed, audioCache, duration]);

  const startSpeech = useCallback(async (startProgress = 0) => {
    if (!content || content.length === 0) {
      Alert.alert('Thông báo', 'Không có nội dung để đọc');
      return;
    }

    if (!googleApiKey) {
      Alert.alert('Lỗi', 'Không tìm thấy Google API key');
      return;
    }
    await playWithGoogleTTS(content, startProgress);
  }, [content, googleApiKey, playWithGoogleTTS]);

  const stopSpeech = useCallback(async () => {
    try {
      console.log('Stopping speech');
      if (googleTTSRef.current) {
        await googleTTSRef.current.stopAudio();
      }
      
      if (isMountedRef.current) {
        setIsSpeaking(false);
        stopProgressTracking();
      }
    } catch (error) {
      console.error('Stop speech error:', error);
    }
  }, []);

  const handleSpeechComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log('Speech completed');
    setIsSpeaking(false);
    setProgress(1);
    stopProgressTracking();
  }, []);

  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        stopProgressTracking();
        return;
      }
      
      if (!isSeekingRef.current && startTimeRef.current > 0) {
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.min(elapsed / duration, 1);
        
        if (!googleTTSRef.current?.isPlaying) {
          setProgress(newProgress);
        }
        
        if (newProgress >= 0.99) {
          handleSpeechComplete();
        }
      }
    }, 100);
  }, [duration, handleSpeechComplete]);

  const stopProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      const startProgress = progress >= 1 ? 0 : progress;
      if (progress >= 1) {
        setProgress(0);
      }
      setTimeout(() => startSpeech(startProgress), 100);
    }
  }, [isSpeaking, progress, stopSpeech, startSpeech]);

  const cycleVoice = useCallback(() => {
    const voices = GoogleTTSService.getVietnameseVoices();
    const currentIndex = voices.findIndex(v => v.name === selectedVoice);
    const nextIndex = (currentIndex + 1) % voices.length;
    setSelectedVoice(voices[nextIndex].name);
    
    setAudioCache(new Map());
    
    if (isSpeaking) {
      setTimeout(async () => {
        await stopSpeech();
        setTimeout(() => startSpeech(progress), 200);
      }, 100);
    }
  }, [selectedVoice, isSpeaking, progress, stopSpeech, startSpeech]);

  const adjustSpeed = useCallback(() => {
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speedOptions.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    
    setSpeed(newSpeed);
    setAudioCache(new Map());
    
    if (isSpeaking) {
      setTimeout(async () => {
        await stopSpeech();
        setTimeout(() => startSpeech(progress), 200);
      }, 100);
    }
  }, [speed, isSpeaking, progress, stopSpeech, startSpeech]);

  const formatTime = useCallback((ms) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getStatusText = useCallback(() => {
    if (isLoading) return 'Đang tải...';
    if (isSpeaking) return 'Đang phát (AI Voice)';
    if (progress >= 1) return 'Hoàn thành';
    if (progress > 0) return 'Đã tạm dừng';
    return 'Sẵn sàng (AI Voice)';
  }, [isSpeaking, progress, isLoading]);

  const getCurrentVoiceName = useCallback(() => {
    const voices = GoogleTTSService.getVietnameseVoices();
    const voice = voices.find(v => v.name === selectedVoice);
    return voice ? voice.description : 'Giọng mặc định';
  }, [selectedVoice]);

  if (!content || content.length === 0) {
    return null;
  }

  if (!googleApiKey) {
    return (
      <View className="bg-red-50 rounded-2xl shadow-lg mx-8 mb-10 shadow-[#32325D] shadow-opacity-20">
        <View className="flex-row justify-between items-center px-5 py-5">
          <Text className="text-red-600 font-medium text-lg">
            Không tìm thấy Google API key
          </Text>
          <TouchableOpacity onPress={onClose} className="ml-2">
            <X size={28} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
  className="bg-white rounded-xl shadow-sm mx-auto mb-10"
  style={[
    styles.speechCard,
    {
      width: isTablet ? 400 : '90%',
      maxWidth: 400,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  ]}
>
  {/* Header */}
  <View className="flex-row items-center justify-between">
    <View className="flex-row items-center gap-3">
      <TouchableOpacity onPress={toggleSpeech} disabled={isLoading} style={{ opacity: isLoading ? 0.5 : 1 }}>
        <View className="relative">
          <Image
            source={require('../assets/icon.png')}
            className="w-9 h-9 rounded-md"
          />
          <View className="absolute inset-0 rounded-md bg-black/30 flex items-center justify-center">
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : isSpeaking ? (
              <Pause size={18} color="white" />
            ) : (
              <Play size={18} color="white" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View>
        <Text style={styles.cardTitle} className="font-sf-medium text-gray-800">
          {getStatusText()}
        </Text>
        <Text style={styles.cardSubtitle} className="text-gray-500 text-xs mt-0.5">
          {getCurrentVoiceName()}
        </Text>
      </View>
    </View>

    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={adjustSpeed}
        className="rounded-md bg-gray-100 px-2 py-1"
      >
        <Text style={styles.cardSpeedText} className="font-sf-semibold text-black text-sm">
          {speed}x
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        {expanded ? (
          <ChevronDown size={22} color="#6B7280" strokeWidth={2} />
        ) : (
          <ChevronUp size={22} color="#6B7280" strokeWidth={2} />
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose}>
        <X size={22} color="#6B7280" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  </View>

  {/* Expanded Section */}
  {expanded && (
    <View className="mt-3">
      <View className="flex-row items-center justify-between border-b border-gray-100 pb-3 mb-3">
        <TouchableOpacity onPress={cycleVoice} className="flex-row items-center gap-1.5">
          <Settings size={16} color="#6B7280" strokeWidth={2} />
          <Text style={styles.cardActionText} className="text-gray-600 text-sm">
            Thay đổi giọng
          </Text>
        </TouchableOpacity>
        <Text className="text-gray-500 text-xs">Đã lưu: {audioCache.size} đoạn</Text>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <TouchableOpacity onPress={() => {
          stopSpeech();
          setProgress(0);
          setTimeout(() => startSpeech(0), 150);
        }}>
          <RotateCcw size={22} color="#111827" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleSpeech}
          disabled={isLoading}
          style={{
            backgroundColor: '#111827',
            padding: 10,
            borderRadius: 9999,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : isSpeaking ? (
            <Pause size={20} color="white" />
          ) : (
            <Play size={20} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          const newProgress = Math.min(progress + 0.1, 1);
          stopSpeech();
          setProgress(newProgress);
          if (newProgress < 1) setTimeout(() => startSpeech(newProgress), 150);
        }}>
          <RotateCw size={22} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-500 text-xs">{formatTime(progress * duration)}</Text>
        <Text className="text-gray-500 text-xs">{formatTime(duration)}</Text>
      </View>

      <Slider
        style={{ width: '100%', height: 32 }}
        minimumValue={0}
        maximumValue={1}
        value={progress}
        minimumTrackTintColor="#3B82F6"
        maximumTrackTintColor="rgba(0,0,0,0.08)"
        thumbTintColor="#3B82F6"
        disabled={isLoading}
        onSlidingStart={() => {
          isSeekingRef.current = true;
          stopSpeech();
        }}
        onSlidingComplete={(value) => {
          const newProgress = Math.min(Math.max(value, 0), 1);
          setProgress(newProgress);
          isSeekingRef.current = false;
          if (newProgress < 0.99) setTimeout(() => startSpeech(newProgress), 150);
        }}
      />

      <Text className="text-gray-400 text-center text-xs mt-2">
        {content.trim().split(/\s+/).length} từ • {Math.round(progress * 100)}% hoàn thành
      </Text>
    </View>
  )}
</View>

  );
}

const styles = StyleSheet.create({
  speechCard: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  cardSpeedText: {
    fontSize: 13,
  },
  cardActionText: {
    fontSize: 13,
  },
    bottomBarContent: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
  },
});
