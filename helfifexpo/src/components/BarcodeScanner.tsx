import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface BarcodeScannerProps {
  onScanned: (barcode: string, type: string) => void;
  onClose: () => void;
  onManualAdd?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
}

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanned,
  onClose,
  onManualAdd,
  onSecondaryAction,
  secondaryActionLabel,
  title = 'Наведите камеру на штрихкод',
  subtitle = 'Сканирование добавит продукт в холодильник',
  isActive = false,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isActive) {
      setScanned(false);
    }
  }, [isActive]);

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionText}>Загружаем камеру...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={72} color="#737B86" />
        <Text style={styles.permissionTitle}>Нужен доступ к камере</Text>
        <Text style={styles.permissionText}>
          Разрешите доступ к камере, чтобы сканировать продукты и QR-коды.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Разрешить доступ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.secondaryTextButton}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code39',
            'code93',
            'code128',
            'codabar',
            'itf14',
            'pdf417',
            'aztec',
            'datamatrix',
          ],
        }}
        onBarcodeScanned={({ data, type }) => {
          if (scanned) return;
          setScanned(true);
          onScanned(data, type);
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          <Text style={styles.hint}>
            Поддерживаются QR, EAN, UPC и другие популярные форматы
          </Text>

          {onManualAdd ? (
            <TouchableOpacity style={styles.manualButton} onPress={onManualAdd}>
              <Ionicons name="add" size={18} color="#17191C" />
              <Text style={styles.manualButtonText}>Добавить вручную</Text>
            </TouchableOpacity>
          ) : null}

          {onSecondaryAction ? (
            <TouchableOpacity onPress={onSecondaryAction}>
              <Text style={styles.secondaryActionText}>
                {secondaryActionLabel || 'Проверить продукт'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '700',
    color: '#17191C',
  },
  permissionText: {
    marginTop: 12,
    marginBottom: 28,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#737B86',
  },
  primaryButton: {
    minWidth: 220,
    borderRadius: 28,
    backgroundColor: '#5FAF8F',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryTextButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#737B86',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 17, 22, 0.58)',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  closeIcon: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  middleRow: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 22, 0.58)',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#5FAF8F',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 14,
  },
  bottomOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 17, 22, 0.58)',
    paddingHorizontal: 28,
    paddingBottom: 30,
  },
  hint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 16,
  },
  manualButtonText: {
    color: '#17191C',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default BarcodeScanner;
