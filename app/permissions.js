import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
      <Text style={styles.title}>Welcome to ID Photo!</Text>
      <Text style={styles.text}>
        To get started, we need your permission to access the camera and photo library.
      </Text>
      <TouchableOpacity style={styles.button} onPress={requestPermissions}>
        <Text style={styles.buttonText}>Grant Permissions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0F5F9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#0f1419',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#536471',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
  },
  buttonText: {
    color: '#F0F4F8',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PermissionsPage;
