import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import { removeBackground } from '@jacobjmc/react-native-background-remover';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as blazeface from '@tensorflow-models/blazeface';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as ExpoGl from 'expo-gl';
import { getPassportRequirements, passportConfigs } from './passportConfig';


const photosDir = FileSystem.documentDirectory + 'photos/';

const countries = [
  { label: 'US', value: 'US' },
  { label: 'UK', value: 'UK' },
];

const GalleryPhoto = ({ item, highlightedPhotoUri, isProcessing, processingStatus, deletePhoto, processPhoto, onPressProcessedPhoto }) => {
  const isProcessed = item.includes('_processed');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const selectCountry = (countryValue) => {
    setSelectedCountry(countryValue);
    setShowCountryPicker(false);
    processPhoto(item, countryValue);
  };

  return (
    <View style={styles.cellContainer}>
      <View style={[styles.photoContainer, item === highlightedPhotoUri && styles.highlightedPhoto]}>
        <TouchableOpacity
          onPress={() => {
            if (isProcessed) {
              onPressProcessedPhoto(item);
            } else {
              setShowCountryPicker(true);
            }
          }}
          disabled={isProcessing === item}
        >
          <Image
            style={styles.photo}
            source={{ uri: item }}
            onError={(e) => {
              console.error("GalleryPhoto: Image loading error:", e.nativeEvent.error, "for URI:", item);
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item)}>
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
        {isProcessing === item && (
          <View style={styles.overlayContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.processingStatusText}>{processingStatus}</Text>
          </View>
        )}
      </View>
      {!isProcessed && (
        <>
          <TouchableOpacity onPress={() => setShowCountryPicker(true)} style={styles.countrySelectorButton}>
            <Text style={styles.countrySelectorButtonText}>
              {selectedCountry || 'Select Country'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showCountryPicker}
            onRequestClose={() => setShowCountryPicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setShowCountryPicker(false)}
            >
              <View style={styles.modalContainer}>
                <FlatList
                  data={countries}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryItem}
                      onPress={() => selectCountry(item.value)}
                    >
                      <Text style={styles.countryItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}
    </View>
  );
};

export default function Gallery({ onPressProcessedPhoto }) {
  const [unprocessedPhotos, setUnprocessedPhotos] = useState([]);
  const [processedPhotos, setProcessedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('unprocessed');
  const [isProcessing, setIsProcessing] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [model, setModel] = useState(null);
  const [highlightedPhotoUri, setHighlightedPhotoUri] = useState(null);
  const router = useRouter();

  const loadModel = async () => {
    try {
      await tf.ready();
      const model = await blazeface.load();
      setModel(model);
    } catch (error) {
      console.error("Error loading BlazeFace model: ", error);
      Alert.alert("Model Error", "Could not load the face detection model. Please check your internet connection and try again.");
    }
  };

  useState(() => {
    loadModel();
  }, []);

  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }
  };

  const loadPhotos = async () => {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(photosDir);
    const allPhotos = files.map(file => photosDir + file).sort().reverse();
    setUnprocessedPhotos(allPhotos.filter(file => !file.includes('_processed')));
    setProcessedPhotos(allPhotos.filter(file => file.includes('_processed')));
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  useEffect(() => {
    if (highlightedPhotoUri) {
      const timer = setTimeout(() => {
        setHighlightedPhotoUri(null);
      }, 3000); // Highlight for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedPhotoUri, activeTab]);

  const detectFaceWithBlazeFace = async (uri) => {
    const imgB64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
    const raw = new Uint8Array(imgBuffer);
    const imageTensor = decodeJpeg(raw);
    const predictions = await model.estimateFaces(imageTensor, false);
    return predictions;
  };

  const processPhoto = async (uri, countryCode) => {
    if (!model) {
      Alert.alert("Error", "Model not loaded yet. Please wait.");
      return;
    }
    if (!countryCode) {
      Alert.alert("Error", "Please select a country before processing the photo.");
      return;
    }
    setIsProcessing(uri);
    try {
      const requirements = getPassportRequirements(countryCode);
      const { outputWidthPx, outputHeightPx, headHeightMinPx, headHeightMaxPx, eyeHeightFromBottomMinPx, eyeHeightFromBottomMaxPx } = requirements;

      // 1. Duplicate Photo
      console.log("Processing: Duplicating photo...");
      const duplicatedUri = `${FileSystem.cacheDirectory}${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: duplicatedUri });

      // Rotate image to portrait if needed (assuming 0 degrees is portrait)
      const rotatedUri = await ImageManipulator.manipulateAsync(
        duplicatedUri,
        [{ rotate: 0 }], // Rotate to 0 degrees (portrait)
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Face Detection with BlazeFace
      setProcessingStatus("Detecting face...");
      const predictions = await detectFaceWithBlazeFace(rotatedUri.uri);

      if (predictions.length === 0) {
        Alert.alert("Error", "No face detected in the photo. Please ensure your face is clearly visible and well-lit.");
        setIsProcessing(null);
        return;
      }

      const face = predictions[0];
      const topLeft = face.topLeft; // [x, y] of top-left corner of face bounding box
      const bottomRight = face.bottomRight; // [x, y] of bottom-right corner of face bounding box

      const detectedFaceWidth = bottomRight[0] - topLeft[0];
      const detectedFaceHeight = bottomRight[1] - topLeft[1];
      const detectedEyeCenterY = topLeft[1] + (detectedFaceHeight * 0.35); // Approximate eye center

      // Get image dimensions after background removal
      setProcessingStatus("Segmenting background...");
      const removedBgUri = await removeBackground(duplicatedUri);
      const { width: imgWidth, height: imgHeight } = await new Promise((resolve, reject) => {
        Image.getSize(removedBgUri, (width, height) => resolve({ width, height }), reject);
      });

      // 4. Calculate Crop & Resize based on Passport Requirements
      setProcessingStatus("Cropping to passport size...");

      // Calculate the target head height and eye height in the final output image
      // Aim for the minimum head height to reduce zooming in
      const targetHeadHeight = headHeightMinPx;
      const targetEyeHeightFromBottom = (eyeHeightFromBottomMinPx + eyeHeightFromBottomMaxPx) / 2; // Aim for the middle

      // Calculate the scale factor needed to make the detected face height match the target head height
      let scaleFactor = targetHeadHeight / detectedFaceHeight;

      // Ensure the scale factor doesn't make the face larger than headHeightMaxPx
      const maxScaleFactor = headHeightMaxPx / detectedFaceHeight;
      scaleFactor = Math.min(scaleFactor, maxScaleFactor);

      // Calculate the scaled dimensions of the original image
      const scaledImgWidth = imgWidth * scaleFactor;
      const scaledImgHeight = imgHeight * scaleFactor;

      // Calculate the scaled position of the detected face and eye center
      const scaledTopLeftX = topLeft[0] * scaleFactor;
      const scaledTopLeftY = topLeft[1] * scaleFactor;
      const scaledDetectedEyeCenterY = detectedEyeCenterY * scaleFactor;

      // Calculate the target eye position from the top of the final output image
      const targetEyeYFromTop = outputHeightPx - targetEyeHeightFromBottom;

      // Calculate the vertical offset needed to align eyes in the scaled image
      const offsetY = targetEyeYFromTop - scaledDetectedEyeCenterY;

      // Calculate the crop origin in the scaled image's coordinate system
      let cropOriginXScaled = (scaledImgWidth / 2) - (outputWidthPx / 2);
      let cropOriginYScaled = scaledTopLeftY + offsetY; // Adjust based on scaled face top and eye offset

      // Convert crop origin back to original image's coordinate system
      let originX = cropOriginXScaled / scaleFactor;
      let originY = cropOriginYScaled / scaleFactor;

      // Calculate crop width and height in the original image's coordinate system
      let cropWidth = outputWidthPx / scaleFactor;
      let cropHeight = outputHeightPx / scaleFactor;

      // Ensure crop rectangle is within image bounds
      originX = Math.max(0, originX);
      originY = Math.max(0, originY);
      cropWidth = Math.min(cropWidth, imgWidth - originX);
      cropHeight = Math.min(cropHeight, imgHeight - originY);

      const croppedPhoto = await ImageManipulator.manipulateAsync(
        removedBgUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      const finalPhoto = await ImageManipulator.manipulateAsync(
        croppedPhoto.uri,
        [{ resize: { width: outputWidthPx, height: outputHeightPx } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      const originalFilename = uri.split('/').pop();
      const baseName = originalFilename.split('.')[0];
      const filename = `${baseName}_processed.png`;
      const dest = photosDir + filename;
      await FileSystem.copyAsync({
        from: finalPhoto.uri,
        to: dest,
      });
      // await FileSystem.deleteAsync(uri); // Keep original photo
      loadPhotos();
      setHighlightedPhotoUri(dest);
      setActiveTab('processed');
    } catch (error) {
      console.error("Error processing photo: ", error);
      Alert.alert("Error", "An error occurred while processing the photo.");
    } finally {
      setIsProcessing(null);
      setProcessingStatus(''); // Clear processing status
    }
  };

  const deletePhoto = async (uri) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await FileSystem.deleteAsync(uri);
            loadPhotos();
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }) => {
    return (
      <GalleryPhoto
        item={item}
        highlightedPhotoUri={highlightedPhotoUri}
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        deletePhoto={deletePhoto}
        processPhoto={processPhoto}
        onPressProcessedPhoto={onPressProcessedPhoto}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('unprocessed')} style={[styles.tab, activeTab === 'unprocessed' && styles.activeTab]}>
          <Text style={styles.tabText}>Unprocessed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('processed')} style={[styles.tab, activeTab === 'processed' && styles.activeTab]}>
          <Text style={styles.tabText}>Processed</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={activeTab}
        data={activeTab === 'unprocessed' ? unprocessedPhotos : processedPhotos}
        keyExtractor={(item) => item}
        numColumns={2}
        renderItem={renderPhoto}
        style={{ marginTop: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BBDEFB',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    width: '96%', // Match approximate width of photo grid
    alignSelf: 'center', // Center the tab container
    marginTop: 10, // Add a small top margin for separation from the top of the screen
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: '48%', // Distribute width evenly for two tabs
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0c4d9dee',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  cellContainer: {
    width: '45%',
    margin: '2.5%',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    marginBottom: 0, // Ensure no gap between photo and country selector
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(102, 119, 140, 0.7)', // Lighter blue with some transparency
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  highlightedPhoto: {
    borderWidth: 3,
    borderColor: 'white',
  },
  countrySelectorButton: {
    backgroundColor: '#0c4d9dee',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0, // Ensure no gap
  },
  countrySelectorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14, // Reduced font size
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    maxHeight: '50%',
  },
  countryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryItemText: {
    fontSize: 16,
    color: 'black',
  },
});