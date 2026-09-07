import { StyleSheet, Text, View, FlatList, Image, Alert, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radii, spacing } from './app/theme';
import { extractCountryFromUri, getCountryMeta } from './app/countries';
import { PrimaryButton } from './app/components/AppButton';

const photosDir = FileSystem.documentDirectory + 'photos/';

const GalleryPhoto = ({ item, onPressPrintPack, onPressPreview, onPressEdit, deletePhoto }) => {
  const country = extractCountryFromUri(item);
  const meta = getCountryMeta(country);

  return (
    <View style={styles.cellContainer}>
      <View style={styles.photoContainer}>
        <TouchableOpacity onPress={() => onPressPrintPack(item)} activeOpacity={0.85}>
          <Image style={styles.photo} source={{ uri: item }} />
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{country} · {meta.sizeLabel}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item)} hitSlop={8}>
          <MaterialIcons name="close" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => onPressEdit(item)}>
          <Text style={styles.secondaryActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => onPressPreview(item)}>
          <Text style={styles.secondaryActionText}>Preview</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.primaryAction} onPress={() => onPressPrintPack(item)}>
        <Text style={styles.primaryActionText}>Print sheet · $1</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Gallery({ onPressProcessedPhoto, initialTab, onStartCapture }) {
  const [processedPhotos, setProcessedPhotos] = useState([]);
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
    const processed = files
      .map((file) => photosDir + file)
      .filter((file) => file.includes('_processed'))
      .sort()
      .reverse();
    setProcessedPhotos(processed);
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  // Keep processed tab when returning from adjust with tab param (home may remount).
  useEffect(() => {
    if (initialTab === 'processed') {
      loadPhotos();
    }
  }, [initialTab]);

  const deletePhoto = async (uri) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await FileSystem.deleteAsync(uri);
          loadPhotos();
        },
      },
    ]);
  };

  const onPressEdit = (uri) => {
    const country = extractCountryFromUri(uri);
    router.push({
      pathname: '/adjust_photo',
      params: {
        photoUri: uri,
        country,
        isReEdit: 'true',
        processedUri: uri,
      },
    });
  };

  const onPressPreview = (uri) => {
    onPressProcessedPhoto?.(uri, 2);
  };

  const onPressPrintPack = (uri) => {
    onPressProcessedPhoto?.(uri, 6);
  };

  if (processedPhotos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="photo-camera" size={48} color={colors.primary} />
        <Text style={styles.emptyTitle}>Create your ID photo</Text>
        <Text style={styles.emptyBody}>
          Choose a country, then take or upload a photo. Position your face in the oval and save.
        </Text>
        {onStartCapture ? (
          <PrimaryButton title="Get started" onPress={onStartCapture} style={{ marginTop: spacing.lg }} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your photos</Text>
      <FlatList
        data={processedPhotos}
        keyExtractor={(item) => item}
        numColumns={2}
        renderItem={({ item }) => (
          <GalleryPhoto
            item={item}
            onPressPrintPack={onPressPrintPack}
            onPressPreview={onPressPreview}
            onPressEdit={onPressEdit}
            deletePhoto={deletePhoto}
          />
        )}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cellContainer: {
    width: '45%',
    margin: '2.5%',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(15,20,25,0.7)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(102, 119, 140, 0.85)',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  secondaryAction: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryAction: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
