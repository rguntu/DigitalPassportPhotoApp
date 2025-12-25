import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import { getPassportRequirements } from '../passportConfig';

export default function SixPhotoPreviewScreen() {
  const router = useRouter();
  const { photoUri, photoCount: paramPhotoCount, country = 'US' } = useLocalSearchParams();
  const actualPhotoCount = paramPhotoCount ? parseInt(paramPhotoCount, 10) : 6;
  const viewShotRef = useRef();

  console.log('SharePrintScreen received country:', country);

  const requirements = getPassportRequirements(country);
  console.log('Requirements for', country, ':', requirements);
  const { outputWidthPx, outputHeightPx } = requirements;

  // Dimensions for the overall print sheet (e.g., a 4x6 inch sheet for 6 photos)
  const printSheetWidth = outputWidthPx * 2; // For two columns
  const printSheetHeight = outputHeightPx * 3; // For three rows

  console.log('Print sheet dimensions (calculated):', printSheetWidth, 'x', printSheetHeight);
  console.log('Photo URI for printing/sharing (received):', photoUri);

  const handlePrint = async () => {
    if (!photoUri) return;

    const dpi = 300;
    const photoWidthIn = 35 / 25.4; 
    const photoHeightIn = 45 / 25.4;

    const printSheetWidthIn = 4;
    const printSheetHeightIn = 6;

    const photosToPrint = 6;

    try{
      const photoGridItems = Array.from({ length: photosToPrint }).map(() => `
        <img src="${photoUri}" style="width: ${photoWidthIn}in; height: ${photoHeightIn}in; margin: 0.05in;" />
      `).join('');

      const html = `
        <html>
          <head>
            <style>
              @page { size: ${printSheetWidthIn}in ${printSheetHeightIn}in; margin: 0; }
              body { margin: 0; width: ${printSheetWidthIn}in; height: ${printSheetHeightIn}in; display: flex; flex-wrap: wrap; align-content: flex-start; }
              img { display: block; }
            </style>
          </head>
          <body>${photoGridItems}</body>
        </html>
      `;

      await Print.printAsync({ html });
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
      await Sharing.shareAsync(photoUri, { mimeType: 'image/jpeg', UTI: 'public.jpeg' });
    } catch (error) {
        Alert.alert("Sharing Error", "Could not share the photo. Please try again later.");
        console.error("Sharing error:", error);
    }
  };

  const previewPhotoWidth = (Dimensions.get('window').width * 0.9) / 2; // 90% of screen width, divided by 2 for two columns
  const previewPhotoHeight = previewPhotoWidth * (outputHeightPx / outputWidthPx);

  const dynamicStyles = StyleSheet.create({
    photoContainer: { // This container is for the ViewShot, it needs to match the printSheet dimensions
        width: printSheetWidth,
        height: printSheetHeight,
        backgroundColor: 'white',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridPhotoContainer: {
        width: printSheetWidth / 2, // Half the sheet width for two columns
        height: printSheetHeight / 3, // Third of the sheet height for three rows
        boxSizing: 'border-box',
    },
    previewContainer: {
        width: '90%',
        aspectRatio: printSheetWidth / printSheetHeight, // Maintain the aspect ratio of the full sheet
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
        width: '50%', // Each preview item is half the width of the previewContainer
        aspectRatio: outputWidthPx / outputHeightPx, // Aspect ratio of a single photo
        boxSizing: 'border-box',
    },
    photo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain', // Ensure the image fits within its bounds without cropping
    },
  });

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        options={{ width: printSheetWidth, height: printSheetHeight, format: 'png', quality: 0.9 }}
        style={{ position: 'absolute', top: -9999, left: -9999 }}
      >
        <View style={dynamicStyles.photoContainer}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[dynamicStyles.gridPhotoContainer, i < actualPhotoCount && styles.gridItemBorder]}>
              {i < actualPhotoCount && photoUri && (
                <Image style={dynamicStyles.photo} source={{ uri: photoUri }} />
              )}
            </View>
          ))}
        </View>
      </ViewShot>

      <Text style={styles.title}>Your Photos are Ready!</Text>

      <View style={dynamicStyles.previewContainer}>
        {[...Array(6)].map((_, i) => (
            <View key={i} style={[dynamicStyles.previewGridItem, i < actualPhotoCount && styles.gridItemBorder]}>
              {i < actualPhotoCount && photoUri && (
                  <Image style={dynamicStyles.photo} source={{ uri: photoUri }} />
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
  gridItemBorder: {
    borderColor: '#ccc',
    borderWidth: 1,
  },
});
