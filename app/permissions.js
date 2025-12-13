import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const PermissionsPage = ({ onPermissionsGranted }) => {
  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted') {
      onPermissionsGranted();
    } else {
      Alert.alert(
        'Permissions Required',
        'Both camera and photo library permissions are required to use this app.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the App!</Text>
      <Text style={styles.text}>
        To get started, we need your permission to access the camera and photo library.
      </Text>
      <Button title="Grant Permissions" onPress={requestPermissions} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#d6e5f1ff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default PermissionsPage;
