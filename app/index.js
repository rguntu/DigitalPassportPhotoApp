import { StyleSheet, Text, View, Button, Image } from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

export default function Page() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState();
  const cameraRef = useRef(null);

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
      setPhoto({ uri: result.assets[0].uri, base64: null }); // Assuming you'll handle URI differently from base64
    }
  };

  const sharePhoto = () => {
    Sharing.shareAsync(photo.uri).then(() => {
      setPhoto(undefined);
    });
  };

  const savePhoto = () => {
    setPhoto(undefined);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image style={styles.preview} source={{ uri: photo.uri || "data:image/jpg;base64," + photo.base64 }} />
        <Button title="Share" onPress={sharePhoto} />
        <Button title="Save" onPress={savePhoto} />
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
    alignSelf: 'stretch',
    flex: 1
  }
});