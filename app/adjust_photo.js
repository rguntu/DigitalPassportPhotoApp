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

        // Convert to JPEG to fill transparent background with white
        const whiteBgPhoto = await ImageManipulator.manipulateAsync(
          removedBgUri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        setPhotoWithWhiteBg(whiteBgPhoto.uri);
        Image.getSize(whiteBgPhoto.uri, (width, height) => {
          setImageSize({ width, height });

          // Calculate initial scale to "cover" the container
          const requirements = getPassportRequirements(country);
          const { outputWidthPx, outputHeightPx } = requirements;
          const containerAspectRatio = outputWidthPx / outputHeightPx;
          const containerWidth = screenWidth * 0.9;
          const containerHeight = containerWidth / containerAspectRatio;
          const initialScale = Math.max(containerWidth / width, containerHeight / height);

          scale.value = initialScale;
          savedScale.value = initialScale;
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

      // 1. Get container (viewport) dimensions
      const containerAspectRatio = outputWidthPx / outputHeightPx;
      const containerWidth = screenWidth * 0.9;
      const containerHeight = containerWidth / containerAspectRatio;

      // 2. Calculate the initial display size of the image (due to resizeMode: 'contain')
      if (imageSize.width === 0 || imageSize.height === 0) {
        throw new Error("Image dimensions are not yet available.");
      }
      
      // 3. Calculate the ratio of original image pixels to final displayed pixels (including user zoom)
      const ratio = imageSize.width / (imageSize.width * scale.value);

      // 4. Calculate the crop rectangle in original image coordinates.
      const cropWidth = containerWidth * ratio;
      const cropHeight = containerHeight * ratio;
      const originX = (imageSize.width / 2) - (cropWidth / 2) - (translateX.value * ratio);
      const originY = (imageSize.height / 2) - (cropHeight / 2) - (translateY.value * ratio);
      
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
        // If re-editing, overwrite the existing processed file.
        dest = processedUri;
      } else {
        // Otherwise, create a new processed file name.
        const originalFilename = photoUri.split('/').pop();
        const baseName = originalFilename.split('.')[0];
        const filename = `${baseName}_processed.jpg`;
        dest = photosDir + filename;
      }

      await FileSystem.copyAsync({
        from: finalPhoto.uri,
        to: dest,
      });
      
      router.replace({ pathname: '/', params: { tab: 'processed' } });
    } catch (error) {
        console.error("Error saving photo: ", error);
        setError("Could not save the photo. Please try again.");
    } finally {
        setIsLoading(false);
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
    
  const composedGesture = Gesture.Race(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));


  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Preparing your photo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const requirements = getPassportRequirements(country);
  const { outputWidthPx, outputHeightPx, headHeightMinPx, headHeightMaxPx } = requirements;

  const containerAspectRatio = outputWidthPx / outputHeightPx;
  const containerWidth = screenWidth * 0.9;
  const containerHeight = containerWidth / containerAspectRatio;

  const scaleFactor = containerWidth / outputWidthPx;

  const ovalHeight = headHeightMaxPx * scaleFactor;
  const ovalWidth = ovalHeight * 0.75; // A common aspect ratio for head ovals

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.instructions}>Adjust your photo to fit within the oval.</Text>
        <GestureDetector gesture={composedGesture}>
          <View style={[styles.photoContainer, { width: containerWidth, height: containerHeight }]}>
            {photoWithWhiteBg && (
              <Animated.Image
                source={{ uri: photoWithWhiteBg }}
                style={[
                  { width: imageSize.width, height: imageSize.height },
                  animatedStyle
                ]}
              />
            )}
            <View style={styles.overlay}>
                <View style={[styles.oval, { width: ovalWidth, height: ovalHeight }]} />
            </View>
          </View>
        </GestureDetector>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isLoading}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Saving...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 30,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    color: '#333',
  },
  photoContainer: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oval: {
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: '#cccccc',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(204, 204, 204, 0.3)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  saveButton: {
    backgroundColor: '#198ff0ff',
    paddingVertical: 15,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
});

export default AdjustPhotoPage;
