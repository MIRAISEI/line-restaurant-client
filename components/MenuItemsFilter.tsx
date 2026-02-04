"use client";
import { IMenuItem } from "@/types/menu-types";
import { useState } from "react";
import MenuItemCard from "./MenuItemCard";


interface MenuProps {
  items: IMenuItem[];
  categories: string[];
}

const MenuItemsFilter = ({items,categories}: MenuProps) => {
const [selectedCategory, setSeletedCategory] = useState<string | null>(null);

const filteredItems = selectedCategory ? items.filter((item)=>item.category === selectedCategory) : items;

  return (
    <div>
        {categories.length > 0 && (
            <div>
            <ul className="flex space-x-4 mt-10 mb-4 leading-1 uppercase text-[14px]">
                <li
                  key="all"
                  onClick={() => setSeletedCategory(null)}
                  className={`px-2 pb-[2px]  border-2 border-primary rounded-md cursor-pointer ${selectedCategory === null ? 'bg-primary text-white' : ''}`}
                >
                  All
                </li>
                {categories.map((category) => (
                  <li
                    key={category}
                    onClick={() => setSeletedCategory(category)}
                    className={`px-2 pb-[2px] border-2 border-primary rounded-md cursor-pointer ${selectedCategory === category ? 'bg-primary text-white' : ''}`}
                  >
                    {category}
                  </li>
                ))}
            </ul>
            {filteredItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 w-full md:grid-cols-3 lg:grid-cols-4 mt-8 md:gap-4">
                {filteredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
            </div>
            )
                }

    </div>
  )
}

export default MenuItemsFilter