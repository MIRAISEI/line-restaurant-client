"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserOrders, type Order } from "@/lib/admin-api";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";

export default function HistoryPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('History');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (user?.userId) {
                try {
                    setLoadingOrders(true);
                    const data = await getUserOrders(user.userId);
                    setOrders(data);
                } catch (error) {
                    console.error("Failed to fetch orders", error);
                } finally {
                    setLoadingOrders(false);
                }
            }
        };

        if (user) {
            fetchOrders();
        } else if (!isLoading) {
            setLoadingOrders(false);
        }
    }, [user, isLoading]);

    if (isLoading || loadingOrders) {
        return (
            <div className="min-h-screen bg-gray-50 pt-[100px] flex justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-32 w-full max-w-md bg-gray-200 rounded mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-[100px] pb-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium">{t('noOrders')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                {/* Header */}
                                <div className="bg-gray-50/50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('date')}</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {order.status}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-2">{t('items')} ({order.items.reduce((sum, i) => sum + i.quantity, 0)})</p>
                                        <div className="space-y-2">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={`${item.itemId}-${idx}`} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-700 truncate flex-1 mr-4">
                                                        <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                                                    </span>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <p className="text-xs text-gray-400 italic">
                                                    + {order.items.length - 3} more items
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <span className="text-sm font-bold text-gray-500">{t('total')}</span>
                                        <span className="text-lg font-bold text-primary">¥{order.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
