import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useIAP } from './hooks/useIAP';
import { useEffect } from 'react';

const PRODUCT_ID_6_PHOTOS = 'com.rgapps.appname.6photos'; 

export default function PaymentScreen({ onPurchaseSuccess, photoUri, onGoBack, resetKey }) {
  const { products, isReady, purchaseProduct, error } = useIAP((purchase) => {
    if (purchase.productId === PRODUCT_ID_6_PHOTOS) {
      if (onPurchaseSuccess) {
        onPurchaseSuccess(photoUri);
      }
    }
  }, resetKey);
  const product6Photos = products.find(p => p.productId === PRODUCT_ID_6_PHOTOS);

  useEffect(() => {
    if (error) {
      Alert.alert("Payment Error", error);
    }
  }, [error]);

  const handlePurchase = async () => {
    if (!isReady) {
      Alert.alert("Payment System Not Ready", "Please wait a moment while the payment system initializes.");
      return;
    }
    if (!product6Photos) {
      Alert.alert("Product Not Found", "The 6 photos product could not be found. Please check your app configuration.");
      return;
    }
    await purchaseProduct(PRODUCT_ID_6_PHOTOS);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Unlock Full Sheet</Text>
        {photoUri && (
          <Text style={styles.subtitle}>
            Ready to print your official photos?
          </Text>
        )}

        {!isReady && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1d9bf0" />
            <Text style={styles.loadingText}>Initializing payment...</Text>
          </View>
        )}

        {isReady && product6Photos && (
          <TouchableOpacity style={styles.materialButton} onPress={handlePurchase}>
            <Text style={styles.materialButtonText}>
              Buy 6 Photos for {product6Photos.price !== undefined && product6Photos.price !== null ? product6Photos.price : '0.99'}
            </Text>
          </TouchableOpacity>
        )}

        {isReady && !product6Photos && (
          <Text style={styles.errorText}>Could not load product information. Please try again later.</Text>
        )}

        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0f1419',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#536471',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#536471',
  },
  materialButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    marginBottom: 16,
  },
  materialButtonText: {
    color: '#F0F4F8',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#f4212e',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  backButtonText: {
    color: '#0f1419',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
