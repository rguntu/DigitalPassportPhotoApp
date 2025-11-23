import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';

export default function SixPhotoPreviewScreen() {
  const router = useRouter();
  const { photoUri, photoCount: paramPhotoCount } = useLocalSearchParams();
  const actualPhotoCount = paramPhotoCount ? parseInt(paramPhotoCount, 10) : 6;

  const handlePrint = async () => {
    if (!photoUri) return;
    try {
      const photoGridItems = Array.from({ length: actualPhotoCount }).map(() => `
                <div class="grid-item"><img src="${photoUri}" /></div>
              `).join('');

      const html = `
        <html>
          <head>
            <style>
              @page {
                size: 4in 6in;
                margin: 0;
              }
              body {
                margin: 0;
                width: 4in;
                height: 6in;
              }
              .grid-container {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                height: 100%;
              }
              .grid-item {
                width: 2in;
                height: 2in;
                box-sizing: border-box;
              }
              img {
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            <div class="grid-container">
              ${photoGridItems}
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
      });
    } catch (error) {
      if (error.code === 'CANCELLED' || (error.message && error.message.includes('Printing did not complete'))) {
        // User cancelled the print job, so we don't need to show an error
        return;
      }
      Alert.alert("Printing Error", "Could not print the photo. Please try again later.");
      console.error("Printing error:", error);
    }
  };

  const handleShare = async () => {
    if (!photoUri) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available", "Sharing is not available on this device.");
      return;
    }
    try {
      await Sharing.shareAsync(photoUri);
    } catch (error) {
        Alert.alert("Sharing Error", "Could not share the photo. Please try again later.");
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Your Photos are Ready!</Text>
        <View style={styles.photoContainer}>
        {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.gridPhotoContainer}>
            {i < actualPhotoCount && photoUri && (
                <Image
                style={styles.photo}
                source={{ uri: photoUri }}
                />
            )}
            </View>
        ))}
        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.materialButton} onPress={handlePrint}>
                <Text style={styles.materialButtonText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.materialButton} onPress={handleShare}>
                <Text style={styles.materialButtonText}>Share</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace({ pathname: '/', params: { tab: 'processed' } })}>
            <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
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
        color: 'white',
    },
    photoContainer: {
        width: '90%',
        aspectRatio: 4 / 6,
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        alignContent: 'space-around',
        marginBottom: 30,
    },
    gridPhotoContainer: {
        width: '48%',
        aspectRatio: 1,
        padding: 2,
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
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        width: '45%',
    },
    materialButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backButton: {
        marginTop: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#66778c',
        borderRadius: 20,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
    },
});
