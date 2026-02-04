"use client";
import Image from "next/image";
import { Button } from "./ui/button";
import { useState } from "react";
import { IMenuItem } from "@/types/menu-types";
import { useCart } from "@/context/CartContext";
import { ICartItem } from "@/types/cart-types";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface ItemDetails {
    isOpen: boolean;
    isClose: () => void;
    item: IMenuItem;
}

const MenuItemDetail: React.FC<ItemDetails> = ({ isOpen, isClose, item }) => {
    const t = useTranslations('Common');
    const [dishQuantity, setDishQuantity] = useState(1);
    const [amount, setAmount] = useState(item.price);
    const { dispatch } = useCart();
    const router = useRouter();

    if (!isOpen) return null;
    //increase quntity
    const IncreaseQuantity = () => {
        setDishQuantity(prev => prev + 1);
        setAmount(prev => prev + item.price);
    };
    //decrease quantity
    const DecreaseQuantity = () => {
        setDishQuantity(prev => prev > 1 ? prev - 1 : 1);
        setAmount(prev => dishQuantity > 1 ? prev - item.price : item.price);
    };

    // Add item to cart
    const handleAddToCart = () => {
        const cartItem: ICartItem = {
            ...item,
            quantity: dishQuantity,
            totalAmount: amount
        };
        dispatch({ type: "ADD_ITEM", payload: cartItem });
        isClose(); // Close the modal after adding
    };

    // Add to cart and go to checkout
    const handleCheckout = () => {
        const cartItem: ICartItem = {
            ...item,
            quantity: dishQuantity,
            totalAmount: amount
        };
        dispatch({ type: "ADD_ITEM", payload: cartItem });
        isClose(); // Close the modal
        router.push("/checkout"); // Navigate to checkout
    };

    return (
        <div className="model fixed flex inset-0 items-center justify-center bg-black bg-opacity-70 z-50"
            onClick={isClose}
        >
            <div className="relative max-w-[95%] w-full max-h-[90vh] md:w-[560px] flex flex-col">
                <div className="bg-white w-full flex-1 rounded-tr-[42px] overflow-hidden shadow-[4px_5px_13px_#695f5f] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col relative gap-2 pb-24">
                            <div className="relative w-full h-[175px] md:h-[280px]">
                                <Image
                                    src={item.image || "/kottu.jpg"}
                                    alt={item.title}
                                    fill style={{ objectFit: "cover" }}
                                />
                                <div className="bg-red-500 bg-opacity-90 text-white font-bold px-2 py-1 absolute right-0 bottom-0">{t('price')}: <span>{item.price}&yen;</span></div>
                            </div>
                            <div className="item-intro block w-full px-2 text-[#666]">
                                <h3 className="text-primary font-bold text-2xl my-3">{item.title}</h3>

                                <p>{item.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Fixed bottom section with buttons */}
                    <div className="sticky bottom-0 bg-primary px-4 py-3 mt-auto">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <div className="flex items-center justify-center space-x-2">
                                    <span className="text-white font-semibold">{t('dishes')}</span>
                                    <button
                                        className="flex bg-yellow-500 text-white w-6 h-6 justify-center items-center leading-none rounded"
                                        onClick={(e) => { e.stopPropagation(); DecreaseQuantity(); }}
                                    >
                                        <span className="h-[22px] text-[18px] leading-1">-</span>
                                    </button>
                                    <span className="min-w-[20px] text-center text-white font-semibold">{dishQuantity}</span>
                                    <button
                                        className="flex bg-yellow-500 text-white w-6 h-6 justify-center items-center leading-none text-[18px] rounded"
                                        onClick={(e) => { e.stopPropagation(); IncreaseQuantity(); }}
                                    >
                                        <span className="h-[22px] text-[18px] leading-1">+</span>
                                    </button>
                                </div>
                                <span className="flex mt-1 text-white font-semibold">
                                    {t('amount')}: <span className="ml-1 text-white font-bold">{amount} &yen;</span>
                                </span>
                            </div>
                            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    className="text-white bg-green-600 hover:bg-green-700 min-w-[120px]"
                                    onClick={handleAddToCart}
                                >
                                    {t('addToCart')}
                                </Button>
                                <Button
                                    className="text-white bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                                    onClick={handleCheckout}
                                >
                                    {t('checkout')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <span
                    className="flex absolute w-8 h-8 top-[-15px] right-[-15px] bg-primary text-white p-1 text-[16px] items-center justify-center rounded-[50%] cursor-pointer hover:bg-red-600 transition-colors z-10"
                    onClick={isClose}
                >X</span>
            </div>
        </div>
    )
};

interface MenuItemCardProps {
    item: IMenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
    const t = useTranslations('Common');
    const [isModelOpen, setIsModelOpen] = useState(false);
    const isOpen = () => setIsModelOpen(true);
    const isClose = () => setIsModelOpen(false);
    return (
        <>
            <div
                className="flex flex-col relative gap-2 w-[100%] h-[220px] md:h-[285px] bg-primary shadow-[4px_5px_13px_#695f5f] mb-4 rounded-tr-[42px] overflow-hidden pb-13"
                onClick={isOpen}
            >
                <div className="relative w-full h-[105px] md:h-[175px]">
                    <Image
                        src={item.image || "/kottu.jpg"}
                        alt={item.title}
                        fill style={{ objectFit: "cover" }}
                    />
                </div>
                <div className="item-intro px-2 text-white">
                    <h3 className="font-bold">{item.title}</h3>
                    <div>{t('price')}: <span>{item.price}</span>&yen;</div>
                </div>
                <div className="flex absolute inset-x-2 bottom-2 h-10 justify-center">
                    <Button className="text-white">{t('orderDish')}</Button>
                </div>
            </div>
            <MenuItemDetail isOpen={isModelOpen} isClose={isClose} item={item} />
        </>
    )
};

export default MenuItemCard;