"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { IMenuItem } from "@/types/menu-types";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

interface AddonSelectorProps {
  parentItemId: string;
  onClose: () => void;
}

export default function AddonSelector({ parentItemId, onClose }: AddonSelectorProps) {
  const t = useTranslations('AddonSelector');
  const locale = useLocale();
  const { items, dispatch } = useCart();
  const [addonItems, setAddonItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState<Map<string, number>>(new Map());

  // Get existing addons for this item - memoized to prevent infinite loops
  const parentItem = useMemo(() =>
    items.find(item => item.id === parentItemId),
    [items, parentItemId]
  );

  const existingAddons = useMemo(() =>
    parentItem?.addons || [],
    [parentItem?.addons]
  );

  // Initialize selected addons only when parentItemId changes
  useEffect(() => {
    // Get current parent item and its addons
    const currentParentItem = items.find(item => item.id === parentItemId);
    const currentExistingAddons = currentParentItem?.addons || [];

    // Initialize selected addons from existing addons
    const initialSelected = new Map<string, number>();
    currentExistingAddons.forEach(addon => {
      initialSelected.set(addon.id, addon.quantity);
    });
    setSelectedAddons(initialSelected);
  }, [parentItemId, items]); // Depend on parentItemId and items

  // Fetch addon-eligible items
  useEffect(() => {
    const fetchAddons = async () => {
      setLoading(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sukiyaapi.vercel.app";
        // Pass parentItemId as query parameter to filter addons
        const url = `${apiBaseUrl}/api/menu/addons${parentItemId ? `?parentItemId=${parentItemId}` : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Map API response to IMenuItem format
          interface ApiMenuItem {
            _id?: string;
            id?: string;
            nameEn?: string;
            nameJp?: string;
            price?: number;
            imageUrl?: string;
            category?: string;
            subcategory?: string | null;
            isActive?: boolean;
            isAddon?: boolean;
          }
          const mappedItems: IMenuItem[] = data.map((item: ApiMenuItem) => ({
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
  }, [parentItemId, locale]); // Only fetch when parentItemId or locale changes

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
    // Remove all existing addons first
    existingAddons.forEach(addon => {
      dispatch({
        type: "REMOVE_ADDON",
        payload: { parentItemId, addonId: addon.id }
      });
    });

    // Add selected addons
    selectedAddons.forEach((quantity, addonId) => {
      const addonItem = addonItems.find(item => item.id === addonId);
      if (addonItem) {
        dispatch({
          type: "ADD_ADDON",
          payload: {
            parentItemId,
            addon: {
              ...addonItem,
              quantity,
              totalAmount: addonItem.price * quantity,
            }
          }
        });
      }
    });

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

