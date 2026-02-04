import { getTranslations, getLocale } from 'next-intl/server';
import MenuContent from "@/components/MenuContent";

// Get API base URL - use sukiya-api backend
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "";
}

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  isActive?: boolean;
}

async function getCategories(): Promise<Category[]> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const data = await response.json();
    return data
      .filter((cat: Category) => cat.isActive !== false)
      .map((cat: Category) => ({
        id: cat.name, // We use name as ID for filtering in menu API
        name: cat.name,
        imageUrl: cat.imageUrl,
      }));
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
