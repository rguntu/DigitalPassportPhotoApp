import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { useRef } from 'react';
import ViewShot from 'react-native-view-shot';

export default function SixPhotoPreviewScreen() {
  const router = useRouter();
  const { photoUri, photoCount: paramPhotoCount } = useLocalSearchParams();
  const actualPhotoCount = paramPhotoCount ? parseInt(paramPhotoCount, 10) : 6;
  const viewShotRef = useRef();

  const printWidth = 1200;
  const printHeight = 1800;

  const handlePrint = async () => {
    if (!photoUri) return;
    try {
      Image.getSize(photoUri, async (width, height) => {
        const isSquare = Math.abs(width - height) < 10;
        const photoGridItems = Array.from({ length: actualPhotoCount }).map(() => `
          <div class="grid-item">
            <img src="${photoUri}" class="${isSquare ? 'photo-square' : 'photo-rectangular'}" />
          </div>
        `).join('');

        const html = `
          <html>
            <head>
              <style>
                @page { size: 4in 6in; margin: 0; }
                body { margin: 0; width: 1200px; height: 1800px; background-color: white; }
                .grid-container { display: grid; grid-template-columns: 600px 600px; grid-template-rows: 600px 600px 600px; width: 100%; height: 100%; }
                .grid-item { box-sizing: border-box; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                img { display: block; }
                .photo-square { width: 600px; height: 600px; }
                .photo-rectangular { width: 1050px; height: 1350px; transform: scale(0.444); }
              </style>
            </head>
            <body><div class="grid-container">${photoGridItems}</div></body>
          </html>
        `;

        await Print.printAsync({ html });
      });
    } catch (error) {
      if (error.code !== 'CANCELLED' && (!error.message || !error.message.includes('Printing did not complete'))) {
        Alert.alert("Printing Error", "Could not print the photo. Please try again later.");
        console.error("Printing error:", error);
      }
    }
  };

  const handleShare = async () => {
    if (!photoUri) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available", "Sharing is not available on this device.");
      return;
    }
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg' });
    } catch (error) {
        Alert.alert("Sharing Error", "Could not share the photo. Please try again later.");
        console.error("Sharing error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot 
        ref={viewShotRef} 
        options={{ width: printWidth, height: printHeight, format: 'jpeg', quality: 0.9 }}
        style={{ position: 'absolute', top: -9999, left: -9999 }} 
      >
        <View style={styles.photoContainer}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.gridPhotoContainer, i < actualPhotoCount && styles.gridItemBorder]}>
              {i < actualPhotoCount && photoUri && (
                <Image style={styles.photo} source={{ uri: photoUri }} />
              )}
            </View>
          ))}
        </View>
      </ViewShot>

      <Text style={styles.title}>Your Photos are Ready!</Text>
      
      <View style={styles.previewContainer}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.previewGridItem, i < actualPhotoCount && styles.gridItemBorder]}>
            {i < actualPhotoCount && photoUri && (
              <Image style={styles.photo} source={{ uri: photoUri }} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.materialButton} onPress={handlePrint}>
              <MaterialIcons name="print" size={24} color="white" />
              <Text style={styles.materialButtonText}>Print Sheet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.materialButton} onPress={handleShare}>
              <MaterialIcons name="share" size={24} color="white" />
              <Text style={styles.materialButtonText}>Share Photo</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d6e5f1ff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    photoContainer: {
        width: 1200,
        height: 1800,
        backgroundColor: 'white',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridPhotoContainer: {
        width: 600,
        height: 600,
        boxSizing: 'border-box',
    },
    previewContainer: {
        width: '90%',
        aspectRatio: 4 / 6,
        backgroundColor: 'white',
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 5,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    previewGridItem: {
        width: '50%',
        aspectRatio: 1,
        boxSizing: 'border-box',
    },
    gridItemBorder: {
      borderColor: '#ccc',
      borderWidth: 1,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    materialButton: {
        backgroundColor: '#198ff0ff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        width: '48%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        elevation: 3,
    },
    materialButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginLeft: 10,
    },
});
