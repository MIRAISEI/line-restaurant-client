import { getTranslations, getLocale } from 'next-intl/server';
import MenuContent from "@/components/MenuContent";

// Get API base URL - use sukiya-api backend
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "";
}

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
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
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
      }));
      return {
        items,
        categories};
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function Home() {
  const t = await getTranslations('Home');
  const categories = await getCategories();
  const apiBaseUrl = getApiBaseUrl();

  return (
    <main className="flex min-h-screen bg-background transition-colors duration-300">
      <div className="inner-wrapper flex-col mt-[100px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('hello')}</h1>
          <p className="text-muted-foreground">{t('welcome')}</p>
        </div>

        <MenuContent
          initialCategories={categories}
          apiBaseUrl={apiBaseUrl}
        />
      </div>
    </main>
  );
}
