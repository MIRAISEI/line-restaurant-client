"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

function PaymentSuccessContent() {
  const t = useTranslations('PaymentSuccess');
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="flex min-h-screen bg-background transition-colors duration-300">
      <div className="inner-wrapper flex-col mt-[100px] py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 md:p-12">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>

            {orderId && (
              <p className="text-lg text-gray-600 mb-2">
                {t('orderId')}: <span className="font-bold text-primary">{orderId}</span>
              </p>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                <strong>{t('thankYou')}</strong> {t('paidDesc')}
              </p>
            </div>

            <p className="text-gray-600 mb-8">
              {t('enjoyDesc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all duration-200"
              >
                {t('backToMenu')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  const t = useTranslations('PaymentSuccess');
  return (
    <Suspense fallback={
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 md:p-12">
              <p>{t('loading')}</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

















