import { StyleSheet, Text, View, FlatList, Image, Button } from 'react-native';
import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import { removeBackground } from '@jacobjmc/react-native-background-remover';


const photosDir = FileSystem.documentDirectory + 'photos/';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const router = useRouter();

  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }
  };

  const loadPhotos = async () => {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(photosDir);
    setPhotos(files.map(file => photosDir + file));
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const processPhoto = async (uri) => {
    try {
      const removedBgUri = await removeBackground(uri);
      const croppedPhoto = await ImageManipulator.manipulateAsync(
        removedBgUri,
        [{ crop: { originX: 0, originY: 0, width: 600, height: 600 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      const filename = `${Date.now()}_processed.png`;
      const dest = photosDir + filename;
      await FileSystem.copyAsync({
        from: croppedPhoto.uri,
        to: dest,
      });
      loadPhotos();
    } catch (error) {
      console.error("Error processing photo: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={styles.photoContainer}>
            <Image style={styles.photo} source={{ uri: item }} />
            <Button title="Crop/Resize" onPress={() => processPhoto(item)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  photoContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  photo: {
    flex: 1,
  },
});