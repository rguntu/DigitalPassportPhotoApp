import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';

export default function PreviewModal({ isVisible, onClose, uri }) {
  const router = useRouter();

  const handlePrint = async () => {
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
            <div class="grid-item"><img src="${uri}" /></div>
            <div class="grid-item"><img src="${uri}" /></div>
            <div class="grid-item"><img src="${uri}" /></div>
            <div class="grid-item"><img src="${uri}" /></div>
            <div class="grid-item"><img src="${uri}" /></div>
            <div class="grid-item"><img src="${uri}" /></div>
          </div>
        </body>
      </html>
    `;

    await Print.printAsync({
      html,
    });
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
                <Image
                  style={styles.photo}
                  source={{ uri }}
                />
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
    backgroundColor: '#BBDEFB',
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
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  materialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
