import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { colors, radii, spacing } from './theme';
import { extractCountryFromUri, getCountryMeta, getPhotoAspect } from './countries';
import { PrimaryButton, SecondaryButton } from './components/AppButton';
import StepIndicator from './components/StepIndicator';

export default function SixPhotoPreviewScreen() {
  const router = useRouter();
  const { photoUri, photoCount: paramPhotoCount, country: paramCountry } = useLocalSearchParams();
  const actualPhotoCount = paramPhotoCount ? parseInt(paramPhotoCount, 10) : 6;
  const country = paramCountry || extractCountryFromUri(photoUri);
  const meta = getCountryMeta(country);
  const aspect = getPhotoAspect(country);
  const viewShotRef = useRef();
  const isPreview = actualPhotoCount === 2;

  const sheetLabel = useMemo(() => {
    if (isPreview) return 'Free preview sheet (2 photos, watermarked)';
    return 'Print sheet (6 photos)';
  }, [isPreview]);

  const handlePrint = async () => {
    if (!photoUri) return;
    try {
      const watermark = isPreview
        ? '<div class="wm">PREVIEW</div>'
        : '';
      const photoGridItems = Array.from({ length: actualPhotoCount })
        .map(
          () =>
            `<div class="grid-item"><img src="${photoUri}" />${watermark}</div>`
        )
        .join('');

      const cellWidth = aspect >= 1 ? 2 : 1.75;
      const cellHeight = cellWidth / aspect;

      const html = `
        <html>
          <head>
            <style>
              @page { size: 4in 6in; margin: 0; }
              body { margin: 0; width: 4in; height: 6in; }
              .grid-container {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                height: 100%;
                align-content: space-around;
                justify-content: space-around;
              }
              .grid-item {
                position: relative;
                width: ${cellWidth}in;
                height: ${cellHeight}in;
                box-sizing: border-box;
                padding: 0.04in;
                overflow: hidden;
              }
              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
              .wm {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: rgba(15,20,25,0.4);
                font-weight: 800;
                font-size: 18px;
                letter-spacing: 2px;
                transform: rotate(-18deg);
                pointer-events: none;
              }
            </style>
          </head>
          <body>
            <div class="grid-container">${photoGridItems}</div>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (error) {
      if (error.code === 'CANCELLED' || (error.message && error.message.includes('Printing did not complete'))) {
        return;
      }
      Alert.alert('Printing Error', 'Could not print the photo. Please try again later.');
      console.error('Printing error:', error);
    }
  };

  const handleShare = async () => {
    if (!photoUri) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      return;
    }
    try {
      const uri = await viewShotRef.current.capture({
        width: 1200,
        height: 1800,
        format: 'jpeg',
        quality: 0.9,
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg' });
    } catch (error) {
      Alert.alert('Sharing Error', 'Could not share the photo. Please try again later.');
      console.error('Sharing error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator current="print" />
      <Text style={styles.title}>Your photos are ready</Text>
      <Text style={styles.subtitle}>
        {sheetLabel} · {country} · {meta.sizeLabel}
      </Text>

      <ViewShot ref={viewShotRef}>
        <View style={styles.photoContainer}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.gridPhotoContainer, { aspectRatio: aspect }]}>
              {i < actualPhotoCount && photoUri ? (
                <View style={styles.cellFill}>
                  <Image style={styles.photo} source={{ uri: photoUri }} />
                  {isPreview ? (
                    <View style={styles.watermark} pointerEvents="none">
                      <Text style={styles.watermarkText}>PREVIEW</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyCell} />
              )}
            </View>
          ))}
        </View>
      </ViewShot>

      <View style={styles.buttonContainer}>
        <PrimaryButton title="Print" onPress={handlePrint} style={{ width: '45%' }} />
        <PrimaryButton title="Share" onPress={handleShare} style={{ width: '45%' }} />
      </View>

      {isPreview ? (
        <PrimaryButton
          title="Unlock clean 6-photo sheet"
          onPress={() =>
            router.push({
              pathname: '/payment',
              params: { photoUri, country },
            })
          }
          fullWidth
          style={{ width: '90%', marginTop: spacing.md }}
        />
      ) : null}

      <SecondaryButton
        title="Back to Home"
        onPress={() => router.replace({ pathname: '/', params: { tab: 'processed' } })}
        style={{ marginTop: spacing.md }}
      />
      <Text style={styles.disclaimer}>
        Prepared to common size guidelines. Not a government service — acceptance not guaranteed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  photoContainer: {
    width: '90%',
    aspectRatio: 4 / 6,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  gridPhotoContainer: {
    width: '48%',
    padding: 2,
  },
  cellFill: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
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
  watermark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,245,249,0.28)',
  },
  watermarkText: {
    color: 'rgba(15,20,25,0.45)',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
    transform: [{ rotate: '-18deg' }],
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: spacing.sm,
  },
  disclaimer: {
    marginTop: spacing.md,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
