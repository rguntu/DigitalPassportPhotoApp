
import { StyleSheet, Text, View, Button, Alert } from "react-native";
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function Page() {
  const takePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      Alert.alert("Take Photo", "Camera functionality will be implemented here.");
    } else {
      Alert.alert("Permission Denied", "Camera permission is required to take photos.");
    }
  };

  const uploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        Alert.alert("Upload Photo", "Selected image: " + result.assets[0].uri);
      } else {
        Alert.alert("Upload Photo", "Image selection cancelled.");
      }
    } else {
      Alert.alert("Permission Denied", "Media library permission is required to upload photos.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>Digital Passport Photo App</Text>
        <View style={styles.buttonContainer}>
          <Button title="Take Photo" onPress={takePhoto} />
          <Button title="Upload Photo" onPress={uploadPhoto} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#38434D",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
    gap: 10,
  },
});
