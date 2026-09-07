import { StyleSheet, Text, View, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { colors, radii, spacing } from './theme';
import { extractCountryFromUri, getCountryMeta, getPhotoAspect } from './countries';
import { PrimaryButton } from './components/AppButton';
import StepIndicator from './components/StepIndicator';

export default function PaymentProcessModal({ isVisible, onClose, uri, photoCount }) {
  const router = useRouter();
  const country = extractCountryFromUri(uri);
  const meta = getCountryMeta(country);
  const aspect = getPhotoAspect(country);
  const isPaidPack = photoCount === 6;

  const goToPayment = () => {
    onClose?.();
    router.push({
      pathname: '/payment',
      params: { photoUri: uri, country },
    });
  };

  const goToPreview = () => {
    onClose?.();
    router.push({
      pathname: '/share_print',
      params: { photoUri: uri, photoCount: 2, country },
    });
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <StepIndicator current="review" />
          <Text style={styles.title}>{isPaidPack ? 'Print-ready sheet' : 'Free preview'}</Text>
          <Text style={styles.subtitle}>
            {isPaidPack
              ? `Unlock 6 photos on a 4×6 sheet (${country} · ${meta.sizeLabel}).`
              : `Watermarked 2-photo preview (${country} · ${meta.sizeLabel}). Buy the print sheet for a clean 6-up.`}
          </Text>

          <View style={styles.photoContainer}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={[styles.gridPhotoContainer, { aspectRatio: aspect }]}>
                {i < photoCount && uri ? (
                  <Image style={styles.photo} source={{ uri }} />
                ) : (
                  <View style={styles.emptyCell} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            {isPaidPack ? (
              <PrimaryButton title="Continue to payment" onPress={goToPayment} fullWidth />
            ) : (
              <PrimaryButton title="Open free preview" onPress={goToPreview} fullWidth />
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
    backgroundColor: colors.overlay,
  },
  modalContainer: {
    width: '92%',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    padding: 4,
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  photoContainer: {
    width: '82%',
    aspectRatio: 4 / 6,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    padding: 4,
  },
  gridPhotoContainer: {
    width: '48%',
    padding: 2,
  },
  emptyCell: {
    flex: 1,
    backgroundColor: '#eef3f6',
    borderRadius: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    padding: spacing.md,
  },
});
