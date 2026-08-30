import { fetchFreshProductsByIds } from './productService';

export const validateCartForCheckout = async (cartItems) => {
    // 1. Early check for network connectivity
    if (!navigator.onLine) {
        return { valid: false, networkError: true };
    }

    if (!cartItems || cartItems.length === 0) {
        return { valid: true, changes: [] };
    }

    // 2. Extract unique product IDs
    const uniqueIds = [...new Set(cartItems.map(item => String(item.id)))];

    // 3. Fetch fresh data (bypassing cache)
    let freshProducts = [];
    try {
        freshProducts = await fetchFreshProductsByIds(uniqueIds);
    } catch (error) {
        console.error("Cart validation failed to fetch fresh products:", error);
        return { valid: false, networkError: true };
    }

    const changes = [];

    // 4. Compare each cart item against fresh data
    cartItems.forEach(cartItem => {
        const freshProduct = freshProducts.find(p => String(p.id) === String(cartItem.id));

        if (!freshProduct) {
            changes.push({
                productId: cartItem.id,
                variantId: cartItem.variantId,
                name: cartItem.name,
                type: 'PRODUCT_DELETED'
            });
            return;
        }

        // Determine whether this cart item represents a specific variant.
        //
        // Primary signal: variantId is built as `"${productId}-${variantImage}"` by addToCart
        // when the user selects a variant in ProductOptionsModal (only variantPrice + variantImage
        // are passed — selectedColor/selectedMaterial are NOT set on those items).
        // Therefore variantId !== productId is the canonical indicator that a variant was selected.
        //
        // Legacy signal: selectedColor / selectedMaterial are set by OrderCard and other older paths.
        const isVariant =
            String(cartItem.variantId) !== String(cartItem.id) ||
            cartItem.selectedColor ||
            cartItem.selectedMaterial;

        let freshPrice = freshProduct.price;
        let matchedVariant = null;

        if (isVariant) {
            // Search ONLY freshProduct.variants — the real variant array from Firestore.
            // freshProduct.images is NOT treated as a variant source.
            const freshVariants = freshProduct.variants || [];

            matchedVariant = freshVariants.find(v => {
                // Primary path (ProductOptionsModal): match by variant image URL.
                // cartItem.image was stored as `options.variantImage` in addToCart,
                // which is exactly the same value as the variant's `image` field.
                if (cartItem.image && v.image && v.image === cartItem.image) {
                    return true;
                }

                // Legacy path (OrderCard, etc.): match by selectedColor / selectedMaterial.
                // At least one attribute must be set to avoid a vacuous match.
                const hasLegacyAttrs = cartItem.selectedColor || cartItem.selectedMaterial;
                if (hasLegacyAttrs) {
                    return (
                        (!cartItem.selectedMaterial || v.material === cartItem.selectedMaterial) &&
                        (!cartItem.selectedColor    || v.color    === cartItem.selectedColor)
                    );
                }

                return false;
            });

            if (!matchedVariant) {
                // The exact variant the customer selected no longer exists.
                // Do NOT fall back to the product base price — that would be an
                // invalid cross-level comparison (variant price vs base price).
                changes.push({
                    productId: cartItem.id,
                    variantId: cartItem.variantId,
                    name: cartItem.name,
                    type: 'VARIANT_DELETED'
                });
                return;
            }

            // Use the matched variant's own price for comparison.
            // If undefined, freshPrice stays as freshProduct.price — which is still
            // a same-level comparison because the cart price was also derived from
            // the base price in that case (variantPrice fallback in addToCart).
            if (matchedVariant.price !== undefined) {
                freshPrice = matchedVariant.price;
            }
        }

        const currentPrice = Number(cartItem.price);
        const newPrice = Number(freshPrice);

        if (currentPrice !== newPrice) {
            changes.push({
                productId: cartItem.id,
                variantId: cartItem.variantId,
                name: cartItem.name,
                type: isVariant ? 'VARIANT_PRICE_CHANGED' : 'PRICE_CHANGED',
                previousPrice: currentPrice,
                currentPrice: newPrice
            });
        }

        // Data change detection — split by variant vs non-variant.
        const freshName = freshProduct.name;

        if (isVariant) {
            // For variant items: the variant was already confirmed to exist via image-URL
            // matching above. A variant image being different from freshProduct.imageUrl
            // (the primary product image) is NOT a data change — they are always different.
            //
            // Only flag VARIANT_DATA_CHANGED if the product name changed.
            // freshImage is intentionally omitted from the payload: reconcileCart uses
            // `change.freshImage || item.image`, so leaving it undefined preserves the
            // customer's selected variant image and prevents it from being replaced with
            // the product's primary image.
            if (cartItem.name !== freshName) {
                changes.push({
                    productId: cartItem.id,
                    variantId: cartItem.variantId,
                    name: cartItem.name,
                    type: 'VARIANT_DATA_CHANGED',
                    freshName
                    // freshImage deliberately not set — variant image must never be replaced
                });
            }
        } else {
            // For non-variant/base products: preserve existing name + image comparison.
            const freshImage = freshProduct.imageUrl
                || (freshProduct.images && freshProduct.images[0])
                || freshProduct.image;

            if (cartItem.name !== freshName || (cartItem.image !== freshImage && freshImage !== undefined)) {
                changes.push({
                    productId: cartItem.id,
                    variantId: cartItem.variantId,
                    name: cartItem.name,
                    type: 'PRODUCT_DATA_CHANGED',
                    freshName,
                    freshImage
                });
            }
        }
    });

    return {
        valid: changes.length === 0,
        changes
    };
};
