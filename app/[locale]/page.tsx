<<<<<<< dev/yohan-payments
import MenuItemsFilter from "@/components/MenuItemsFilter";
import { MenuItemsResponse } from "@/types/menu-types";
=======
>>>>>>> main
import { getTranslations, getLocale } from 'next-intl/server';
import MenuContent from "@/components/MenuContent";

// Get API base URL - use sukiya-api backend
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "";
}

<<<<<<< dev/yohan-payments
async function getMenuItems(locale: string): Promise<MenuItemsResponse> {
=======
const API_BASE_URL = getApiBaseUrl(); // Define API_BASE_URL here

interface Category {
  id: string;
  name: string;
  nameEn: string;
  nameJp: string;
  imageUrl?: string;
  isActive?: boolean;
}

async function getCategories(): Promise<Category[]> {
>>>>>>> main
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
<<<<<<< dev/yohan-payments
      console.error('Failed to fetch menu items:', response.status, response.statusText);
      return { items: [], categories: []};
    }

    const data = await response.json();

    // Map API response to IMenuItem format
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
    const activeItems:ApiMenuItem[] = data.filter((item: ApiMenuItem) => item.isActive !== false);
    const categories = Array.from(
      new Set(
        //activeItems.map((item: ApiMenuItem) => item.category)
          activeItems
        .map((item): string | undefined => item.category)
        .filter(
          (category): category is string => typeof category === 'string'
        )
      )
    );
    const items = activeItems // Only show active items
      .map((item: ApiMenuItem) => ({
        id: item.id || item._id || '',
        title: locale === 'ja' ? (item.nameJp || item.nameEn || '無題') : (item.nameEn || item.nameJp || 'Untitled'),
        price: item.price || 0,
        description: locale === 'ja' ? (item.nameJp || item.nameEn || '') : (item.nameEn || item.nameJp || ''),
        image: item.imageUrl || '/kottu.jpg',
        isAvailable: item.isActive !== false,
        category: item.category || '',
        subcategory: item.subcategory || null,
=======
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data
      .filter((cat: Category) => cat.isActive !== false)
      .map((cat: Category) => ({
        id: cat.nameEn || cat.name, // We use nameEn as ID for filtering in menu API
        name: cat.name,
        nameEn: cat.nameEn || cat.name || '',
        nameJp: cat.nameJp || cat.name || '',
        imageUrl: cat.imageUrl,
>>>>>>> main
      }));
      return {
        items,
        categories};
  } catch (error) {
<<<<<<< dev/yohan-payments
    console.error('Error fetching menu items from API:', error);
    return { items: [], categories: []};
=======
    console.error('Error fetching categories:', error);
    return [];
>>>>>>> main
  }
}

export default async function Home() {
  const t = await getTranslations('Home');
<<<<<<< dev/yohan-payments
  const {items, categories} = await getMenuItems(locale);
=======
  const categories = await getCategories();
  const apiBaseUrl = getApiBaseUrl();
>>>>>>> main

  return (
    <main className="flex min-h-screen bg-background transition-colors duration-300">
      <div className="inner-wrapper flex-col mt-[100px]">
<<<<<<< dev/yohan-payments
        <h1 className="text-3xl font-bold">{t('hello')}</h1>
        <p className="text-muted-foreground">{t('welcome')}</p>
       
        {items.length > 0 ? (
          
             <MenuItemsFilter items={items} categories={categories}/>
          
        ) : (
          <div className="mt-8 text-center text-muted-foreground">
            <p>{t('noItems')}</p>
          </div>
        )}
=======
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('hello')}</h1>
          <p className="text-muted-foreground">{t('welcome')}</p>
        </div>

        <MenuContent
          initialCategories={categories}
          apiBaseUrl={apiBaseUrl}
        />
>>>>>>> main
      </div>
    </main>
  );
}
