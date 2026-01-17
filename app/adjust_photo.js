import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPassportRequirements } from '../passportConfig';
import { removeBackground } from '@jacobjmc/react-native-background-remover';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

const photosDir = FileSystem.documentDirectory + 'photos/';

const AdjustPhotoPage = () => {
  const { photoUri, country = 'US', isReEdit, processedUri } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [photoWithWhiteBg, setPhotoWithWhiteBg] = useState(null);
  const [error, setError] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    const processBackgroundImage = async () => {
      try {
        if (!photoUri) {
          throw new Error("No photo URI provided.");
        }

        const removedBgUri = await removeBackground(photoUri);

        if (typeof removedBgUri !== 'string' || !removedBgUri) {
          throw new Error("Failed to remove background.");
        }

        const whiteBgPhoto = await ImageManipulator.manipulateAsync(
          removedBgUri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        setPhotoWithWhiteBg(whiteBgPhoto.uri);
          Image.getSize(whiteBgPhoto.uri, (width, height) => {
            setImageSize({ width, height });
            const requirements = getPassportRequirements(country);
            const { outputWidthPx, outputHeightPx } = requirements;
            const containerAspectRatio = outputWidthPx / outputHeightPx;
            const containerWidth = screenWidth * 0.9;
            const containerHeight = containerWidth / containerAspectRatio;
            const initialScale = Math.max(containerWidth / width, containerHeight / height);

            scale.value = initialScale;
            savedScale.value = initialScale;
          }, (error) => {
          console.log('[Image.getSize Error in Adjust Photo]:', error.message);
          setIsLoading(false);
          });

      } catch (e) {
        console.error("Error processing background:", e);
        setError("Could not prepare photo for adjustment. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    processBackgroundImage();
  }, [photoUri, country]);

  const onSave = async () => {
    try {
      setIsLoading(true);
      const requirements = getPassportRequirements(country);
      const { outputWidthPx, outputHeightPx } = requirements;
      const containerAspectRatio = outputWidthPx / outputHeightPx;
      const containerWidth = screenWidth * 0.9;
      const containerHeight = containerWidth / containerAspectRatio;

      if (imageSize.width === 0 || imageSize.height === 0) {
        throw new Error("Image dimensions are not yet available.");
      }
      
      const initialScale = Math.max(containerWidth / imageSize.width, containerHeight / imageSize.height);
      const finalScale = Math.max(scale.value, initialScale);
      const ratio = 1 / finalScale;

      let originX = (imageSize.width / 2) - (containerWidth / 2) * ratio - translateX.value * ratio;
      let originY = (imageSize.height / 2) - (containerHeight / 2) * ratio - translateY.value * ratio;
      let cropWidth = containerWidth * ratio;
      let cropHeight = containerHeight * ratio;

      originX = Math.max(0, Math.round(originX));
      originY = Math.max(0, Math.round(originY));
      cropWidth = Math.round(cropWidth);
      cropHeight = Math.round(cropHeight);

      const croppedPhoto = await ImageManipulator.manipulateAsync(
        photoWithWhiteBg,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const finalPhoto = await ImageManipulator.manipulateAsync(
        croppedPhoto.uri,
        [{ resize: { width: outputWidthPx, height: outputHeightPx } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      let dest;
      if (isReEdit === 'true' && processedUri) {
        dest = processedUri;
      } else {
        const originalFilename = photoUri.split('/').pop();
        const baseName = originalFilename.split('.')[0];
        const randomNumber = Math.floor(Math.random() * 1000000);
        const filename = `${baseName}_${country}_processed_${randomNumber}.jpg`;
        dest = photosDir + filename;
      }

      await FileSystem.copyAsync({ from: finalPhoto.uri, to: dest });
      router.replace({ pathname: '/', params: { tab: 'processed' } });
    } catch (error) {
        console.error("Error saving photo: ", error);
        setError("Could not save the photo. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => { scale.value = savedScale.value * e.scale; })
    .onEnd(() => { savedScale.value = scale.value; });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
    });
    
  const composedGesture = Gesture.Race(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (isLoading && !photoWithWhiteBg) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>Preparing photo...</Text>
      </View>
    );
  }

  const requirements = getPassportRequirements(country);
  const { outputWidthPx, outputHeightPx, headHeightMaxPx } = requirements;
  const containerAspectRatio = outputWidthPx / outputHeightPx;
  const containerWidth = screenWidth * 0.9;
  const containerHeight = containerWidth / containerAspectRatio;
  const scaleFactor = containerWidth / outputWidthPx;
  const ovalHeight = headHeightMaxPx * scaleFactor;
  const ovalWidth = ovalHeight * 0.75;

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.instructions}>Position your face within the oval.</Text>
        <GestureDetector gesture={composedGesture}>
          <View style={[styles.photoContainer, { width: containerWidth, height: containerHeight }]}>
            {photoWithWhiteBg && (
              <Animated.Image
                source={{ uri: photoWithWhiteBg }}
                style={[{ width: imageSize.width, height: imageSize.height }, animatedStyle]}
              />
            )}
            <View style={styles.overlay}>
                <View style={[styles.oval, { width: ovalWidth, height: ovalHeight }]} />
            </View>
          </View>
        </GestureDetector>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5F9',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#0f1419',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photoContainer: {
    backgroundColor: '#f7f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eff3f4',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oval: {
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: '#1d9bf0',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(29, 155, 240, 0.1)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  saveButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 14,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F5F9',
    borderWidth: 1,
    borderColor: '#cfd9de',
    paddingVertical: 14,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#F0F4F8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#0f1419',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#536471',
    marginTop: 12,
    fontSize: 16,
  },
});

export default AdjustPhotoPage;
