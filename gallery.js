import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity, Modal, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
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

  const extractCountryFromProcessedUri = (uri) => {
    const match = uri.match(/_([A-Z]{2})_processed/);
    return match ? match[1] : 'US';
  };

  let photoStyle = styles.photo;
  if (isProcessed) {
    const countryCode = extractCountryFromProcessedUri(item);
    const requirements = getPassportRequirements(countryCode);
    if (requirements) {
      photoStyle = [styles.photo, { aspectRatio: requirements.outputWidthPx / requirements.outputHeightPx }];
    }
  }

  const selectCountry = (countryValue) => {
    setSelectedCountry(countryValue);
    setShowCountryPicker(false);
    const originalUri = item.replace('_processed.jpg', '.jpg');
    router.push({ pathname: '/adjust_photo', params: { photoUri: originalUri, country: countryValue } });
  };

  const handleImagePress = () => {
    if (isProcessed) {
      const originalUri = item.replace(/_processed(_paid)?\.jpg$/, '.jpg');
      const countryCode = extractCountryFromProcessedUri(item);
      router.push({
        pathname: '/adjust_photo',
        params: {
          photoUri: originalUri,
          country: countryCode,
          isReEdit: 'true',
          processedUri: item
        }
      });
    } else {
      setShowCountryPicker(true);
    }
  };

  const handleSixPhotoButtonPress = () => {
    if (isPaid) {
      router.push({ pathname: '/share_print', params: { photoUri: item, photoCount: 6, country: extractCountryFromProcessedUri(item) } });
    } else if (isProcessed && !isPaid) {
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
            style={photoStyle}
            source={{ uri: item }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item)}>
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </View>
      {!isProcessed && (
        <TouchableOpacity onPress={() => setShowCountryPicker(true)} style={styles.countrySelectorButton}>
          <Text style={styles.countrySelectorButtonText}>
            {selectedCountry || 'Select Country'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="white" />
        </TouchableOpacity>
      )}
      {isProcessed && (
        <View style={styles.processedButtonsContainer}>
          <TouchableOpacity
            style={styles.processedButton}
            onPress={() => router.push({ pathname: '/share_print', params: { photoUri: item, photoCount: 2, country: extractCountryFromProcessedUri(item) } })}
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
    </View>
  );
};

export default function Gallery({ initialTab, onPhotoPress }) {
  const [unprocessedPhotos, setUnprocessedPhotos] = useState([]);
  const [processedPhotos, setProcessedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab || 'unprocessed');
  const [highlightedPhotoUri, setHighlightedPhotoUri] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollValue = useRef(new Animated.Value(initialTab === 'processed' ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scrollValue, {
      toValue: activeTab === 'unprocessed' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [activeTab]);

  const sliderWidth = (containerWidth - 8) / 2;
  const translateX = scrollValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sliderWidth],
  });

  const loadPhotos = async () => {
    const files = await FileSystem.readDirectoryAsync(photosDir);
    const photoInfos = await Promise.all(files.map(async (file) => {
      const uri = photosDir + file;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return { uri, modificationTime: fileInfo.modificationTime };
    }));
    const sortedPhotos = photoInfos.sort((a, b) => b.modificationTime - a.modificationTime).map(info => info.uri);
    setUnprocessedPhotos(sortedPhotos.filter(file => !file.includes('_processed')));
    setProcessedPhotos(sortedPhotos.filter(file => file.includes('_processed')));
  };

  useFocusEffect(useCallback(() => { loadPhotos(); }, []));
  useEffect(() => { setActiveTab(initialTab || 'unprocessed'); }, [initialTab]);

  return (
    <View style={styles.container}>
      <View 
        style={styles.tabContainer}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {containerWidth > 0 && (
          <Animated.View
            style={[
              styles.slider,
              {
                width: sliderWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
        <TouchableOpacity 
          onPress={() => setActiveTab('unprocessed')} 
          style={styles.tab}
        >
          <Text style={[styles.tabText, activeTab === 'unprocessed' && styles.activeTabText]}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('processed')} 
          style={styles.tab}
        >
          <Text style={[styles.tabText, activeTab === 'processed' && styles.activeTabText]}>ID Photos</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={activeTab}
        data={activeTab === 'unprocessed' ? unprocessedPhotos : processedPhotos}
        keyExtractor={(item) => item}
        numColumns={2}
        renderItem={({ item }) => (
          <GalleryPhoto item={item} highlightedPhotoUri={highlightedPhotoUri} deletePhoto={async (uri) => {
            Alert.alert("Delete", "Delete this photo?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => { await FileSystem.deleteAsync(uri); loadPhotos(); } }
            ]);
          }} onPhotoPress={onPhotoPress} />
        )}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{activeTab === 'unprocessed' ? "Your gallery is empty." : "No ID photos yet."}</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5F9',
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
    color: '#536471',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E1E8ED',
    padding: 4,
    width: '100%',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  slider: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: 'white',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#536471',
  },
  activeTabText: {
    color: '#1d9bf0',
  },
  cellContainer: {
    width: '45%',
    margin: '2.5%',
  },
  photoContainer: {
    width: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(15, 20, 25, 0.7)',
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  countrySelectorButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  countrySelectorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '70%',
    maxHeight: '40%',
    elevation: 5,
  },
  countryItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eff3f4',
  },
  countryItemText: {
    fontSize: 16,
    color: '#0f1419',
    textAlign: 'center',
  },
  processedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  processedButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 6,
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
  },
  paidButton: {
    backgroundColor: '#00ba7c',
  },
  processedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
});
