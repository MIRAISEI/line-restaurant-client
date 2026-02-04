"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import DatePicker, { registerLocale } from "react-datepicker";
import { ja } from "date-fns/locale/ja";
import { enUS } from "date-fns/locale/en-US";
import "react-datepicker/dist/react-datepicker.css";
import { type Order } from "@/lib/admin-api";

registerLocale("ja", ja);
registerLocale("en", enUS);

type OrderStatus = Order["status"];
type SortOrder = "newest" | "oldest";

interface FilterBarProps {
  orders: Order[];
  onFilterChange: (filteredOrders: Order[]) => void;
  onSortChange?: (sortOrder: SortOrder) => void;
}

export default function FilterBar({ orders, onFilterChange, onSortChange }: FilterBarProps) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Get unique table numbers
  const uniqueTables = Array.from(
    new Set(orders.map((order) => order.tableNumber))
  ).sort();

  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by table
    if (tableFilter !== "all") {
      filtered = filtered.filter((order) => order.tableNumber === tableFilter);
    }

    // Filter by date (created date)
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === filterDate.getTime();
      });
    }

    // Sort by ordered time
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    onFilterChange(filtered);
  }, [orders, statusFilter, tableFilter, sortOrder, dateFilter, onFilterChange]);

  const handleClearFilters = () => {
    setStatusFilter("all");
    setTableFilter("all");
    setSortOrder("newest");
    setDateFilter(null);
  };

  const handleSortChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    if (onSortChange) {
      onSortChange(newSortOrder);
    }
  };

  const hasActiveFilters = statusFilter !== "all" || tableFilter !== "all" || sortOrder !== "newest" || dateFilter !== null;

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "Received": return t('stats.pending');
      case "Preparing": return t('stats.preparing');
      case "Ready": return t('stats.ready');
      case "Completed": return t('stats.completed');
      default: return status;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 md:p-7 mb-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-gradient-to-b from-[#31a354] to-[#31a354] rounded-full"></span>
          {t('filtersAndSort')}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[44px]"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Filter by Status */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('status')}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="Received">{t('stats.pending')}</option>
            <option value="Preparing">{t('stats.preparing')}</option>
            <option value="Ready">{t('stats.ready')}</option>
            <option value="Completed">{t('stats.completed')}</option>
          </select>
        </div>

        {/* Filter by Table */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('table')}
          </label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          >
            <option value="all">{t('allTables')}</option>
            {uniqueTables.map((table) => (
              <option key={table} value={table}>
                {t('table')} {table}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Date */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('orderDate')}
          </label>
          <DatePicker
            selected={dateFilter}
            onChange={(date) => setDateFilter(date)}
            placeholderText={t('selectDate')}
            dateFormat={locale === 'ja' ? "yyyy/MM/dd" : "MMM dd, yyyy"}
            isClearable
            locale={locale === 'ja' ? "ja" : "en"}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
            wrapperClassName="w-full"
          />
        </div>

        {/* Order by Time */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
            {t('orderBy')}
          </label>
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value as SortOrder)}
            className="w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-bold text-gray-900 shadow-sm focus:border-[#31a354] focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-[#31a354]/50"
          >
            <option value="newest">{t('newestFirst')}</option>
            <option value="oldest">{t('oldestFirst')}</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('activeFilters')}:</span>
            {statusFilter !== "all" && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
                {t('status')}: {getStatusLabel(statusFilter)}
              </span>
            )}
            {tableFilter !== "all" && (
              <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold border border-purple-200">
                {t('table')}: {tableFilter}
              </span>
            )}
            {sortOrder === "oldest" && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                {t('orderBy')}: {t('oldestFirst')}
              </span>
            )}
            {dateFilter && (
              <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-bold border border-orange-200">
                {t('orderDate')}: {dateFilter.toLocaleDateString(locale === 'ja' ? 'ja-JP' : "en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

