import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';

// --- IMPORTANT ---
// Replace this with your actual Product ID from App Store Connect
const productIds = Platform.select({
  ios: ['com.rgapps.appname.6photos'],
  android: [], // Add Android product IDs here if needed
});
// ---

export const useIAP = (onPurchaseSuccess) => {
  const [products, setProducts] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const onPurchaseSuccessRef = useRef(onPurchaseSuccess);

  useEffect(() => {
    onPurchaseSuccessRef.current = onPurchaseSuccess;
  }, [onPurchaseSuccess]);

  useEffect(() => {
    let isMounted = true;

    const initializeIAP = async () => {
      try {
        await InAppPurchases.connectAsync();
        if (isMounted) {
            if (productIds?.length > 0) {
                const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
                if (responseCode === InAppPurchases.IAPResponseCode.OK) {
                    setProducts(results);
                }
            }
            setIsReady(true);
        }
      } catch (e) {
        if (isMounted) {
            setError(`Failed to initialize IAP: ${e.message}`);
        }
      }
    };

    initializeIAP();

    const purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            try {
              console.log('Purchase successful:', purchase);
              await InAppPurchases.finishTransactionAsync(purchase, true);
              if (onPurchaseSuccessRef.current) {
                onPurchaseSuccessRef.current(purchase);
              }
            } catch (ackErr) {
              console.warn('Failed to finish transaction:', ackErr);
            }
          }
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('User canceled the purchase.');
      } else {
        console.warn(`Something went wrong with the purchase listener: ${errorCode}`);
      }
    });

    return () => {
      isMounted = false;
      if (purchaseListener) {
        purchaseListener.remove();
      }
      InAppPurchases.disconnectAsync();
    };
  }, []);

  const purchaseProduct = async (productId) => {
    if (!isReady) {
      setError('IAP is not ready to make a purchase.');
      return;
    }
    try {
      await InAppPurchases.purchaseItemAsync(productId);
    } catch (e) {
      setError(`Purchase failed: ${e.message}`);
    }
  };

  return { products, isReady, purchaseProduct, error };
};
