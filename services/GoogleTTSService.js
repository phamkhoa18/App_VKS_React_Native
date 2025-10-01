// services/GoogleTTSService.js
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class GoogleTTSService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    this.currentSound = null;
    this.isPlaying = false;
    this.onPlaybackStatusUpdate = null;
  }

  async synthesizeText(text, options = {}) {
    const {
      languageCode = 'vi-VN',
      voiceName = 'vi-VN-Wavenet-A',
      ssmlGender = 'FEMALE',
      speakingRate = 1.0,
      pitch = 0.0,
      volumeGainDb = 0.0
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            name: voiceName,
            ssmlGender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate,
            pitch,
            volumeGainDb,
            effectsProfileId: ['headphone-class-device']
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.audioContent;
    } catch (error) {
      console.error('Google TTS Error:', error);
      throw error;
    }
  }

  async playAudio(base64Audio, callbacks = {}) {
    try {
      await this.stopAudio();

      // Save base64 audio to temporary file
      const audioUri = await this.saveBase64ToFile(base64Audio);

      // Load and play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true,
          volume: 1.0,
          isLooping: false,
          progressUpdateIntervalMillis: 100
        }
      );

      this.currentSound = sound;
      this.isPlaying = true;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (this.onPlaybackStatusUpdate) {
          this.onPlaybackStatusUpdate(status);
        }
        
        if (status.didJustFinish) {
          this.isPlaying = false;
          if (callbacks.onComplete) callbacks.onComplete();
          // Clean up temp file
          this.cleanupTempFile(audioUri);
        }
      });

      if (callbacks.onStart) callbacks.onStart();

    } catch (error) {
      console.error('Play audio error:', error);
      if (callbacks.onError) callbacks.onError(error);
    }
  }

  async saveBase64ToFile(base64Audio) {
    const fileName = `tts_audio_${Date.now()}.mp3`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileUri;
  }

  async cleanupTempFile(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  async stopAudio() {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
        this.isPlaying = false;
      } catch (error) {
        console.error('Stop audio error:', error);
      }
    }
  }

  async pauseAudio() {
    if (this.currentSound && this.isPlaying) {
      await this.currentSound.pauseAsync();
      this.isPlaying = false;
    }
  }

  async resumeAudio() {
    if (this.currentSound && !this.isPlaying) {
      await this.currentSound.playAsync();
      this.isPlaying = true;
    }
  }

  static getVietnameseVoices() {
    return [
      { name: 'vi-VN-Wavenet-A', gender: 'FEMALE', description: 'Giọng nữ tự nhiên' },
      { name: 'vi-VN-Wavenet-C', gender: 'FEMALE', description: 'Giọng nữ trẻ' },
      { name: 'vi-VN-Wavenet-B', gender: 'MALE', description: 'Giọng nam tự nhiên' },
      { name: 'vi-VN-Wavenet-D', gender: 'MALE', description: 'Giọng nam trưởng thành' },
    ];
  }
}

export default GoogleTTSService;