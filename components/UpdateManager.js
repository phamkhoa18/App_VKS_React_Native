import { useEffect, useState, useRef } from 'react';
import { 
  Alert, 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  Modal
} from 'react-native';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const UpdateManager = ({ children }) => {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateState, setUpdateState] = useState('checking'); // checking, available, downloading, ready
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (isCheckingUpdate || showUpdateModal) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();

      // Rotate animation for loading
      if (updateState === 'checking' || updateState === 'downloading') {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      }
    }
  }, [isCheckingUpdate, showUpdateModal, updateState]);

  const checkForUpdates = async () => {
    try {
      if (__DEV__) {
        console.log('Development mode - skip update check');
        return;
      }

      setIsCheckingUpdate(true);
      setUpdateState('checking');
      console.log('Checking for updates...');

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('Update available:', update.manifest);
        setUpdateInfo(update);
        setUpdateState('available');
        setIsCheckingUpdate(false);
        setShowUpdateModal(true);
      } else {
        console.log('No updates available - app is up to date');
        setIsCheckingUpdate(false);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setIsCheckingUpdate(false);
    }
  };

  const downloadAndInstallUpdate = async () => {
    try {
      setUpdateState('downloading');
      setDownloadProgress(0);
      console.log('Downloading update...');
      
      // Simulate progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      const result = await Updates.fetchUpdateAsync();
      
      if (result.isNew) {
        setUpdateState('ready');
        setDownloadProgress(100);
        console.log('Update downloaded successfully, preparing restart...');
        
        // Small delay for better UX
        setTimeout(() => {
          Updates.reloadAsync();
        }, 1500);
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateState('available');
      Alert.alert(
        'Lỗi cập nhật',
        'Không thể tải bản cập nhật. Vui lòng kiểm tra kết nối internet và thử lại sau.',
        [{ text: 'OK' }]
      );
    }
  };

  const closeUpdateModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowUpdateModal(false);
      setUpdateState('checking');
      progressAnim.setValue(0);
      rotateAnim.setValue(0);
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Loading screen while checking updates
  if (isCheckingUpdate && updateState === 'checking') {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#004b8d', '#006cd9', '#00c6ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View 
            style={[
              styles.loadingContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCw size={40} color="#FFFFFF" strokeWidth={2} />
              </Animated.View>
            </View>
            
            <Text style={styles.loadingTitle}>
              Đang kiểm tra cập nhật...
            </Text>
            <Text style={styles.loadingSubText}>
              Vui lòng đợi trong giây lát
            </Text>

            <View style={styles.dotsContainer}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Update modal
  const UpdateModal = () => (
    <Modal
      visible={showUpdateModal}
      transparent={true}
      animationType="none"
      onRequestClose={updateState === 'downloading' ? null : closeUpdateModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.modalContent}
          >
            {/* Header Icon */}
            <View style={styles.modalIconContainer}>
              {updateState === 'available' && (
                <Download size={50} color="#006cd9" strokeWidth={2} />
              )}
              {updateState === 'downloading' && (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <RefreshCw size={50} color="#006cd9" strokeWidth={2} />
                </Animated.View>
              )}
              {updateState === 'ready' && (
                <CheckCircle size={50} color="#10B981" strokeWidth={2} />
              )}
            </View>

            {/* Title & Description */}
            <Text style={styles.modalTitle}>
              {updateState === 'available' && 'Có bản cập nhật mới! 🚀'}
              {updateState === 'downloading' && 'Đang tải xuống...'}
              {updateState === 'ready' && 'Cập nhật hoàn tất! ✅'}
            </Text>

            <Text style={styles.modalDescription}>
              {updateState === 'available' && 
                'Ứng dụng Viện Kiểm Soát AI có phiên bản mới với nhiều tính năng được cải thiện và sửa lỗi.'
              }
              {updateState === 'downloading' && 
                'Đang tải xuống bản cập nhật mới. Vui lòng không tắt ứng dụng.'
              }
              {updateState === 'ready' && 
                'Bản cập nhật đã sẵn sàng. Ứng dụng sẽ khởi động lại để áp dụng những thay đổi mới.'
              }
            </Text>

            {/* Progress Bar */}
            {updateState === 'downloading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>Đang tải xuống...</Text>
              </View>
            )}

            {/* Action Buttons */}
            {updateState === 'available' && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={closeUpdateModal}
                >
                  <Text style={styles.secondaryButtonText}>Để sau</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={downloadAndInstallUpdate}
                >
                  <LinearGradient
                    colors={['#004b8d', '#006cd9']}
                    style={styles.primaryButtonGradient}
                  >
                    <Download size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.primaryButtonText}>Cập nhật ngay</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {updateState === 'ready' && (
              <View style={styles.readyContainer}>
                <Text style={styles.readyText}>Đang khởi động lại...</Text>
                <ActivityIndicator color="#006cd9" size="small" />
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <>
      {children}
      <UpdateModal />
    </>
  );
};

// Enhanced Manual Update Checker
export const ManualUpdateChecker = () => {
  const [isChecking, setIsChecking] = useState(false);

  const handleManualCheck = async () => {
    if (__DEV__) {
      Alert.alert(
        'Chế độ phát triển',
        'Tính năng cập nhật chỉ hoạt động trong bản production.',
        [{ text: 'Hiểu rồi' }]
      );
      return;
    }

    setIsChecking(true);
    
    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          'Có bản cập nhật mới! 🎉',
          'Tìm thấy phiên bản mới. Bạn có muốn cập nhật ngay không?',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Cập nhật', 
              onPress: async () => {
                try {
                  const result = await Updates.fetchUpdateAsync();
                  if (result.isNew) {
                    Updates.reloadAsync();
                  }
                } catch (error) {
                  Alert.alert('Lỗi', 'Không thể tải bản cập nhật');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Ứng dụng đã mới nhất ✅',
          'Bạn đang sử dụng phiên bản mới nhất.',
          [{ text: 'Tuyệt vời!' }]
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kiểm tra cập nhật');
    } finally {
      setIsChecking(false);
    }
  };

  return { handleManualCheck, isChecking };
};

const styles = StyleSheet.create({
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'SFPro-Bold',
    marginBottom: 8,
  },
  loadingSubText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'SFPro-Regular',
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalContent: {
    padding: 30,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'SFPro-Bold',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'SFPro-Regular',
    marginBottom: 30,
  },

  // Progress Bar
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#006cd9',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'SFPro-Medium',
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'SFPro-Medium',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'SFPro-Medium',
  },

  // Ready State
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'SFPro-Medium',
  },
});

export default UpdateManager;