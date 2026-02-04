"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getOrders, type Order } from "@/lib/admin-api";
import FilterBar from "./FilterBar";
import OrderRow from "./OrderRow";

export default function OrderTable() {
  const t = useTranslations('Admin');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await getOrders();
        // Sort by newest first by default
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // Newest first
        });
        setAllOrders(sortedData);
        setOrders(sortedData);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="text-center">
          <div className="inline-block relative mb-4">
            <div className="w-16 h-16 border-4 border-[#31a354]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#31a354] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">{t('loadingOrders')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FilterBar orders={allOrders} onFilterChange={setOrders} />
      {orders.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
              📭
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">{t('noRecentOrders')}</p>
            <p className="text-gray-500">{t('ordersWillAppear')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('orderId')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('time')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('table')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('orderItems')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('total')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('paymentStatus')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orders.map((order, index) => (
                  <OrderRow
                    key={order._id || `order-${index}`}
                    order={order}
                    onStatusChange={(orderId, newStatus) => {
                      // Update local state (orderId is now the MongoDB _id)
                      const updateOrder = (o: Order) => {
                        const oId = o._id;
                        return oId === orderId ? { ...o, status: newStatus } : o;
                      };
                      setOrders((prev) => prev.map(updateOrder));
                      setAllOrders((prev) => prev.map(updateOrder));
                    }}
                    onPaymentStatusChange={(orderId, newPaymentStatus) => {
                      const updateOrder = (o: Order) => {
                        const oId = o._id;
                        return oId === orderId ? { ...o, paymentStatus: newPaymentStatus } : o;
                      };
                      setOrders((prev) => prev.map(updateOrder));
                      setAllOrders((prev) => prev.map(updateOrder));
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

