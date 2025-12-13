import { StyleSheet, Text, View, Image, Alert, TouchableOpacity, Modal } from "react-native";
import { CameraView, Camera } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Gallery from '../gallery';
import PaymentProcessModal from './payment_process';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PermissionsPage from './permissions';
import PaymentScreen from "./payment"; // Import the PaymentScreen
import HelperScreen from './helper'; // Import the HelperScreen
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const photosDir = FileSystem.documentDirectory + 'photos/';

export default function Page() {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [photo, setPhoto] = useState();
  const [showCamera, setShowCamera] = useState(false);
  const [showPaymentProcessModal, setShowPaymentProcessModal] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false); // New state for our JS modal
  const [showHelperScreen, setShowHelperScreen] = useState(false);
  const [paymentResetKey, setPaymentResetKey] = useState(0);
  const [paymentProcessUri, setPaymentProcessUri] = useState(null);
  const [photoCount, setPhotoCount] = useState(6);
  const cameraRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkPermissions = async () => {
      const cameraPermission = await Camera.getCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted') {
        setHasPermissions(true);
      }
    };
    checkPermissions();

    const checkHelperScreen = async () => {
      const value = await AsyncStorage.getItem('showHelperScreen');
      if (value === null) {
        setShowHelperScreen(true);
      }
    };
    checkHelperScreen();
  }, []);

  const { tab = 'unprocessed', openHelper } = useLocalSearchParams();

  useEffect(() => {
    if (openHelper) {
      setShowHelperScreen(true);
    }
  }, [openHelper]);
  const handleOpenHelper = () => {
    setShowHelperScreen(true);
  };

  const handleDismissHelper = async () => {
    await AsyncStorage.setItem('showHelperScreen', 'false');
    setShowHelperScreen(false);
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

  // This function is now called from PaymentProcessModal to show our new JS modal
  const handleProcessPayment = (uri) => {
    setShowPaymentProcessModal(false); // Close the first modal
    setPaymentProcessUri(uri);
    setPaymentResetKey(Date.now()); // Generate a new key to force re-initialization
    setShowPaymentScreen(true); // Open the PaymentScreen modal
  };

  // This is passed to PaymentScreen and called on success
  const handlePaymentSuccess = async (photoUri) => {
    try {
      const newUri = photoUri.replace('_processed.jpg', '_processed_paid.jpg');
      await FileSystem.moveAsync({
        from: photoUri,
        to: newUri,
      });
      setShowPaymentScreen(false);
      router.push({ pathname: '/share_print', params: { photoUri: newUri } });
    } catch (error) {
      console.error("Error renaming photo after payment:", error);
      Alert.alert("Error", "Could not update photo status after payment.");
      setShowPaymentScreen(false);
    }
  };


  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }
  };

  if (!hasPermissions) {
    return <PermissionsPage onPermissionsGranted={() => setHasPermissions(true)} />;
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const newPhoto = await cameraRef.current.takePictureAsync({ base64: true });
      setPhoto(newPhoto);
      setShowCamera(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      Image.getSize(uri, (width, height) => {
        if (width < 600 || height < 600) {
          Alert.alert(
            'Image Resolution Too Low',
            `The selected photo is too small (${width}x${height} pixels). Please choose an image with a minimum resolution of 600x600 pixels to ensure good print quality.`
          );
        } else {
          setPhoto({ uri: uri, base64: null });
        }
      });
    }
  };

  const savePhoto = async () => {
    await ensureDirExists();
    const filename = `${Date.now()}.jpg`;
    const dest = photosDir + filename;
    await FileSystem.copyAsync({
      from: photo.uri,
      to: dest,
    });
    setPhoto(undefined);
    router.replace({ pathname: '/', params: { tab: 'unprocessed' } });
  };

  const handlePhotoPress = () => {
    if (photo && photo.uri) {
      router.push({
        pathname: '/adjust_photo',
        params: {
          photoUri: photo.uri,
          photoBase64: photo.base64,
        },
      });
    }
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handlePhotoPress} style={{ flex: 1 }}>
        <Image style={styles.paymentProcess} source={{ uri: photo.uri || "data:image/jpg;base64," + photo.base64 }} />
        </TouchableOpacity>
        <View style={styles.centeredButtonContainer}>
          <TouchableOpacity style={styles.materialButton} onPress={savePhoto}>
            <Text style={styles.materialButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.materialButton} onPress={() => setPhoto(undefined)}>
            <Text style={styles.materialButtonText}>Discard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity style={styles.materialButton} onPress={takePhoto}>
              <Text style={styles.materialButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.materialButton} onPress={() => setShowCamera(false)}>
              <Text style={styles.materialButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Modal
        visible={showHelperScreen}
        animationType="slide"
        onRequestClose={handleDismissHelper}
      >
        <HelperScreen onDismiss={handleDismissHelper} />
      </Modal>
      <View style={styles.galleryContainer}>
        <Gallery initialTab={tab} onPhotoPress={handleProcessPayment} />
      </View>
      <View style={styles.mainButtonContainer}>
        <TouchableOpacity style={styles.materialButton} onPress={() => setShowCamera(true)}>
          <Text style={styles.materialButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.materialButton} onPress={pickImage}>
          <Text style={styles.materialButtonText}>Upload Photo</Text>
        </TouchableOpacity>
      </View>
      
      {/* This is the first modal, which leads to the payment screen */}
      <PaymentProcessModal 
        isVisible={showPaymentProcessModal} 
        onClose={handleClosePaymentProcess} 
        uri={paymentProcessUri} 
        photoCount={photoCount} 
        onProcessPayment={handleProcessPayment} // Changed prop name
      />

      {/* This is our new, reliable JS-based modal for the PaymentScreen */}
      <Modal
        visible={showPaymentScreen}
        animationType="slide"
        onRequestClose={() => setShowPaymentScreen(false)}
      >
        <PaymentScreen 
          photoUri={paymentProcessUri}
          onPurchaseSuccess={handlePaymentSuccess}
          onGoBack={() => setShowPaymentScreen(false)}
          resetKey={paymentResetKey}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#d6e5f1ff',
    justifyContent: 'space-between',
    paddingBottom: 20,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#d6e5f1ff',
  },
  galleryContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 0,
    paddingBottom: 20,
    justifyContent: 'space-around',
  },
  mainButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
    alignSelf: 'center',
  },
  materialButton: {
    backgroundColor: '#198ff0ff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '40%',
  },
  materialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentProcess: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  centeredButtonContainer: {
    flex: 0.2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
