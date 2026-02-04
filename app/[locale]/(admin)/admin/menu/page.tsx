import { useTranslations } from "next-intl";
import MenuTable from "@/components/admin/MenuTable";

export default function MenuPage() {
  const t = useTranslations('Admin');

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 bg-gradient-to-r from-[#31a354] via-[#31a354] to-[#31a354] bg-clip-text text-transparent drop-shadow-lg">
            {t('foodMenu')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium">
            {t('manageMenu')}
          </p>
        </div>
      </div>
      <MenuTable />
    </div>
  );
}


