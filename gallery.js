import { StyleSheet, Text, View, FlatList, Image, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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


const photosDir = FileSystem.documentDirectory + 'photos/';

export default function Gallery() {
  const [unprocessedPhotos, setUnprocessedPhotos] = useState([]);
  const [processedPhotos, setProcessedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('unprocessed');
  const [isProcessing, setIsProcessing] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [model, setModel] = useState(null);
  const [highlightedPhotoUri, setHighlightedPhotoUri] = useState(null);
  const router = useRouter();

  const loadModel = async () => {
    await tf.ready();
    const loadedModel = await blazeface.load();
    setModel(loadedModel);
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

  const processPhoto = async (uri) => {
    if (!model) {
      Alert.alert("Error", "Model not loaded yet. Please wait.");
      return;
    }
    setIsProcessing(uri);
    try {
      // 1. Duplicate Photo
      console.log("Processing: Duplicating photo...");
      const duplicatedUri = `${FileSystem.cacheDirectory}${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: duplicatedUri });

      // 2. Face Detection with BlazeFace
      setProcessingStatus("Detecting face...");
      const predictions = await detectFaceWithBlazeFace(duplicatedUri);

      if (predictions.length === 0) {
        Alert.alert("Error", "No face detected in the photo.");
        setIsProcessing(null);
        return;
      }

      const face = predictions[0];
      const topLeft = face.topLeft;
      const bottomRight = face.bottomRight;
      const faceWidth = bottomRight[0] - topLeft[0];
      const faceHeight = bottomRight[1] - topLeft[1];

      // 3. Background Segmentation
      setProcessingStatus("Segmenting background...");
      const removedBgUri = await removeBackground(duplicatedUri);

      // 4. Crop & Resize
      setProcessingStatus("Cropping to passport size...");
      const cropWidth = faceWidth * 2;
      const cropHeight = cropWidth;
      const originX = topLeft[0] - (cropWidth - faceWidth) / 2;
      const originY = topLeft[1] - (cropHeight - faceHeight) / 2;

      const croppedPhoto = await ImageManipulator.manipulateAsync(
        removedBgUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      const finalPhoto = await ImageManipulator.manipulateAsync(
        croppedPhoto.uri,
        [{ resize: { width: 600, height: 600 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      const filename = `${Date.now()}_processed.png`;
      const dest = photosDir + filename;
      await FileSystem.copyAsync({
        from: finalPhoto.uri,
        to: dest,
      });
      await FileSystem.deleteAsync(uri); // Delete original photo
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

  const renderPhoto = ({ item }) => (
    <View style={[styles.photoContainer, item === highlightedPhotoUri && styles.highlightedPhoto]}>
      <Image style={styles.photo} source={{ uri: item }} />
      <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item)}>
        <Text style={styles.deleteButtonText}>X</Text>
      </TouchableOpacity>
      {isProcessing === item ? (
        <View>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.processingStatusText}>{processingStatus}</Text>
        </View>
      ) : (
        !item.includes('_processed') && <Button title="Process Photo" onPress={() => processPhoto(item)} />
      )}
    </View>
  );

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
        data={activeTab === 'unprocessed' ? unprocessedPhotos : processedPhotos}
        keyExtractor={(item) => item}
        numColumns={3}
        renderItem={renderPhoto}
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
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    backgroundColor: 'transparent',
  },
  tab: {
    padding: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  photoContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  processingStatusText: {
    marginTop: 5,
    fontSize: 12,
    color: 'white',
  },
  highlightedPhoto: {
    borderWidth: 3,
    borderColor: 'white',
  },
});