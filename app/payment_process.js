import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';

export default function PaymentProcessModal({ isVisible, onClose, uri, photoCount, onProcessPayment }) {
  const router = useRouter();

  const handlePrint = async () => {
    try {
      const photoGridItems = Array.from({ length: photoCount }).map(() => `
                <div class="grid-item"><img src="${uri}" /></div>
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
      console.error("Printing error:", error);
    }
  };

  const handleShare = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available", "Sharing is not available on this device.");
      return;
    }
    await Sharing.shareAsync(uri);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.photoContainer}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={styles.gridPhotoContainer}>
                {i < photoCount && (
                  <Image
                    style={styles.photo}
                    source={{ uri }}
                  />
                )}
              </View>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            {photoCount !== 6 && (
              <TouchableOpacity style={styles.materialButton} onPress={handlePrint}>
                <Text style={styles.materialButtonText}>Print</Text>
              </TouchableOpacity>
            )}
            {photoCount !== 6 && (
              <TouchableOpacity style={styles.materialButton} onPress={handleShare}>
                <Text style={styles.materialButtonText}>Share</Text>
              </TouchableOpacity>
            )}
            {photoCount === 6 && (
              <TouchableOpacity
                style={[styles.materialButton, styles.singleButton]}
                onPress={() => onProcessPayment(uri)}
              >
                <Text style={styles.materialButtonText}>Process Payment</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#d6e5f1ff',
    borderRadius: 10,
    padding: 10, // Reduced padding
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  photoContainer: {
    width: '80%',
    aspectRatio: 4 / 6,
    backgroundColor: 'white',
    padding: 0, // Removed padding
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
  },
  gridPhotoContainer: {
    width: '48%', // Two columns with a small gap
    aspectRatio: 1, // Square photos
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
    padding: 20,
  },
  materialButton: {
    backgroundColor: '#198ff0ff',
    paddingVertical: 10,
    paddingHorizontal: 10, // Reduced horizontal padding
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '40%', // Set width to 40%
  },
  materialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  singleButton: {
    width: '90%',
  },
});
