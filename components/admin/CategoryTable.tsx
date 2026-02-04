"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getCategories, updateCategory, deleteCategory, type Category } from "@/lib/admin-api";
import Image from "next/image";
import EditCategoryModal from "./EditCategoryModal";

export default function CategoryTable() {
    const t = useTranslations('Admin');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (category: Category) => {
        try {
            await updateCategory(category._id, { isActive: !category.isActive });
            fetchCategories();
        } catch (error) {
            console.error("Failed to update category status:", error);
        }
    };

    const handleDelete = async (category: Category) => {
        if (!confirm(t('areYouSureDelete', { name: category.name }))) {
            return;
        }
        try {
            await deleteCategory(category._id);
            fetchCategories();
        } catch (error) {
            console.error("Failed to delete category:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to delete category. Please try again.";
            alert(`Error: ${errorMessage}`);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
                <div className="text-center">
                    <div className="inline-block relative mb-4">
                        <div className="w-16 h-16 border-4 border-[#31a354]/20 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-[#31a354] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium text-lg">{t('loadingCategories')}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation"
                >
                    {t('addNewCategory')}
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
                            📂
                        </div>
                        <p className="text-xl font-bold text-gray-900 mb-2">{t('noCategoriesFound')}</p>
                        <p className="text-gray-500 mb-6">{t('addFirstCategory')}</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation"
                        >
                            {t('addNewCategory')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {t('image')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {t('name')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {t('status')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {t('actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {categories.map((category, index) => (
                                    <tr
                                        key={category._id || `category-${index}`}
                                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-200 group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-20 w-20 md:h-24 md:w-24 relative rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-200">
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-base font-bold text-gray-900">
                                                {category.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(category)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 shadow-sm transition-all duration-200 active:scale-95 touch-manipulation ${category.isActive
                                                        ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                                                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {category.isActive ? t('active') : t('inactive')}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingCategory(category)}
                                                    className="px-4 py-2 text-sm font-bold text-[#31a354] bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[40px] border border-green-200"
                                                >
                                                    {t('edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[40px] border border-red-200"
                                                >
                                                    {t('delete')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Category Modal */}
            <EditCategoryModal
                isOpen={isAddModalOpen || editingCategory !== null}
                category={editingCategory}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                }}
                onSuccess={() => {
                    fetchCategories();
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                }}
            />
        </div>
    );
}
