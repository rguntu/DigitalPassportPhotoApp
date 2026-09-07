import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useIAP as useExpoIAP, finishTransaction, ErrorCode } from 'expo-iap';

export const PRODUCT_ID_6_PHOTOS = 'com.rgapps.appname.6photos';

const productIds = Platform.select({
  ios: [PRODUCT_ID_6_PHOTOS],
  android: [PRODUCT_ID_6_PHOTOS],
  default: [PRODUCT_ID_6_PHOTOS],
});

const isUserCancelled = (error) => {
  const code = error?.code;
  return (
    code === ErrorCode.UserCancelled ||
    code === 'user-cancelled' ||
    code === 'E_USER_CANCELLED'
  );
};

const purchaseMatchesSku = (purchase, sku) => {
  if (!purchase || !sku) return false;
  return (
    purchase.productId === sku ||
    purchase.id === sku ||
    (Array.isArray(purchase.ids) && purchase.ids.includes(sku))
  );
};

export const useIAP = (onPurchaseSuccess) => {
  const [error, setError] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const onPurchaseSuccessRef = useRef(onPurchaseSuccess);

  useEffect(() => {
    onPurchaseSuccessRef.current = onPurchaseSuccess;
  }, [onPurchaseSuccess]);

  const clearError = useCallback(() => setError(null), []);

  const { connected, products, fetchProducts, requestPurchase } = useExpoIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        // Consumable: always finish so the SKU can be purchased again.
        await finishTransaction({ purchase, isConsumable: true });
        if (onPurchaseSuccessRef.current) {
          onPurchaseSuccessRef.current(purchase);
        }
      } catch (ackErr) {
        console.warn('Failed to finish transaction:', ackErr);
        setError(`Failed to finish transaction: ${ackErr.message}`);
      } finally {
        setIsPurchasing(false);
      }
    },
    onPurchaseError: (purchaseError) => {
      setIsPurchasing(false);
      if (isUserCancelled(purchaseError)) {
        console.log('User canceled the purchase.');
        return;
      }
      console.warn('Purchase error:', purchaseError);
      setError(purchaseError?.message || 'Purchase failed');
    },
    onError: (e) => {
      setIsPurchasing(false);
      setError(e?.message || 'IAP error');
    },
  });

  useEffect(() => {
    if (!connected || !productIds?.length) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await fetchProducts({ skus: productIds, type: 'in-app' });
      } catch (e) {
        if (!cancelled) {
          setError(`Failed to load products: ${e.message}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, fetchProducts]);

  const purchaseProduct = async (productId) => {
    if (!connected) {
      setError('IAP is not ready to make a purchase.');
      return;
    }
    if (isPurchasing) {
      return;
    }

    setError(null);
    setIsPurchasing(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: productId },
          google: { skus: [productId] },
        },
        type: 'in-app',
      });
      // Result is event-based (onPurchaseSuccess / onPurchaseError).
      // Keep this screen mounted until those fire.
    } catch (e) {
      setIsPurchasing(false);
      if (!isUserCancelled(e)) {
        setError(`Purchase failed: ${e.message}`);
      }
    }
  };

  // Normalize product shape for existing UI (productId + price).
  const normalizedProducts = (products || []).map((product) => ({
    ...product,
    productId: product.id,
    price: product.displayPrice,
  }));

  return {
    products: normalizedProducts,
    isReady: connected,
    isPurchasing,
    purchaseProduct,
    purchaseMatchesSku,
    error,
    clearError,
  };
};
