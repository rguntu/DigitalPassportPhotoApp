import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { RectButton, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useIAP } from './hooks/useIAP';
import { useEffect } from 'react';

const PRODUCT_ID_6_PHOTOS = 'com.rgapps.appname.6photos'; // Ensure this matches your product ID

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
        <Text style={styles.title}>Process Payment</Text>
        {photoUri && <Text style={styles.subtitle}>For photo: {photoUri.substring(photoUri.lastIndexOf('/') + 1)}</Text>}

        {!isReady && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#198ff0ff" />
            <Text style={styles.loadingText}>Loading payment system...</Text>
          </View>
        )}

        {isReady && product6Photos && (
          <RectButton style={styles.materialButton} onActiveStateChange={(active) => { if (active) handlePurchase() }}>
            <Text style={styles.materialButtonText}>Buy 6 Photos for {product6Photos.price}</Text>
          </RectButton>
        )}

        {isReady && !product6Photos && (
          <Text style={styles.errorText}>Could not load product information. Please try again later.</Text>
        )}

        <RectButton style={styles.backButton} onActiveStateChange={(active) => { if (active) onGoBack() }}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </RectButton>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6e5f1ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  materialButton: {
    backgroundColor: '#198ff0ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '80%',
    marginBottom: 20,
    zIndex: 999,
  },
  materialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#66778c',
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
