import { StyleSheet, Text, View, Button, Image, Alert } from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';

const photosDir = FileSystem.documentDirectory + 'photos/';

export default function Page() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState();
  const cameraRef = useRef(null);
  const router = useRouter();

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
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const newPhoto = await cameraRef.current.takePictureAsync({ base64: true });
      setPhoto(newPhoto);
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
            'Resolution Too Low',
            `Photo is too small (${width}×${height}). Please upload a higher resolution image (at least 600×600 pixels).`
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
    router.push('/gallery');
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image style={styles.preview} source={{ uri: photo.uri || "data:image/jpg;base64," + photo.base64 }} />
        <View style={styles.centeredButtonContainer}>
          <Button title="Save" onPress={savePhoto} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <Button title="Take Photo" onPress={takePhoto} />
          <Button title="Upload Photo" onPress={pickImage} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  preview: {
    width: '50%',
    height: '50%',
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  centeredButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});