import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

async function loadFontBase64() {
  // Load font asset
  const asset = Asset.fromModule(require('../assets/SF-Pro-Display/SF-Pro-Display-Medium.otf'));
  await asset.downloadAsync();

  // Đọc file dưới dạng base64
  const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  return base64;
}
