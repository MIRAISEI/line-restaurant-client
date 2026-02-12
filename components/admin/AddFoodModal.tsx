import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { createMenuItem, getCategories, type MenuItem, type Category } from "@/lib/admin-api";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuItems?: MenuItem[];
}

export default function AddFoodModal({
  isOpen,
  onClose,
  onSuccess,
  menuItems = [],
}: AddFoodModalProps) {
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [addonSearch, setAddonSearch] = useState("");

  // Fetch categories from API
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      // Only show active categories
      setCategories(data.filter(cat => cat.isActive));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      // Fallback to default categories if fetch fails
      setCategories([]);
    }
  };

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) {
      return categories;
    }
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  // Get all addon items for selection
  const addonItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.isAddon &&
        item.isActive &&
        (item.nameEn.toLowerCase().includes(addonSearch.toLowerCase()) ||
          item.nameJp.toLowerCase().includes(addonSearch.toLowerCase()))
    );
  }, [menuItems, addonSearch]);

  // Group filtered addons by category
  const groupedAddons = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    addonItems.forEach(addon => {
      const cat = addon.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(addon);
    });
    return groups;
  }, [addonItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Create menu item
      await createMenuItem({
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

      // Reset form
      setFormData({
        nameEn: "",
        nameJp: "",
        price: "",
        imageUrl: "",
        category: "",
        subcategory: "",
        isActive: true,
        isAddon: false,
        allowedAddons: [],
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create menu item:", err);
      // Display the actual error message from the API
      const errorMessage = err instanceof Error ? err.message : "Failed to create menu item. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        nameEn: "",
        nameJp: "",
        price: "",
        imageUrl: "",
        category: "Main Course",
        subcategory: "",
        isActive: true,
        isAddon: false,
        allowedAddons: [],
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

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
        <div className="sticky top-0 bg-gradient-to-r from-[#31a354] via-[#31a354] to-[#31a354] px-6 md:px-8 py-6 md:py-7 flex items-center justify-between rounded-t-3xl shadow-lg z-10 min-h-[80px]">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              {t('addFoodItem')}
            </h2>
            <p className="text-base md:text-lg text-white/95 mt-2 font-medium">
              {t('createNewMenuItem')}
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
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
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
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
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
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                  placeholder="1500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {/* Searchable select trigger */}
                  <button
                    type="button"
                    onClick={() => setCategorySearch(categorySearch ? "" : " ")}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300 text-left flex items-center justify-between"
                  >
                    <span className={formData.category ? "text-gray-900" : "text-gray-400"}>
                      {formData.category || t('typeOrSelectCategory')}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Category dropdown */}
                  {categorySearch && (
                    <>
                      {/* Overlay to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setCategorySearch("")}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden flex flex-col">
                        {/* Search input inside dropdown */}
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            value={categorySearch.trim()}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder={t('search')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31a354]/20"
                            autoFocus
                          />
                        </div>
                        {/* Category list */}
                        <div className="overflow-y-auto">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <button
                                key={category._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, category: category.name });
                                  setCategorySearch("");
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                              >
                                <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <Image
                                    src={category.imageUrl}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-medium text-gray-900">{category.name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              {t('noCategoriesFound')}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Selected category display with quick change buttons */}
                {!categorySearch && categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 font-medium">{t('existingCategories')}</span>
                    {categories.slice(0, 5).map((category) => (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: category.name })}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${formData.category === category.name
                          ? 'bg-[#31a354] text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                      >
                        {category.name}
                      </button>
                    ))}
                    {categories.length > 5 && (
                      <span className="text-xs text-gray-400">+{categories.length - 5} {t('more')}</span>
                    )}
                  </div>
                )}
                {/* Validation error if no category selected */}
                {!formData.category && categories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t('noCategoriesFound')}. {t('addFirstCategory')}
                  </p>
                )}
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
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                  placeholder="e.g., Sushi, Ramen"
                />
              </div>
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
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
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
                  className="w-6 h-6 rounded border-2 border-gray-300 text-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
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
                  className="w-6 h-6 rounded border-2 border-gray-300 text-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
                />
                <span className="text-base font-bold text-gray-900">
                  {t('availableAsAddon')}
                </span>
              </label>
            </div>

            {/* Allowed Addons Selection */}
            {menuItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide">
                    {t('allowedAddons')} <span className="text-gray-400 text-xs">({t('selectAddons')})</span>
                  </label>

                  {/* Addon Search */}
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder={t('search') || "Search addons..."}
                      value={addonSearch}
                      onChange={(e) => setAddonSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-[#31a354] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
                  {Object.keys(groupedAddons).length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 font-medium">{t('noAddonsAvailable')}</p>
                      <p className="text-gray-400 text-sm mt-1">{t('tryAdjustingFilters') || "No addons match your search"}</p>
                    </div>
                  ) : (
                    Object.entries(groupedAddons).map(([category, addons]) => (
                      <div key={category} className="p-4">
                        <h5 className="text-xs font-bold text-[#31a354] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#31a354]"></span>
                          {category}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {addons.map((addon) => (
                            <label
                              key={addon._id}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${formData.allowedAddons.includes(addon._id || "")
                                ? "border-[#31a354] bg-[#31a354]/5 shadow-sm"
                                : "border-gray-100 bg-white hover:border-gray-200"
                                }`}
                            >
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                  src={addon.imageUrl || "/placeholder.png"}
                                  alt={addon.nameEn}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {locale === 'ja' ? addon.nameJp : addon.nameEn}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                  ¥{addon.price.toLocaleString()}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.allowedAddons.includes(addon._id || "")}
                                onChange={(e) => {
                                  const id = addon._id || "";
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      allowedAddons: [...formData.allowedAddons, id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedAddons: formData.allowedAddons.filter((aid) => aid !== id),
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-2 border-gray-300 text-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:ring-offset-0"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {formData.allowedAddons.length > 0 && (
                  <div className="flex items-center justify-between px-2">
                    <div className="flex -space-x-2">
                      {formData.allowedAddons.slice(0, 5).map((id) => {
                        const addon = menuItems.find(mi => mi._id === id);
                        return (
                          <div key={id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm relative">
                            <Image src={addon?.imageUrl || ""} alt="" fill className="object-cover" />
                          </div>
                        );
                      })}
                      {formData.allowedAddons.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                          +{formData.allowedAddons.length - 5}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#31a354]">
                      {t('addonsSelected', { count: formData.allowedAddons.length })}
                    </p>
                  </div>
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
                className="px-8 py-3 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('creating')}</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>{t('addFoodItem')}</span>
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

