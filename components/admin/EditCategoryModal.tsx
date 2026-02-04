"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createCategory, updateCategory, type Category } from "@/lib/admin-api";
import Image from "next/image";

interface EditCategoryModalProps {
    isOpen: boolean;
    category: Category | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditCategoryModal({
    isOpen,
    category,
    onClose,
    onSuccess,
}: EditCategoryModalProps) {
    const t = useTranslations('Admin');
    const [formData, setFormData] = useState({
        name: "",
        imageUrl: "",
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                imageUrl: category.imageUrl,
                isActive: category.isActive,
            });
        } else {
            setFormData({
                name: "",
                imageUrl: "",
                isActive: true,
            });
        }
        setError(null);
    }, [category, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (category) {
                // Update existing category
                await updateCategory(category._id, formData);
            } else {
                // Create new category
                await createCategory(formData);
            }
            onSuccess();
        } catch (err) {
            console.error("Failed to save category:", err);
            setError(err instanceof Error ? err.message : "Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white px-8 py-6 rounded-t-3xl">
                    <h2 className="text-3xl font-bold">
                        {category ? t('editCategory') : t('addNewCategory')}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('categoryName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#31a354] focus:border-transparent font-medium transition-all duration-200"
                            placeholder={t('enterCategoryName')}
                        />
                    </div>

                    {/* Image URL */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('imageUrl')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            required
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#31a354] focus:border-transparent font-medium transition-all duration-200"
                            placeholder="https://example.com/image.jpg"
                        />
                        {formData.imageUrl && (
                            <div className="mt-4 relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                                <Image
                                    src={formData.imageUrl}
                                    alt="Category preview"
                                    fill
                                    className="object-cover"
                                    onError={() => setError(t('invalidImageUrl'))}
                                />
                            </div>
                        )}
                    </div>

                    {/* Is Active */}
                    <div className="mb-8">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 text-[#31a354] border-gray-300 rounded focus:ring-[#31a354]"
                            />
                            <span className="text-sm font-bold text-gray-700">
                                {t('categoryIsActive')}
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('saving') : category ? t('updateCategory') : t('createCategory')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
