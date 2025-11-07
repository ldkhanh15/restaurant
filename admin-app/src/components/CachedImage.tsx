import React, { useState, useEffect } from 'react';
import { Image, ImageProps, StyleSheet, View, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  cacheKey?: string;
}

/**
 * CachedImage Component
 * 
 * Tự động cache hình ảnh từ network vào local storage
 * Giúp giảm network requests và tăng tốc độ load ảnh
 * 
 * @param uri - URL của hình ảnh cần load
 * @param cacheKey - Key tùy chỉnh cho cache (optional)
 * @param style - Style của Image component
 */
const CachedImage: React.FC<CachedImageProps> = ({ 
  uri, 
  cacheKey, 
  style, 
  ...props 
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (!uri) {
          setError(true);
          setLoading(false);
          return;
        }

        // Tạo tên file từ URI hoặc cacheKey
        const filename = cacheKey || uri.split('/').pop() || 'image';
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        // Kiểm tra xem ảnh đã có trong cache chưa
        const metadata = await FileSystem.getInfoAsync(fileUri);

        if (metadata.exists) {
          // ✅ Sử dụng ảnh từ cache
          console.log('📦 Using cached image:', filename);
          setImageUri(fileUri);
        } else {
          // ⬇️ Download và cache ảnh
          console.log('⬇️ Downloading image:', filename);
          const downloadResult = await FileSystem.downloadAsync(uri, fileUri);
          setImageUri(downloadResult.uri);
          console.log('✅ Image cached:', filename);
        }
      } catch (error) {
        console.error('❌ Image caching error:', error);
        // Fallback: sử dụng URI gốc nếu cache thất bại
        setImageUri(uri);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [uri, cacheKey]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/300x200?text=No+Image' }} 
          style={styles.placeholder}
          {...props}
        />
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: imageUri }} 
      style={style} 
      {...props}
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    backgroundColor: '#e0e0e0',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
});

export default CachedImage;
