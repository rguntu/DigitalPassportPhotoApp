import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';

// --- IMPORTANT ---
// Replace these with your actual Product IDs from App Store Connect and Google Play
const productIds = Platform.select({
  ios: ['com.rgapps.appname.6photos'], // Replace with your iOS Product ID
  android: ['com.rgapps.digitalpassportphoto.6photos'], // Replace with your Android Product ID
});
// ---

export const useIAP = (onPurchaseSuccess, resetKey) => {
  const [products, setProducts] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const onPurchaseSuccessRef = useRef(onPurchaseSuccess);

  useEffect(() => {
    onPurchaseSuccessRef.current = onPurchaseSuccess;
  }, [onPurchaseSuccess]);

  useEffect(() => {
    let isMounted = true;
    let purchaseListener = null;

    const initializeIAP = async () => {
      try {
        console.log('[IAP] Setting up purchase listener...');
        purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
          console.log('[IAP] Purchase listener callback:', { responseCode, results, errorCode });
          if (responseCode === InAppPurchases.IAPResponseCode.OK) {
            for (const purchase of results) {
              if (!purchase.acknowledged) {
                try {
                  console.log('[IAP] Purchase successful:', purchase);
                  await InAppPurchases.finishTransactionAsync(purchase, true);
                  if (onPurchaseSuccessRef.current) {
                    onPurchaseSuccessRef.current(purchase);
                  }
                } catch (ackErr) {
                  console.warn('[IAP] Failed to finish transaction:', ackErr);
                }
              }
            }
          } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
            console.log('[IAP] User canceled the purchase.');
          } else {
            console.warn(`[IAP] Something went wrong with the purchase listener. Error code: ${errorCode}`);
          }
        });

        console.log('[IAP] Connecting to the store...');
        await InAppPurchases.connectAsync();
        
        console.log('[IAP] Checking for unfinished transactions...');
        const history = await InAppPurchases.getPurchaseHistoryAsync(true);
        if (history.responseCode === InAppPurchases.IAPResponseCode.OK) {
          for (const purchase of history.results) {
            if (!purchase.acknowledged) {
              console.log(`[IAP] Finishing unfinished transaction for ${purchase.productId}`);
              await InAppPurchases.finishTransactionAsync(purchase, false);
            }
          }
        }

        if (isMounted) {
            if (productIds?.length > 0) {
                console.log('[IAP] Fetching products with IDs:', productIds);
                const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
                console.log('[IAP] Get products response:', { responseCode, results });
                if (responseCode === InAppPurchases.IAPResponseCode.OK) {
                    console.log('[IAP] Products fetched successfully:', results);
                    setProducts(results);
                } else {
                    console.warn(`[IAP] Failed to fetch products with response code: ${responseCode}`);
                }
            }
            setIsReady(true);
            console.log('[IAP] Initialization successful.');
        }
      } catch (e) {
        if (isMounted) {
            console.error('[IAP] Failed to initialize:', e);
            setError(`Failed to initialize IAP: ${e.message}`);
        }
      }
    };

    initializeIAP();

    return () => {
      isMounted = false;
      console.log('[IAP] Disconnecting from the store.');
      if (purchaseListener) {
        purchaseListener.remove();
      }
      InAppPurchases.disconnectAsync();
    };
  }, [resetKey]);

  const purchaseProduct = async (productId) => {
    if (!isReady) {
      const notReadyError = 'IAP is not ready to make a purchase.';
      console.error(`[IAP] ${notReadyError}`);
      setError(notReadyError);
      return;
    }
    try {
      console.log(`[IAP] Calling purchaseItemAsync for product: ${productId}`);
      await InAppPurchases.purchaseItemAsync(productId);
      console.log('[IAP] purchaseItemAsync call completed.');
    } catch (e) {
      console.error('[IAP] An error was thrown during purchase:', JSON.stringify(e, null, 2));
      setError(`Purchase failed: ${e.message}`);
    }
  };

  return { products, isReady, purchaseProduct, error };
};
