import { StyleSheet, Text, View, Button, Image, Alert, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Gallery from '../gallery';
import PreviewModal from './preview';

const photosDir = FileSystem.documentDirectory + 'photos/';

export default function Page() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState();
  const [showCamera, setShowCamera] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const cameraRef = useRef(null);

  const handleShowPreview = (uri) => {
    setPreviewUri(uri);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewUri(null);
  };

  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: 'white' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
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
    handleShowPreview(dest);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image style={styles.preview} source={{ uri: photo.uri || "data:image/jpg;base64," + photo.base64 }} />
        <View style={styles.centeredButtonContainer}>
          <Button title="Save" onPress={savePhoto} />
          <Button title="Discard" onPress={() => setPhoto(undefined)} />
        </View>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraButtonContainer}>
            <Button title="Take Photo" onPress={takePhoto} />
            <Button title="Cancel" onPress={() => setShowCamera(false)} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.galleryContainer}>
        <Gallery onPressProcessedPhoto={handleShowPreview} />
      </View>
      <View style={styles.mainButtonContainer}>
        <TouchableOpacity style={styles.materialButton} onPress={() => setShowCamera(true)}>
          <Text style={styles.materialButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.materialButton} onPress={pickImage}>
          <Text style={styles.materialButtonText}>Upload Photo</Text>
        </TouchableOpacity>
      </View>
      <PreviewModal isVisible={showPreviewModal} onClose={handleClosePreview} uri={previewUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#BBDEFB',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#BBDEFB',
  },
  galleryContainer: {
    flex: 0.7,
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  materialButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  materialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  preview: {
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