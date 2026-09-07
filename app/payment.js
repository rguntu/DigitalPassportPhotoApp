import { StyleSheet, Text, View, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useIAP, PRODUCT_ID_6_PHOTOS } from './hooks/useIAP';
import { useCallback, useEffect } from 'react';
import { colors, spacing } from './theme';
import { extractCountryFromUri, getCountryMeta } from './countries';
import { PrimaryButton, SecondaryButton } from './components/AppButton';
import StepIndicator from './components/StepIndicator';

export default function PaymentScreen() {
  const router = useRouter();
  const { photoUri, country: paramCountry } = useLocalSearchParams();
  const country = paramCountry || extractCountryFromUri(photoUri);
  const meta = getCountryMeta(country);

  const handlePurchaseSuccess = useCallback((purchase) => {
    const matched =
      purchase?.productId === PRODUCT_ID_6_PHOTOS ||
      purchase?.id === PRODUCT_ID_6_PHOTOS ||
      (Array.isArray(purchase?.ids) && purchase.ids.includes(PRODUCT_ID_6_PHOTOS));

    if (matched) {
      router.replace({
        pathname: '/share_print',
        params: { photoUri, photoCount: 6, country },
      });
    }
  }, [photoUri, country, router]);

  const {
    products,
    isReady,
    isPurchasing,
    purchaseProduct,
    purchaseMatchesSku,
    error,
    clearError,
  } = useIAP(handlePurchaseSuccess);

  const product6Photos = products.find(
    (p) => purchaseMatchesSku(p, PRODUCT_ID_6_PHOTOS) || p.productId === PRODUCT_ID_6_PHOTOS
  );

  useEffect(() => {
    if (error) {
      Alert.alert('Payment Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handlePurchase = async () => {
    if (!isReady) {
      Alert.alert('Payment System Not Ready', 'Please wait a moment while the payment system initializes.');
      return;
    }
    if (isPurchasing) return;
    if (!product6Photos) {
      Alert.alert('Product Not Found', 'The 6 photos product could not be found. Please check your App Store configuration.');
      return;
    }
    await purchaseProduct(PRODUCT_ID_6_PHOTOS);
  };

  return (
    <View style={styles.container}>
      <StepIndicator current="review" />
      <Text style={styles.title}>Unlock print sheet</Text>
      <Text style={styles.subtitle}>
        Get a 4×6 sheet with 6 passport photos ({country} · {meta.sizeLabel}). One-time purchase for
        this sheet.
      </Text>
      <Text style={styles.policy}>
        Free Preview is watermarked. Purchases unlock one clean print sheet; buy again for another
        sheet. Restore isn’t needed for this consumable product.
      </Text>

      {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}

      {(!isReady || isPurchasing) && (
        <Text style={styles.loadingText}>
          {isPurchasing ? 'Waiting for App Store…' : 'Loading prices…'}
        </Text>
      )}

      {isReady && !isPurchasing && product6Photos && (
        <PrimaryButton
          title={`Buy 6 Photos · ${product6Photos.price}`}
          onPress={handlePurchase}
          fullWidth
          style={{ width: '88%', marginBottom: spacing.md }}
        />
      )}

      {isReady && !isPurchasing && !product6Photos && (
        <Text style={styles.errorText}>Could not load product information. Please try again later.</Text>
      )}

      <SecondaryButton title="Go Back" onPress={() => router.back()} disabled={isPurchasing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  policy: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  preview: {
    width: 160,
    height: 160,
    borderRadius: 10,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    marginBottom: spacing.lg,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
