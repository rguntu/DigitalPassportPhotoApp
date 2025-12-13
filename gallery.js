import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import { removeBackground } from '@jacobjmc/react-native-background-remover';
import { getPassportRequirements, passportConfigs } from './passportConfig';


const photosDir = FileSystem.documentDirectory + 'photos/';

const countries = [
  { label: 'US', value: 'US' },
  { label: 'UK', value: 'UK' },
];

const GalleryPhoto = ({ item, highlightedPhotoUri, deletePhoto, onPhotoPress }) => {
  const router = useRouter();
  const isProcessed = item.includes('_processed');
  const isPaid = item.includes('_paid');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const selectCountry = (countryValue) => {
    setSelectedCountry(countryValue);
    setShowCountryPicker(false);
    const originalUri = item.replace('_processed.jpg', '.jpg');
    router.push({ pathname: '/adjust_photo', params: { photoUri: originalUri, country: countryValue } });
  };

  // Action for tapping the image itself
  const handleImagePress = () => {
    if (isProcessed) {
      // Re-edit: go to adjustment screen with the original photo
      const originalUri = item.replace(/_processed(_paid)?\.jpg$/, '.jpg');
      router.push({
        pathname: '/adjust_photo',
        params: {
          photoUri: originalUri,
          country: 'US',
          isReEdit: 'true',
          processedUri: item
        }
      });
    } else {
      // New photo: show country picker to start editing
      setShowCountryPicker(true);
    }
  };

  // Action for tapping the "6 Photos" button
  const handleSixPhotoButtonPress = () => {
    if (isPaid) {
      // Already paid: go directly to share/print for 6 photos
      router.push({ pathname: '/share_print', params: { photoUri: item, photoCount: 6 } });
    } else if (isProcessed && !isPaid) {
      // Processed but unpaid: trigger the payment flow
      if (onPhotoPress) {
        onPhotoPress(item, 6);
      }
    }
  };

  return (
    <View style={styles.cellContainer}>
      <View style={[styles.photoContainer, item === highlightedPhotoUri && styles.highlightedPhoto]}>
        <TouchableOpacity onPress={handleImagePress}>
          <Image
            style={styles.photo}
            source={{ uri: item }}
            onError={(e) => {
              // Image loading errors are not critical to app function, so no need to log.
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item)}>
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </View>
      {!isProcessed && (
        <>
          <TouchableOpacity onPress={() => setShowCountryPicker(true)} style={styles.countrySelectorButton}>
            <Text style={styles.countrySelectorButtonText}>
              {selectedCountry || 'Select Country'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showCountryPicker}
            onRequestClose={() => setShowCountryPicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setShowCountryPicker(false)}
            >
              <View style={styles.modalContainer}>
                <FlatList
                  data={countries}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryItem}
                      onPress={() => selectCountry(item.value)}
                    >
                      <Text style={styles.countryItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}
      {isProcessed && (
        <View style={styles.processedButtonsContainer}>
          <TouchableOpacity
            style={styles.processedButton}
            onPress={() => router.push({ pathname: '/share_print', params: { photoUri: item, photoCount: 2 } })}
          >
            <Text style={styles.processedButtonText}>2 Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.processedButton, isPaid && styles.paidButton]}
            onPress={handleSixPhotoButtonPress}
          >
            <Text style={styles.processedButtonText}>{isPaid ? '6 Photos (Paid)' : '6 Photos (99c)'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function Gallery({ initialTab, onPhotoPress }) {
  const [unprocessedPhotos, setUnprocessedPhotos] = useState([]);
  const [processedPhotos, setProcessedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab || 'unprocessed');
  const [highlightedPhotoUri, setHighlightedPhotoUri] = useState(null);
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
    const allPhotos = files.map(file => photosDir + file).sort().reverse();
    setUnprocessedPhotos(allPhotos.filter(file => !file.includes('_processed')));
    setProcessedPhotos(allPhotos.filter(file => file.includes('_processed')));
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  useEffect(() => {
    setActiveTab(initialTab || 'unprocessed');
  }, [initialTab]);

  useEffect(() => {
    if (highlightedPhotoUri) {
      const timer = setTimeout(() => {
        setHighlightedPhotoUri(null);
      }, 3000); // Highlight for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedPhotoUri, activeTab]);

  const deletePhoto = async (uri) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await FileSystem.deleteAsync(uri);
            loadPhotos();
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }) => {
    return (
      <GalleryPhoto
        item={item}
        highlightedPhotoUri={highlightedPhotoUri}
        deletePhoto={deletePhoto}
        onPhotoPress={onPhotoPress}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('unprocessed')} style={[styles.tab, activeTab === 'unprocessed' && styles.activeTab]}>
          <Text style={styles.tabText}>Unprocessed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('processed')} style={[styles.tab, activeTab === 'processed' && styles.activeTab]}>
          <Text style={styles.tabText}>Processed</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={activeTab}
        data={activeTab === 'unprocessed' ? unprocessedPhotos : processedPhotos}
        keyExtractor={(item) => item}
        numColumns={2}
        renderItem={renderPhoto}
        style={{ marginTop: 0 }}
        ListEmptyComponent={<EmptyGallery tab={activeTab} />}
      />
    </View>
  );
}

const EmptyGallery = ({ tab }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>
      {tab === 'unprocessed'
        ? "You have no photos to process. Use the camera buttons below to get started!"
        : "You have no processed photos yet."}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6e5f1ff',
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#66778c',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    width: '96%', // Match approximate width of photo grid
    alignSelf: 'center', // Center the tab container
    marginTop: 10, // Add a small top margin for separation from the top of the screen
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    width: '48%', // Distribute width evenly for two tabs
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#198ff0ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  cellContainer: {
    width: '45%',
    margin: '2.5%',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    marginBottom: 0, // Ensure no gap between photo and country selector
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(102, 119, 140, 0.7)', // Lighter blue with some transparency
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  highlightedPhoto: {
    borderWidth: 3,
    borderColor: 'white',
  },
  countrySelectorButton: {
    backgroundColor: '#198ff0ff',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0, // Ensure no gap
  },
  countrySelectorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14, // Reduced font size
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    maxHeight: '50%',
  },
  countryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryItemText: {
    fontSize: 16,
    color: 'black',
  },
  processedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  processedButton: {
    backgroundColor: '#198ff0ff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    width: '48%',
    alignItems: 'center',
  },
  paidButton: {
    backgroundColor: '#4CAF50', // A green color to indicate success
  },
  processedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
