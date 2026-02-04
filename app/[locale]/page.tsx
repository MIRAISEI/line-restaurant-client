import MenuItemsFilter from "@/components/MenuItemsFilter";
import { MenuItemsResponse } from "@/types/menu-types";
import { getTranslations, getLocale } from 'next-intl/server';

// Get API base URL - use sukiya-api backend
function getApiBaseUrl(): string {
  // If explicitly set in env, use it (for local development: http://localhost:5001)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Default to production API URL
  return "";
}

async function getMenuItems(locale: string): Promise<MenuItemsResponse> {
  try {
    // Fetch from sukiya-api backend
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/menu`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // For server components, we can use cache: 'no-store' to always get fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
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
      }));
      return {
        items,
        categories};
  } catch (error) {
    console.error('Error fetching menu items from API:', error);
    return { items: [], categories: []};
  }
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('Home');
  const {items, categories} = await getMenuItems(locale);

  return (
    <main className="flex min-h-screen bg-background transition-colors duration-300">
      <div className="inner-wrapper flex-col mt-[100px]">
        <h1 className="text-3xl font-bold">{t('hello')}</h1>
        <p className="text-muted-foreground">{t('welcome')}</p>
       
        {items.length > 0 ? (
          
             <MenuItemsFilter items={items} categories={categories}/>
          
        ) : (
          <div className="mt-8 text-center text-muted-foreground">
            <p>{t('noItems')}</p>
          </div>
        )}
      </div>
    </main>
  );
}
