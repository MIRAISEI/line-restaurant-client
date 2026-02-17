"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { IMenuItem } from "@/types/menu-types";
import { ICartItem } from "@/types/cart-types";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

interface AddonSelectorProps {
  cartItemId?: string; // Optional: for existing cart items
  menuItemId?: string; // Optional: for items not yet in cart
  initialAddons?: ICartItem[]; // Optional: for standalone mode
  onSaveAddons?: (addons: ICartItem[]) => void; // Optional: for standalone mode
  onClose: () => void;
}

export default function AddonSelector({
  cartItemId,
  menuItemId,
  initialAddons,
  onSaveAddons,
  onClose
}: AddonSelectorProps) {
  const t = useTranslations('AddonSelector');
  const locale = useLocale();
  const { items, dispatch } = useCart();
  const [addonItems, setAddonItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState<Map<string, number>>(new Map());

  // Get current parent item ID
  const parentId = useMemo(() => {
    if (cartItemId) {
      return items.find(item => item.cartItemId === cartItemId)?.id || '';
    }
    return menuItemId || '';
  }, [cartItemId, menuItemId, items]);

  // Initialize selected addons
  useEffect(() => {
    const initialSelected = new Map<string, number>();

    if (cartItemId) {
      const currentParentItem = items.find(item => item.cartItemId === cartItemId);
      const currentExistingAddons = currentParentItem?.addons || [];
      currentExistingAddons.forEach(addon => {
        initialSelected.set(addon.id, addon.quantity);
      });
    } else if (initialAddons) {
      initialAddons.forEach(addon => {
        initialSelected.set(addon.id, addon.quantity);
      });
    }

    setSelectedAddons(initialSelected);
  }, [cartItemId, initialAddons, items]);

  // Fetch addon-eligible items
  useEffect(() => {
    const fetchAddons = async () => {
      if (!parentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        const url = `${apiBaseUrl}/api/menu/addons?parentItemId=${parentId}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const mappedItems: IMenuItem[] = data.map((item: any) => ({
            id: item._id || item.id,
            title: locale === 'ja' ? (item.nameJp || item.nameEn || '無題') : (item.nameEn || item.nameJp || 'Untitled'),
            price: item.price,
            description: locale === 'ja' ? (item.nameJp || item.nameEn || '') : (item.nameEn || item.nameJp || ''),
            image: item.imageUrl,
            isAvailable: item.isActive,
            category: item.category,
            subcategory: item.subcategory,
            isAddon: item.isAddon,
          }));
          setAddonItems(mappedItems);
        }
      } catch (error) {
        console.error("Error fetching addons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddons();
  }, [parentId, locale]);

  const updateAddonQuantity = (addonId: string, quantity: number) => {
    const newSelected = new Map(selectedAddons);
    if (quantity <= 0) {
      newSelected.delete(addonId);
    } else {
      newSelected.set(addonId, quantity);
    }
    setSelectedAddons(newSelected);
  };

  const handleSave = () => {
    const finalAddons: ICartItem[] = [];
    selectedAddons.forEach((quantity, addonId) => {
      const addonItem = addonItems.find(item => item.id === addonId);
      if (addonItem) {
        finalAddons.push({
          ...addonItem,
          cartItemId: `addon-${addonItem.id}-${Date.now()}`,
          quantity,
          totalAmount: addonItem.price * quantity,
        });
      }
    });

    if (onSaveAddons) {
      // Standalone mode: call callback
      onSaveAddons(finalAddons);
    } else if (cartItemId) {
      // Cart mode: dispatch to global state
      // First remove existing
      const currentItem = items.find(item => item.cartItemId === cartItemId);
      if (currentItem?.addons) {
        currentItem.addons.forEach(addon => {
          dispatch({
            type: "REMOVE_ADDON",
            payload: { cartItemId, addonId: addon.id }
          });
        });
      }

      // Then add new ones
      finalAddons.forEach(addon => {
        dispatch({
          type: "ADD_ADDON",
          payload: { cartItemId, addon }
        });
      });
    }

    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {addonItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noAddons')}</p>
          ) : (
            addonItems.map((addon) => {
              const quantity = selectedAddons.get(addon.id) || 0;
              return (
                <div
                  key={addon.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={addon.image || "/kottu.jpg"}
                      alt={addon.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{addon.title}</h3>
                    <p className="text-sm text-gray-600">¥{addon.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateAddonQuantity(addon.id, quantity - 1)}
                      disabled={quantity === 0}
                      className="w-8 h-8 rounded-full bg-primary text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => updateAddonQuantity(addon.id, quantity + 1)}
                      className="w-8 h-8 rounded-full bg-primary text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

