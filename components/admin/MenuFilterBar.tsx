import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type MenuItem } from "@/lib/admin-api";

interface MenuFilterBarProps {
  menuItems: MenuItem[];
  onFilterChange: (filteredItems: MenuItem[]) => void;
  onAddNew: () => void;
}

export default function MenuFilterBar({
  menuItems,
  onFilterChange,
  onAddNew,
}: MenuFilterBarProps) {
  const t = useTranslations('Admin');
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get unique categories
  const uniqueCategories = Array.from(
    new Set(menuItems.map((item) => item.category))
  ).sort();

  useEffect(() => {
    let filtered = [...menuItems];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter === "active") {
      filtered = filtered.filter((item) => item.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((item) => !item.isActive);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nameEn.toLowerCase().includes(query) ||
          item.nameJp.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    onFilterChange(filtered);
  }, [menuItems, categoryFilter, statusFilter, searchQuery, onFilterChange]);

  const handleClearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim() !== "";

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 md:p-7 mb-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-5">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-gradient-to-b from-[#31a354] to-[#31a354] rounded-full"></span>
          {t('filtersAndSearch')}
        </h3>
        <button
          onClick={onAddNew}
          className="px-6 py-3 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>{t('addNewFood')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('search')}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          />
        </div>

        {/* Filter by Category */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('category')}
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          >
            <option value="all">{t('allCategories')}</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('status')}
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {t('activeFilters')}:
            </span>
            {categoryFilter !== "all" && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
                {t('category')}: {categoryFilter}
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold border border-purple-200">
                {t('status')}: {statusFilter === "active" ? t('active') : t('inactive')}
              </span>
            )}
            {searchQuery.trim() !== "" && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                {t('search')}: {searchQuery}
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 active:scale-95 touch-manipulation"
            >
              {t('clearAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

