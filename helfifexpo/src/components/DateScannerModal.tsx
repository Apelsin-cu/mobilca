import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { DateOcrService, OcrScanResult } from '../services/DateOcrService';
import { formatExpiryDateForDisplay } from '../utils/productDate';

interface DateScannerModalProps {
  onClose: () => void;
  onDetected: (result: OcrScanResult) => void;
}

const DateScannerModal: React.FC<DateScannerModalProps> = ({
  onClose,
  onDetected,
}) => {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [previewUri, setPreviewUri] = useState('');
  const [error, setError] = useState('');

  const handleCapture = async () => {
    if (!cameraRef.current || processing) {
      return;
    }

    try {
      setProcessing(true);
      setError('');
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
        shutterSound: false,
      });

      setPreviewUri(picture.uri);

      const result = await DateOcrService.scanImage(picture.uri);

      if (!result.expiryDate && !result.manufactureDate) {
        setError('Не удалось распознать дату. Попробуйте поднести упаковку ближе и снять ещё раз.');
        return;
      }

      onDetected(result);
    } catch (captureError) {
      console.error('Date scanner error:', captureError);
      setError('Сканирование не удалось. Попробуйте ещё раз.');
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Text style={styles.permissionText}>Подготавливаем камеру...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={68} color="#737B86" />
        <Text style={styles.permissionTitle}>Нужен доступ к камере</Text>
        <Text style={styles.permissionText}>
          Камера нужна, чтобы считать дату прямо с упаковки.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Разрешить доступ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Закрыть</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Считать дату с упаковки</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <Text style={styles.subtitle}>
        Наведите камеру на строку с датой. Лучше, если в кадре будут слова «годен до» или «дата изготовления».
      </Text>

      <View style={styles.cameraCard}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="picture" />
        <View style={styles.guideFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {previewUri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          <Text style={styles.previewCaption}>Последний снимок готов к распознаванию</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.messageCard}>
          <Ionicons name="warning-outline" size={18} color="#A35F15" />
          <Text style={styles.messageText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.captureButton, processing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#17191C" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={18} color="#17191C" />
              <Text style={styles.captureButtonText}>Считать дату</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const buildDetectedDateSummary = (result: OcrScanResult): string => {
  const parts: string[] = [];

  if (result.manufactureDate?.isoDate) {
    parts.push(`Изготовление: ${formatExpiryDateForDisplay(result.manufactureDate.isoDate)}`);
  }

  if (result.expiryDate?.isoDate) {
    parts.push(`Срок: ${formatExpiryDateForDisplay(result.expiryDate.isoDate)}`);
  }

  return parts.join(' • ');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1116',
    paddingHorizontal: 20,
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#17191C',
  },
  permissionText: {
    marginTop: 12,
    marginBottom: 26,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#737B86',
  },
  primaryButton: {
    minWidth: 220,
    borderRadius: 26,
    backgroundColor: '#5FAF8F',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#737B86',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 12,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.76)',
  },
  cameraCard: {
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#151D24',
    position: 'relative',
    aspectRatio: 0.8,
  },
  camera: {
    flex: 1,
  },
  guideFrame: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '30%',
    bottom: '30%',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#5FAF8F',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  previewCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#151D24',
    padding: 14,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    marginBottom: 10,
  },
  previewCaption: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#2A2118',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#F7D9B1',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
  },
  captureButtonDisabled: {
    opacity: 0.72,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17191C',
  },
});

export default DateScannerModal;
