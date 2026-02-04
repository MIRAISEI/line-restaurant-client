'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import MenuItemCard from "@/components/MenuItemCard";
import CategorySelector from "@/components/CategorySelector";
import { IMenuItem } from "@/types/menu-types";

interface Category {
    id: string;
    name: string;
    imageUrl?: string;
}

interface MenuContentProps {
    initialCategories: Category[];
    apiBaseUrl: string;
}

export default function MenuContent({ initialCategories, apiBaseUrl }: MenuContentProps) {
    const locale = useLocale();
    const t = useTranslations('Home');
    const [categories] = useState<Category[]>(initialCategories);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        initialCategories.length > 0 ? initialCategories[0].name : null
    );
    const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMenuItems = useCallback(async (categoryName: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/menu?category=${encodeURIComponent(categoryName)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error('Failed to fetch menu items:', response.status);
                setMenuItems([]);
                return;
            }

            const data = await response.json();

            interface ApiMenuItem {
                id?: string;
                _id?: string;
                nameEn?: string;
                nameJp?: string;
                price?: number;
                imageUrl?: string;
                category?: string;
                subcategory?: string | null;
                isActive?: boolean;
            }

            const mappedItems = data
                .filter((item: ApiMenuItem) => item.isActive !== false)
                .map((item: ApiMenuItem) => ({
                    id: item.id || item._id || '',
                    title: locale === 'ja' ? (item.nameJp || item.nameEn || '無題') : (item.nameEn || item.nameJp || 'Untitled'),
                    price: item.price || 0,
                    description: locale === 'ja' ? (item.nameJp || item.nameEn || '') : (item.nameEn || item.nameJp || ''),
                    image: item.imageUrl || '/kottu.jpg',
                    isAvailable: item.isActive !== false,
                    category: item.category || '',
                    subcategory: item.subcategory || null,
                }));

            setMenuItems(mappedItems);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl, locale]);

    useEffect(() => {
        if (selectedCategory) {
            fetchMenuItems(selectedCategory);
        }
    }, [selectedCategory, fetchMenuItems]);

    return (
        <div className="flex flex-col gap-8">
            <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            {loading ? (
                <div className="grid grid-cols-2 gap-2 w-full md:grid-cols-3 lg:grid-cols-4 md:gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-muted rounded-2xl h-64 w-full" />
                    ))}
                </div>
            ) : menuItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 w-full md:grid-cols-3 lg:grid-cols-4 md:gap-4">
                    {menuItems.map((item) => (
                        <MenuItemCard key={item.id} item={item} />
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-muted-foreground">
                    <p>{t('noItems')}</p>
                </div>
            )}
        </div>
    );
}
