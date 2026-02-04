"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import LineIdMessage from "@/components/LineIdMessage";
import { useCart } from "@/context/CartContext";
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from "./ui/button";

const Header = () => {
    const t = useTranslations('Header');
    const locale = useLocale();
    const pathname = usePathname();
    const { items } = useCart();
    const router = useRouter();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const toggleLanguage = () => {
        const nextLocale = locale === 'en' ? 'ja' : 'en';
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <>
            <header className="flex fixed t-0 l-0 w-full h-[85px] bg-primary py-1 border-b-2 border-border-color shadow-sm z-50">
                <div className="inner-wrapper flex-row justify-between">
                    <div className="flex gap-3 items-center">
                        <div className="logo-wrapper">
                            <Image src="/logo.png" width={80} height={40} alt={t('title')} />
                        </div>
                        <h1 className="text-2xl md:text-3xl text-[#ffdf93] font-bold leading-0">{t('title')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <Button
                            onClick={toggleLanguage}
                            className="bg-transparent hover:bg-primary/80 border-2 border-[#ffdf93] text-[#ffdf93] px-3 py-1 font-bold"
                        >
                            {locale === 'en' ? '日本語' : 'EN'}
                        </Button>

                        {/* Cart Button */}
                        <Button
                            onClick={() => router.push("/cart")}
                            className="relative bg-transparent hover:bg-primary/80 border-2 border-[#ffdf93] text-[#ffdf93] px-4 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <span className="hidden md:inline">{t('cart')}</span>
                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </div>
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <LineIdMessage />
        </>
    )
}

export default Header;