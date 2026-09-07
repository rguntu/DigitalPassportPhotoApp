import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPassportRequirements } from '../passportConfig';
import { removeBackground } from '@jacobjmc/react-native-background-remover';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { colors, radii, spacing } from './theme';
import { getCountryMeta } from './countries';
import { PrimaryButton, SecondaryButton } from './components/AppButton';
import StepIndicator from './components/StepIndicator';
import ComplianceChecklist from './components/ComplianceChecklist';

const { width: screenWidth } = Dimensions.get('window');
const photosDir = FileSystem.documentDirectory + 'photos/';

const AdjustPhotoPage = () => {
  const params = useLocalSearchParams();
  const photoUri = Array.isArray(params.photoUri) ? params.photoUri[0] : params.photoUri;
  const country = (Array.isArray(params.country) ? params.country[0] : params.country) || 'US';
  const isReEdit = Array.isArray(params.isReEdit) ? params.isReEdit[0] : params.isReEdit;
  const processedUri = Array.isArray(params.processedUri) ? params.processedUri[0] : params.processedUri;

  const router = useRouter();
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalUri, setOriginalUri] = useState(photoUri || null);
  const [processedBgUri, setProcessedBgUri] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [statusText, setStatusText] = useState('Loading photo…');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const displayUri = showOriginal ? originalUri : processedBgUri || originalUri;

  const fitImage = (width, height) => {
    setImageSize({ width, height });
    const requirements = getPassportRequirements(country);
    const { outputWidthPx, outputHeightPx } = requirements;
    const containerAspectRatio = outputWidthPx / outputHeightPx;
    const containerWidth = screenWidth * 0.9;
    const containerHeight = containerWidth / containerAspectRatio;
    const initialScale = Math.max(containerWidth / width, containerHeight / height);
    scale.value = initialScale;
    savedScale.value = initialScale;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      if (!photoUri) {
        setStatusText('No photo provided.');
        setIsPreparing(false);
        return;
      }

      setOriginalUri(photoUri);
      setStatusText('Preparing photo…');
      Image.getSize(photoUri, (width, height) => {
        if (!cancelled) fitImage(width, height);
      });

      if (isReEdit === 'true') {
        setProcessedBgUri(photoUri);
        if (!cancelled) {
          setIsPreparing(false);
          setStatusText('');
        }
        return;
      }

      try {
        setStatusText('Removing background…');
        const removedBgUri = await removeBackground(photoUri);
        if (cancelled) return;

        if (typeof removedBgUri === 'string' && removedBgUri) {
          const whiteBgPhoto = await ImageManipulator.manipulateAsync(
            removedBgUri,
            [],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
          );
          if (cancelled) return;
          setProcessedBgUri(whiteBgPhoto.uri);
          Image.getSize(whiteBgPhoto.uri, (width, height) => {
            if (!cancelled) fitImage(width, height);
          });
          setStatusText('');
        }
      } catch (e) {
        console.warn('Background removal skipped:', e?.message || e);
        if (!cancelled) {
          setStatusText('Background removal unavailable — adjust with original photo.');
        }
      } finally {
        if (!cancelled) {
          setIsPreparing(false);
          setTimeout(() => {
            if (!cancelled) setStatusText((current) =>
              current?.includes('unavailable') ? current : ''
            );
          }, 1600);
        }
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [photoUri, country, isReEdit]);

  const onSave = async () => {
    try {
      const uriToSave = processedBgUri || originalUri;
      if (!uriToSave) {
        Alert.alert('Missing photo', 'No photo is available to save.');
        return;
      }
      if (imageSize.width === 0 || imageSize.height === 0) {
        Alert.alert('Still loading', 'Please wait a moment for the photo to finish loading.');
        return;
      }

      setIsSaving(true);
      const requirements = getPassportRequirements(country);
      const { outputWidthPx, outputHeightPx } = requirements;
      const containerAspectRatio = outputWidthPx / outputHeightPx;
      const containerWidth = screenWidth * 0.9;
      const containerHeight = containerWidth / containerAspectRatio;

      const initialScale = Math.max(containerWidth / imageSize.width, containerHeight / imageSize.height);
      const finalScale = Math.max(scale.value, initialScale);
      const ratio = 1 / finalScale;

      let originX = imageSize.width / 2 - (containerWidth / 2) * ratio - translateX.value * ratio;
      let originY = imageSize.height / 2 - (containerHeight / 2) * ratio - translateY.value * ratio;
      let cropWidth = containerWidth * ratio;
      let cropHeight = containerHeight * ratio;

      originX = Math.max(0, Math.round(originX));
      originY = Math.max(0, Math.round(originY));
      cropWidth = Math.round(Math.min(cropWidth, imageSize.width - originX));
      cropHeight = Math.round(Math.min(cropHeight, imageSize.height - originY));

      if (cropWidth < 10 || cropHeight < 10) {
        throw new Error('Crop area is too small. Pinch out and try again.');
      }

      const croppedPhoto = await ImageManipulator.manipulateAsync(
        uriToSave,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const finalPhoto = await ImageManipulator.manipulateAsync(
        croppedPhoto.uri,
        [{ resize: { width: outputWidthPx, height: outputHeightPx } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      let dest;
      if (isReEdit === 'true' && processedUri) {
        dest = processedUri;
      } else {
        const originalFilename = String(photoUri).split('/').pop() || `${Date.now()}.jpg`;
        const baseName = originalFilename.split('.')[0] || String(Date.now());
        const randomNumber = Math.floor(Math.random() * 1000000);
        dest = `${photosDir}${baseName}_${country}_processed_${randomNumber}.jpg`;
      }

      await FileSystem.copyAsync({ from: finalPhoto.uri, to: dest });
      router.replace({ pathname: '/', params: { tab: 'processed' } });
    } catch (saveError) {
      console.error('Error saving photo: ', saveError);
      Alert.alert('Could not save', saveError.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const requirements = getPassportRequirements(country);
  const countryMeta = getCountryMeta(country);
  const { outputWidthPx, outputHeightPx, headHeightMaxPx } = requirements;
  const containerAspectRatio = outputWidthPx / outputHeightPx;
  const containerWidth = screenWidth * 0.9;
  const containerHeight = containerWidth / containerAspectRatio;
  const scaleFactor = containerWidth / outputWidthPx;
  const ovalHeight = Math.max(120, headHeightMaxPx * scaleFactor);
  const ovalWidth = ovalHeight * 0.75;
  const canCompare = !!(originalUri && processedBgUri && processedBgUri !== originalUri);

  if (!photoUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No photo provided.</Text>
        <SecondaryButton title="Go Back" onPress={() => router.back()} style={{ width: '45%' }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StepIndicator current="adjust" />
        <Text style={styles.instructions}>Position your face within the oval · {country}</Text>
        <Text style={styles.spec}>
          {countryMeta.sizeLabel} · {outputWidthPx}×{outputHeightPx}px
        </Text>
        {!!statusText && <Text style={styles.statusText}>{statusText}</Text>}

        {canCompare ? (
          <View style={styles.compareRow}>
            <TouchableOpacity
              style={[styles.compareChip, showOriginal && styles.compareChipActive]}
              onPress={() => setShowOriginal(true)}
            >
              <Text style={[styles.compareChipText, showOriginal && styles.compareChipTextActive]}>
                Before
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compareChip, !showOriginal && styles.compareChipActive]}
              onPress={() => setShowOriginal(false)}
            >
              <Text style={[styles.compareChipText, !showOriginal && styles.compareChipTextActive]}>
                After
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <GestureDetector gesture={composedGesture}>
          <View style={[styles.photoContainer, { width: containerWidth, height: containerHeight }]}>
            {displayUri ? (
              <Animated.Image
                source={{ uri: displayUri }}
                style={[
                  {
                    width: imageSize.width || containerWidth,
                    height: imageSize.height || containerHeight,
                  },
                  animatedStyle,
                ]}
              />
            ) : null}
            <View style={styles.overlay} pointerEvents="none">
              <View style={[styles.oval, { width: ovalWidth, height: ovalHeight }]} />
            </View>
            {isPreparing && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>
        </GestureDetector>

        <Text style={styles.hint}>Pinch to zoom · drag to position</Text>
        <ComplianceChecklist country={country} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <SecondaryButton title="Cancel" onPress={() => router.back()} disabled={isSaving} style={{ width: '45%' }} />
        <PrimaryButton
          title="Save"
          onPress={onSave}
          loading={isSaving}
          disabled={!displayUri}
          style={{ width: '45%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  instructions: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  spec: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  statusText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  compareRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: spacing.sm,
  },
  compareChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  compareChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  compareChipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  compareChipTextActive: {
    color: colors.white,
  },
  hint: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMuted,
  },
  photoContainer: {
    backgroundColor: '#e8eef2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  oval: {
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: 'rgba(29, 155, 240, 0.12)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240,245,249,0.35)',
    zIndex: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
});

export default AdjustPhotoPage;
