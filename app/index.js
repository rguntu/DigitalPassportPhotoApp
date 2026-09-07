import { StyleSheet, Text, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import Gallery from '../gallery';
import PaymentProcessModal from './payment_process';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radii, spacing } from './theme';
import { COUNTRY_OPTIONS, getCountryMeta, getPhotoAspect } from './countries';
import { PrimaryButton, SecondaryButton } from './components/AppButton';
import StepIndicator from './components/StepIndicator';

export default function Page() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [showPaymentProcessModal, setShowPaymentProcessModal] = useState(false);
  const [paymentProcessUri, setPaymentProcessUri] = useState(null);
  const [photoCount, setPhotoCount] = useState(6);
  const [country, setCountry] = useState('US');
  const cameraRef = useRef(null);
  const router = useRouter();
  const { tab } = useLocalSearchParams();

  const countryMeta = useMemo(() => getCountryMeta(country), [country]);
  const ovalAspect = getPhotoAspect(country);

  const openAdjustPhoto = (uri) => {
    if (!uri) {
      Alert.alert('No photo', 'Could not open the selected photo.');
      return;
    }
    router.push({
      pathname: '/adjust_photo',
      params: {
        photoUri: uri,
        country,
      },
    });
  };

  const handleShowPaymentProcess = (uri, count = 6) => {
    setPaymentProcessUri(uri);
    setPhotoCount(count);
    setShowPaymentProcessModal(true);
  };

  const handleClosePaymentProcess = () => {
    setShowPaymentProcessModal(false);
    setPaymentProcessUri(null);
  };

  const startCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to take a passport photo.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const newPhoto = await cameraRef.current.takePictureAsync();
    setShowCamera(false);
    if (newPhoto?.uri) {
      openAdjustPhoto(newPhoto.uri);
    }
  };

  const pickImage = async () => {
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) {
      Alert.alert('Photo library permission needed', 'Allow photo access to upload an existing picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      Image.getSize(uri, (width, height) => {
        if (width < 600 || height < 600) {
          Alert.alert(
            'Image Resolution Too Low',
            `The selected photo is too small (${width}×${height}). Please choose at least 600×600 pixels.`
          );
        } else {
          openAdjustPhoto(uri);
        }
      });
    }
  };

  if (showCamera) {
    const guideHeight = 280;
    const guideWidth = guideHeight * ovalAspect * 0.75;

    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing="front">
          <View style={styles.cameraGuideWrap} pointerEvents="none">
            <View style={[styles.cameraOval, { width: guideWidth, height: guideHeight }]} />
            <Text style={styles.cameraGuideText}>Center your face in the oval · {country}</Text>
          </View>
          <View style={styles.cameraButtonContainer}>
            <PrimaryButton title="Take Photo" onPress={takePhoto} style={{ width: '46%' }} />
            <SecondaryButton title="Cancel" onPress={() => setShowCamera(false)} style={{ width: '46%' }} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StepIndicator current="capture" />
      <View style={styles.countrySection}>
        <Text style={styles.countryLabel}>Passport country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countryRow}>
          {COUNTRY_OPTIONS.map((option) => {
            const selected = option.value === country;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.countryChip, selected && styles.countryChipSelected]}
                onPress={() => setCountry(option.value)}
              >
                <Text style={[styles.countryChipText, selected && styles.countryChipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.countryHint}>
          {countryMeta.code} · {countryMeta.sizeLabel} · {countryMeta.outputWidthPx}×{countryMeta.outputHeightPx}px
          {'\n'}Not a government service — acceptance not guaranteed
        </Text>
      </View>

      <View style={styles.galleryContainer}>
        <Gallery
          onPressProcessedPhoto={handleShowPaymentProcess}
          initialTab={tab}
          onStartCapture={startCamera}
        />
      </View>

      <View style={styles.mainButtonContainer}>
        <PrimaryButton title="Take Photo" onPress={startCamera} style={{ width: '46%' }} />
        <SecondaryButton title="Upload" onPress={pickImage} style={{ width: '46%' }} />
      </View>

      <PaymentProcessModal
        isVisible={showPaymentProcessModal}
        onClose={handleClosePaymentProcess}
        uri={paymentProcessUri}
        photoCount={photoCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  countrySection: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  countryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  countryRow: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  countryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  countryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  countryChipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  countryChipTextSelected: {
    color: colors.white,
  },
  countryHint: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 12,
  },
  galleryContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  cameraGuideWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOval: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(29,155,240,0.15)',
  },
  cameraGuideText: {
    marginTop: spacing.md,
    color: colors.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 28,
    paddingHorizontal: spacing.md,
  },
  mainButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
    width: '100%',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
});
