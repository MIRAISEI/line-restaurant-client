"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getMenuItems, updateMenuItem, deleteMenuItem, type MenuItem } from "@/lib/admin-api";
import Image from "next/image";
import MenuFilterBar from "./MenuFilterBar";
import AddFoodModal from "./AddFoodModal";
import EditFoodModal from "./EditFoodModal";

export default function MenuTable() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setLoading(true);
        const data = await getMenuItems();
        setAllMenuItems(data);
        setMenuItems(data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMenuItems();
  }, []);

  const handleRefresh = async () => {
    try {
      const data = await getMenuItems();
      setAllMenuItems(data);
      setMenuItems(data);
    } catch (error) {
      console.error("Failed to refresh menu items:", error);
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    try {
      const itemId = item._id;
      if (!itemId) {
        console.error("Invalid menu item: missing ID");
        return;
      }
      await updateMenuItem(itemId, { isActive: !item.isActive });
      handleRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    const itemName = locale === 'ja' ? item.nameJp : item.nameEn;
    if (!confirm(t('areYouSureDelete', { name: itemName }))) {
      return;
    }
    try {
      const itemId = item._id;
      if (!itemId) {
        console.error("Invalid menu item: missing ID");
        alert("Error: Invalid menu item ID");
        return;
      }
      await deleteMenuItem(itemId);
      // Refresh the menu items after deletion
      await handleRefresh();
    } catch (error) {
      console.error("Failed to delete item:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete menu item. Please try again.";
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
          <p className="text-gray-600 font-medium text-lg">{t('loadingMenu')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MenuFilterBar
        menuItems={allMenuItems}
        onFilterChange={setMenuItems}
        onAddNew={() => setIsAddModalOpen(true)}
      />

      {menuItems.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
              🍽️
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">{t('noMenuFound')}</p>
            <p className="text-gray-500 mb-6">{t('tryAdjustingFilters')}</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation"
            >
              {t('addNewFood')}
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
                    {t('price')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('category')}
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
                {menuItems.map((item, index) => (
                  <tr
                    key={item._id || `menu-item-${index}`}
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-200 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-20 w-20 md:h-24 md:w-24 relative rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-200">
                        <Image
                          src={item.imageUrl}
                          alt={locale === 'ja' ? item.nameJp : item.nameEn}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {locale === 'ja' ? item.nameJp : item.nameEn}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {locale === 'ja' ? item.nameEn : item.nameJp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        ¥{item.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold inline-block">
                        {item.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 shadow-sm transition-all duration-200 active:scale-95 touch-manipulation ${item.isActive
                            ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                          }`}
                      >
                        {item.isActive ? t('active') : t('inactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-4 py-2 text-sm font-bold text-[#31a354] bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[40px] border border-green-200"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
        menuItems={allMenuItems}
      />

      {/* Edit Food Modal */}
      <EditFoodModal
        isOpen={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={handleRefresh}
        menuItems={allMenuItems}
      />
    </div>
  );
}


