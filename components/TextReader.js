import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { scaleSize, scaleFont, spacing } from '../utils/responsive';
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
  // Get Google API key from environment
  const googleApiKey = Constants.expoConfig?.extra?.API_GOOGLE_SPEED;

  // State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-Wavenet-A');
  const [audioCache, setAudioCache] = useState(new Map());
  
  // Refs
  const intervalRef = useRef(null);
  const isSeekingRef = useRef(false);
  const startTimeRef = useRef(0);
  const isMountedRef = useRef(true);
  const googleTTSRef = useRef(null);

  // Initialize Google TTS
  useEffect(() => {
    if (googleApiKey) {
      console.log('Initializing Google TTS with API key');
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

  // Calculate duration
  useEffect(() => {
    if (content && content.length > 0) {
      const wordCount = content.trim().split(/\s+/).length;
      const wordsPerMinute = 180 * speed;
      const estimatedMs = (wordCount / wordsPerMinute) * 60 * 1000;
      setDuration(estimatedMs);
    }
  }, [content, speed]);

  // Cleanup
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

  // Text chunking for long content
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

  // Play with Google TTS
  const playWithGoogleTTS = useCallback(async (text, startProgress = 0) => {
    if (!googleTTSRef.current) {
      Alert.alert('Lỗi', 'Google TTS không khả dụng');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Calculate text to start from
      const startIndex = Math.floor(text.length * startProgress);
      const textToRead = text.slice(startIndex);
      
      // Check cache first
      const cacheKey = `${textToRead.substring(0, 100)}-${selectedVoice}-${speed}`;
      let audioContent = audioCache.get(cacheKey);
      
      if (!audioContent) {
        console.log('Synthesizing with Google TTS...');
        audioContent = await googleTTSRef.current.synthesizeText(textToRead, {
          voiceName: selectedVoice,
          speakingRate: speed,
          pitch: 0,
          volumeGainDb: 2.0
        });
        
        // Cache the audio
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
            Alert.alert('Lỗi', 'Không thể phát âm thanh. Vui lòng thử lại.');
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

  // Start speech
  const startSpeech = useCallback(async (startProgress = 0) => {
    if (!content || content.length === 0) {
      Alert.alert('Thông báo', 'Không có nội dung để đọc');
      return;
    }

    if (!googleApiKey) {
      Alert.alert('Lỗi', 'Không tìm thấy Google API key');
      return;
    }

    console.log(`Starting speech at ${Math.round(startProgress * 100)}%`);
    await playWithGoogleTTS(content, startProgress);
  }, [content, googleApiKey, playWithGoogleTTS]);

  // Stop speech
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

  // Handle speech complete
  const handleSpeechComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log('Speech completed');
    setIsSpeaking(false);
    setProgress(1);
    stopProgressTracking();
  }, []);

  // Progress tracking
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
        
        // Only update if Google TTS is not handling its own progress
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

  // Control handlers
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

  // Voice selection
  const cycleVoice = useCallback(() => {
    const voices = GoogleTTSService.getVietnameseVoices();
    const currentIndex = voices.findIndex(v => v.name === selectedVoice);
    const nextIndex = (currentIndex + 1) % voices.length;
    setSelectedVoice(voices[nextIndex].name);
    
    // Clear cache when voice changes
    setAudioCache(new Map());
    console.log(`Voice changed to: ${voices[nextIndex].description}`);
    
    // If currently speaking, restart with new voice
    if (isSpeaking) {
      setTimeout(async () => {
        await stopSpeech();
        setTimeout(() => startSpeech(progress), 200);
      }, 100);
    }
  }, [selectedVoice, isSpeaking, progress, stopSpeech, startSpeech]);

  // Adjust speed
  const adjustSpeed = useCallback(() => {
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speedOptions.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    
    setSpeed(newSpeed);
    console.log(`Speed changed to: ${newSpeed}x`);
    
    // Clear cache when speed changes
    setAudioCache(new Map());
    
    if (isSpeaking) {
      setTimeout(async () => {
        await stopSpeech();
        setTimeout(() => startSpeech(progress), 200);
      }, 100);
    }
  }, [speed, isSpeaking, progress, stopSpeech, startSpeech]);

  // Utility functions
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
      <View className="bg-red-50 rounded-2xl shadow-lg" style={styles.bottomBar}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy Google API key</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={scaleSize(20)} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl shadow-lg" style={styles.bottomBar}>
      {/* Header */}
      <View className="flex-row items-center justify-between" style={styles.header}>
        <View className="flex-row items-center" style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleSpeech} disabled={isLoading}>
            <View style={{ position: 'relative' }}>
              <Image
                source={require('../assets/icon.png')}
                style={[styles.appIcon, { opacity: isLoading ? 0.5 : 0.9 }]}
              />
              <View style={styles.playOverlay}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : isSpeaking ? (
                  <Pause size={scaleSize(18)} color="white" />
                ) : (
                  <Play size={scaleSize(18)} color="white" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-gray-800 font-sf-medium" style={styles.statusText}>
              {getStatusText()}
            </Text>
            <Text className="text-gray-500" style={styles.voiceText}>
              {getCurrentVoiceName()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center" style={styles.headerRight}>
          {/* Speed Control */}
          <TouchableOpacity onPress={adjustSpeed} style={styles.speedButton}>
            <Text className="font-bold text-black" style={styles.speedText}>
              {speed}x
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandButton}>
            {expanded ? (
              <ChevronDown size={scaleSize(20)} color="gray" />
            ) : (
              <ChevronUp size={scaleSize(20)} color="gray" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={scaleSize(20)} color="gray" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Controls */}
      {expanded && (
        <View style={styles.expandedContainer}>
          {/* Voice Settings */}
          <View className="flex-row justify-between items-center" style={styles.voiceSettings}>
            <TouchableOpacity onPress={cycleVoice} style={styles.voiceButton}>
              <Settings size={scaleSize(16)} color="gray" />
              <Text className="text-gray-600" style={styles.voiceButtonText}>
                Thay đổi giọng
              </Text>
            </TouchableOpacity>
            <Text className="text-gray-500" style={styles.cacheText}>
              Đã lưu: {audioCache.size} đoạn
            </Text>
          </View>

          {/* Control Buttons */}
          <View className="flex-row justify-between items-center" style={styles.controlButtons}>
            <TouchableOpacity onPress={() => {
              stopSpeech();
              setProgress(0);
              setTimeout(() => startSpeech(0), 150);
            }}>
              <RotateCcw size={scaleSize(26)} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSpeech}
              disabled={isLoading}
              className="bg-black rounded-full"
              style={[styles.mainPlayButton, { opacity: isLoading ? 0.5 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : isSpeaking ? (
                <Pause size={scaleSize(22)} color="white" />
              ) : (
                <Play size={scaleSize(22)} color="white" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              const newProgress = Math.min(progress + 0.1, 1);
              stopSpeech();
              setProgress(newProgress);
              if (newProgress < 1) {
                setTimeout(() => startSpeech(newProgress), 150);
              }
            }}>
              <RotateCw size={scaleSize(26)} color="black" />
            </TouchableOpacity>
          </View>

          {/* Time Display */}
          <View className="flex-row justify-between items-center" style={styles.timeContainer}>
            <Text className="text-gray-500" style={styles.timeText}>
              {formatTime(progress * duration)}
            </Text>
            <Text className="text-gray-500" style={styles.timeText}>
              {formatTime(duration)}
            </Text>
          </View>

          {/* Progress Slider */}
          <Slider
            style={styles.slider}
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
              if (newProgress < 0.99) {
                setTimeout(() => startSpeech(newProgress), 150);
              }
            }}
          />

          {/* Stats */}
          <View className="flex-row justify-center items-center" style={styles.statsContainer}>
            <Text className="text-gray-400" style={styles.statsText}>
              {content.trim().split(/\s+/).length} từ • {Math.round(progress * 100)}% hoàn thành
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    marginHorizontal: spacing(28),
    marginBottom: spacing(32),
    shadowColor: '#32325D',
    shadowOpacity: 0.2,
    shadowRadius: scaleSize(8),
    shadowOffset: { width: 0, height: spacing(2) },
    elevation: 6,
  },
  header: {
    paddingHorizontal: spacing(14),
    paddingTop: spacing(10),
    paddingBottom: spacing(10),
  },
  headerLeft: {
    gap: spacing(12),
  },
  headerRight: {
    gap: spacing(8),
  },
  appIcon: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(6),
    opacity: 0.9,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(6),
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: scaleFont(14),
  },
  voiceText: {
    fontSize: scaleFont(11),
    marginTop: 2,
  },
  speedButton: {
    minWidth: scaleSize(32),
    alignItems: 'center',
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(4),
    backgroundColor: '#f3f4f6',
    borderRadius: scaleSize(8),
  },
  speedText: {
    fontSize: scaleFont(12),
  },
  expandButton: {
    marginLeft: spacing(4),
  },
  closeButton: {
    marginLeft: spacing(4),
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing(16),
  },
  errorText: {
    color: '#dc2626',
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  expandedContainer: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(8),
    paddingBottom: spacing(16),
  },
  voiceSettings: {
    marginBottom: spacing(16),
    paddingBottom: spacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  voiceButtonText: {
    fontSize: scaleFont(13),
  },
  cacheText: {
    fontSize: scaleFont(11),
  },
  controlButtons: {
    marginBottom: spacing(12),
    marginTop: spacing(8),
  },
  mainPlayButton: {
    padding: spacing(16),
  },
  timeContainer: {
    marginBottom: spacing(4),
  },
  timeText: {
    fontSize: scaleFont(12),
  },
  slider: {
    width: '100%',
    height: spacing(30),
  },
  statsContainer: {
    marginTop: spacing(8),
  },
  statsText: {
    fontSize: scaleFont(12),
  },
});