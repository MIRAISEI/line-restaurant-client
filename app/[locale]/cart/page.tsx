"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import AddonSelector from "@/components/AddonSelector";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

function CartContent() {
    const t = useTranslations('Cart');
    const router = useRouter();
    const searchParams = useSearchParams();
    const tableFromQr = searchParams.get("table") || searchParams.get("tableNumber");
    const { items, totalCartAmount, dispatch } = useCart();
    const [selectedItemForAddons, setSelectedItemForAddons] = useState<string | null>(null);

    if (items.length === 0) {
        return (
            <div className="flex min-h-screen bg-background transition-colors duration-300">
                <div className="inner-wrapper flex-col mt-[100px] py-8">
                    <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600 mb-4">{t('empty')}</p>
                        <Button onClick={() => router.push("/")} className="bg-primary text-white">
                            {t('backToMenu')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background transition-colors duration-300">
            <div className="inner-wrapper flex-col mt-[100px] py-8">
                <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => {
                            const itemTotal = item.totalAmount + (item.addons?.reduce((sum, addon) => sum + addon.totalAmount, 0) || 0);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                                >
                                    <div className="flex gap-4">
                                        {/* Item Image */}
                                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.image || "/kottu.jpg"}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                ¥{item.price.toLocaleString()} {t('each')}
                                            </p>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity > 1) {
                                                            dispatch({
                                                                type: "UPDATE_QUANTITY",
                                                                payload: { id: item.id, newQuantity: item.quantity - 1 },
                                                            });
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                                                >
                                                    −
                                                </button>
                                                <span className="text-lg font-semibold min-w-[30px] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        dispatch({
                                                            type: "UPDATE_QUANTITY",
                                                            payload: { id: item.id, newQuantity: item.quantity + 1 },
                                                        });
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center font-bold"
                                                >
                                                    +
                                                </button>
                                                <span className="ml-auto text-lg font-bold">
                                                    ¥{itemTotal.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Addons Display */}
                                            {item.addons && item.addons.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                    <p className="text-sm font-semibold text-gray-700 mb-1">{t('addons')}:</p>
                                                    {item.addons.map((addon) => (
                                                        <div key={addon.id} className="flex justify-between text-sm mb-1">
                                                            <span className="text-gray-600">
                                                                + {addon.title} (×{addon.quantity})
                                                            </span>
                                                            <span className="font-medium">¥{addon.totalAmount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-3 flex-wrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedItemForAddons(item.id)}
                                                    className="text-xs flex-1 min-w-[100px]"
                                                >
                                                    {item.addons && item.addons.length > 0 ? t('editAddons') : t('addAddons')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        dispatch({
                                                            type: "REMOVE_ITEM",
                                                            payload: { id: item.id },
                                                        });
                                                    }}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 min-w-[100px]"
                                                >
                                                    {t('remove')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-[100px]">
                            <h2 className="text-xl font-bold mb-4">{t('summary')}</h2>

                            <div className="space-y-2 mb-4">
                                {items.map((item) => {
                                    const itemTotal = item.totalAmount + (item.addons?.reduce((sum, addon) => sum + addon.totalAmount, 0) || 0);
                                    return (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                {item.title} × {item.quantity}
                                            </span>
                                            <span className="font-medium">¥{itemTotal.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-bold">Total:</span>
                                    <span className="text-2xl font-bold text-primary">
                                        ¥{totalCartAmount.toLocaleString()}
                                    </span>
                                </div>

                                <Button
                                    onClick={() => {
                                        if (tableFromQr) {
                                            router.push(`/checkout?table=${encodeURIComponent(tableFromQr)}`);
                                        } else {
                                            router.push("/checkout");
                                        }
                                    }}
                                    className="w-full bg-primary text-white hover:bg-primary/90 py-3 text-lg font-bold"
                                >
                                    {t('checkout')}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (tableFromQr) {
                                            router.push(`/?table=${encodeURIComponent(tableFromQr)}`);
                                        } else {
                                            router.push("/");
                                        }
                                    }}
                                    className="w-full mt-3"
                                >
                                    {t('backToMenu')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Addon Selector Modal */}
                {selectedItemForAddons && (
                    <AddonSelector
                        parentItemId={selectedItemForAddons}
                        onClose={() => setSelectedItemForAddons(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default function CartPage() {
    const t = useTranslations('Cart');
    return (
        <Suspense fallback={
            <div className="flex min-h-screen bg-background">
                <div className="inner-wrapper flex-col mt-[100px] py-8">
                    <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('loading')}</p>
                </div>
            </div>
        }>
            <CartContent />
        </Suspense>
    );
}
