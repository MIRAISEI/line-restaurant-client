import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { updateMenuItem, type MenuItem } from "@/lib/admin-api";

interface EditFoodModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSuccess: () => void;
  menuItems?: MenuItem[];
}

export default function EditFoodModal({
  isOpen,
  item,
  onClose,
  onSuccess,
  menuItems = [],
}: EditFoodModalProps) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [formData, setFormData] = useState({
    nameEn: "",
    nameJp: "",
    price: "",
    imageUrl: "",
    category: "",
    subcategory: "",
    isActive: true,
    isAddon: false,
    allowedAddons: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get unique categories from existing menu items
  const existingCategories = useMemo(() => {
    const categories = Array.from(
      new Set(menuItems.map((item) => item.category).filter(Boolean))
    ).sort();
    // Add default categories if no menu items exist
    if (categories.length === 0) {
      return ["Main Course", "Appetizer", "Dessert", "Drink", "Side Dish"];
    }
    return categories;
  }, [menuItems]);

  // Get all addon items for selection (exclude current item if it's an addon)
  const addonItems = useMemo(() => {
    return menuItems.filter(
      (menuItem) => menuItem.isAddon && menuItem.isActive && menuItem._id !== item?._id
    );
  }, [menuItems, item]);

  useEffect(() => {
    if (item) {
      setFormData({
        nameEn: item.nameEn,
        nameJp: item.nameJp,
        price: item.price.toString(),
        imageUrl: item.imageUrl,
        category: item.category,
        subcategory: item.subcategory || "",
        isActive: item.isActive,
        isAddon: item.isAddon || false,
        allowedAddons: item.allowedAddons || [],
      });
      setError(null);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.nameEn.trim() || !formData.nameJp.trim()) {
        setError(t('errorNameEnJpRequired'));
        setIsSubmitting(false);
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError(t('errorPricePositive'));
        setIsSubmitting(false);
        return;
      }

      if (!formData.imageUrl.trim()) {
        setError(t('errorImageUrlRequired'));
        setIsSubmitting(false);
        return;
      }

      // Get the item ID
      const itemId = item._id;
      if (!itemId) {
        setError("Invalid menu item: missing ID");
        setIsSubmitting(false);
        return;
      }

      // Update menu item
      await updateMenuItem(itemId, {
        nameEn: formData.nameEn.trim(),
        nameJp: formData.nameJp.trim(),
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim() || null,
        isActive: formData.isActive,
        isAddon: formData.isAddon,
        allowedAddons: formData.allowedAddons,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update menu item:", err);
      // Display the actual error message from the API
      const errorMessage = err instanceof Error ? err.message : "Failed to update menu item. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md touch-manipulation"
      onClick={handleClose}
    >
      <div
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/50 backdrop-blur-sm touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#06C755] via-[#00C300] to-[#06C755] px-6 md:px-8 py-6 md:py-7 flex items-center justify-between rounded-t-3xl shadow-lg z-10 min-h-[80px]">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              {t('editFoodItem')}
            </h2>
            <p className="text-base md:text-lg text-white/95 mt-2 font-medium">
              {t('updateMenuItem')}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/90 active:text-white transition-all duration-200 p-3 md:p-4 active:bg-white/30 rounded-full backdrop-blur-sm min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px] flex items-center justify-center touch-manipulation disabled:opacity-50"
            aria-label={t('close')}
          >
            <svg
              className="w-7 h-7 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-bold">
                {error}
              </div>
            )}

            {/* Name (EN) */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                {t('nameEn')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                placeholder="e.g., Sukiyaki Set"
              />
            </div>

            {/* Name (JP) */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                {t('nameJp')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nameJp}
                onChange={(e) =>
                  setFormData({ ...formData, nameJp: e.target.value })
                }
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                placeholder="e.g., すき焼きセット"
              />
            </div>

            {/* Price and Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {/* Price */}
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  {t('priceYen')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  min="0"
                  step="1"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                  placeholder="1500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  {t('category')} <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs font-normal ml-2">({t('selectCategory')})</span>
                </label>
                <input
                  type="text"
                  list="category-list-edit"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                  placeholder={t('typeOrSelectCategory')}
                  autoComplete="off"
                />
                <datalist id="category-list-edit">
                  {existingCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                {existingCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 font-medium">{t('existingCategories')}</span>
                    {existingCategories.slice(0, 5).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData({ ...formData, category })}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                    {existingCategories.length > 5 && (
                      <span className="text-xs text-gray-400">+{existingCategories.length - 5} {t('more')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                {t('subcategory')} <span className="text-gray-400 text-xs">({t('optional')})</span>
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value })
                }
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                placeholder="e.g., Sushi, Ramen"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                {t('imageUrl')} <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                placeholder="https://via.placeholder.com/150"
              />
            </div>

            {/* Image Preview */}
            {formData.imageUrl && (
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  {t('preview')}
                </label>
                <div className="w-32 h-32 relative rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <Image
                    src={formData.imageUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Status Toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-6 h-6 rounded border-2 border-gray-300 text-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
                />
                <span className="text-base font-bold text-gray-900">
                  {t('activeVisible')}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAddon}
                  onChange={(e) =>
                    setFormData({ ...formData, isAddon: e.target.checked })
                  }
                  className="w-6 h-6 rounded border-2 border-gray-300 text-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
                />
                <span className="text-base font-bold text-gray-900">
                  {t('availableAsAddon')}
                </span>
              </label>
            </div>

            {/* Allowed Addons Selection */}
            {!formData.isAddon && addonItems.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  {t('allowedAddons')} <span className="text-gray-400 text-xs">({t('selectAddons')})</span>
                </label>
                <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-white/80">
                  {addonItems.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('noAddonsAvailable')} {t('createAddonsFirst')}</p>
                  ) : (
                    <div className="space-y-2">
                      {addonItems.map((addon) => (
                        <label
                          key={addon._id}
                          className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={formData.allowedAddons.includes(addon._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  allowedAddons: [...formData.allowedAddons, addon._id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  allowedAddons: formData.allowedAddons.filter(
                                    (id) => id !== addon._id
                                  ),
                                });
                              }
                            }}
                            className="w-5 h-5 rounded border-2 border-gray-300 text-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-900 flex-1">
                            {locale === 'ja' ? addon.nameJp : addon.nameEn} ({locale === 'ja' ? addon.nameEn : addon.nameJp})
                          </span>
                          <span className="text-sm text-gray-600">¥{addon.price.toLocaleString()}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.allowedAddons.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('addonsSelected', { count: formData.allowedAddons.length })}
                  </p>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t-2 border-white/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>{t('editFoodItem')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

