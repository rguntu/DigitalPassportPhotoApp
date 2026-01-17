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

  const requirements = getPassportRequirements(country);
  const { outputWidthPx, outputHeightPx } = requirements;
  const printSheetWidth = outputWidthPx * 2;
  const printSheetHeight = outputHeightPx * 3;

  const handlePrint = async () => {
    if (!photoUri) return;
    const photoWidthIn = 35 / 25.4; 
    const photoHeightIn = 45 / 25.4;
    const printSheetWidthIn = 4;
    const printSheetHeightIn = 6;
    try{
      const photoGridItems = Array.from({ length: 6 }).map(() => `
        <img src="${photoUri}" style="width: ${photoWidthIn}in; height: ${photoHeightIn}in; margin: 0.05in;" />
      `).join('');
      const html = `<html><head><style>@page { size: ${printSheetWidthIn}in ${printSheetHeightIn}in; margin: 0; } body { margin: 0; width: ${printSheetWidthIn}in; height: ${printSheetHeightIn}in; display: flex; flex-wrap: wrap; align-content: flex-start; } img { display: block; }</style></head><body>${photoGridItems}</body></html>`;
      await Print.printAsync({ html });
    } catch (error) {
      if (error.code !== 'CANCELLED') {
        Alert.alert("Print Error", "Could not print photo.");
      }
    }
  };

  const handleShare = async () => {
    if (!photoUri) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
    } catch (error) {
        Alert.alert("Share Error", "Could not share photo.");
    }
  };

  const dynamicStyles = StyleSheet.create({
    previewContainer: {
        width: '90%',
        aspectRatio: printSheetWidth / printSheetHeight,
        backgroundColor: '#F0F5F9',
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 12,
        marginBottom: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eff3f4',
    },
    previewGridItem: {
        width: '50%',
        aspectRatio: outputWidthPx / outputHeightPx,
        borderColor: '#f7f9f9',
        borderWidth: 0.5,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Photos are Ready!</Text>

      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={dynamicStyles.previewContainer}>
          {[...Array(6)].map((_, i) => (
              <View key={i} style={dynamicStyles.previewGridItem}>
                {i < actualPhotoCount && photoUri && (
                    <Image style={dynamicStyles.photo} source={{ uri: photoUri }} />
                )}
              </View>
          ))}
        </View>
      </ViewShot>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.materialButton} onPress={handlePrint}>
          <MaterialIcons name="print" size={24} color="white" />
          <Text style={styles.materialButtonText}>Print Sheet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.materialButton} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color="white" />
          <Text style={styles.materialButtonText}>Share Sheet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#0f1419',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  materialButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '48%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  materialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
