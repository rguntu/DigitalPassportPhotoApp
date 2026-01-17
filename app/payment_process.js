import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';

export default function PaymentProcessModal({ isVisible, onClose, uri, photoCount, onProcessPayment }) {
  const handlePrint = async () => {
    try {
      const photoGridItems = Array.from({ length: photoCount }).map(() => `
                <div class="grid-item"><img src="${uri}" /></div>
              `).join('');
      const html = `<html><head><style>@page { size: 4in 6in; margin: 0; } body { margin: 0; width: 4in; height: 6in; } .grid-container { display: flex; flex-wrap: wrap; width: 100%; height: 100%; } .grid-item { width: 2in; height: 2in; box-sizing: border-box; } img { width: 100%; height: 100%; }</style></head><body><div class="grid-container">${photoGridItems}</div></body></html>`;
      await Print.printAsync({ html });
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  const handleShare = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Error", "Sharing not available.");
      return;
    }
    await Sharing.shareAsync(uri);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0f1419" />
          </TouchableOpacity>

          <View style={styles.photoContainer}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={styles.gridPhotoContainer}>
                {i < photoCount && <Image style={styles.photo} source={{ uri }} />}
              </View>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            {photoCount !== 6 ? (
              <>
                <TouchableOpacity style={styles.materialButton} onPress={handlePrint}>
                  <Text style={styles.materialButtonText}>Print</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.materialButton} onPress={handleShare}>
                  <Text style={styles.materialButtonText}>Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.materialButton, styles.singleButton]} onPress={() => onProcessPayment(uri)}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#F0F5F9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 4 / 6,
    backgroundColor: '#f7f9f9',
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    padding: 4,
  },
  gridPhotoContainer: {
    width: '48%',
    aspectRatio: 1,
    padding: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  materialButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  materialButtonText: {
    color: '#F0F4F8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  singleButton: {
    width: '100%',
  },
});
