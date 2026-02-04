"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  displayName: string;
  tableNumber: string;
  paymentMethod?: 'paypay' | 'manual';
  paymentStatus?: 'pending' | 'paid' | null;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    parentItemId?: string;
  }>;
  total: number;
  status: 'Received' | 'Preparing' | 'Ready' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

function PaymentContent() {
  const t = useTranslations('Payment');
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sukiyaapi.vercel.app";
      const response = await fetch(`${apiBaseUrl}/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Order not found");
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loading'));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId, fetchOrder]);

  const handlePayment = async () => {
    if (!order || !order._id) return;

    setProcessing(true);
    setError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sukiyaapi.vercel.app";
      const response = await fetch(`${apiBaseUrl}/api/orders/${order._id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentStatus: "paid",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process payment");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);

      // Redirect to success page
      router.push(`/payment/success?orderId=${order.orderId}`);
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Failed to process payment");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-4">{t('error')}</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/"
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all duration-200"
              >
                {t('backToMenu')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  // Check if payment is already completed
  if (order.paymentStatus === 'paid') {
    return (
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold mb-4">{t('alreadyPaid')}</h1>
                <p className="text-gray-600 mb-6">
                  {t('alreadyPaidDesc')}
                </p>
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

  // Check if payment method is PayPay
  if (order.paymentMethod !== 'paypay') {
    return (
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">{t('invalidMethod')}</h1>
                <p className="text-gray-600 mb-6">
                  {t('invalidMethodDesc')}
                </p>
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

  return (
    <main className="flex min-h-screen bg-background transition-colors duration-300">
      <div className="inner-wrapper flex-col mt-[100px] py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{t('summary')}</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orderId')}:</span>
                <span className="font-bold">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('table')}:</span>
                <span className="font-bold">{t('table')} {order.tableNumber}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h3 className="font-bold mb-2">{t('items')}:</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">¥{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>{t('total')}:</span>
                <span>¥{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{t('method')}</h2>
            <div className="flex items-center p-4 border-2 border-primary rounded-xl bg-primary/5">
              <div className="w-12 h-12 bg-[#FF6B35] rounded-lg flex items-center justify-center text-white font-bold mr-4">
                PP
              </div>
              <div>
                <h3 className="font-bold text-lg">PayPay</h3>
                <p className="text-sm text-gray-600">Pay securely with PayPay</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('processing')}
                </span>
              ) : (
                t('payWithPayPay', { amount: order.total.toLocaleString() })
              )}
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-200 text-center"
            >
              {t('cancel')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  const t = useTranslations('Payment');
  return (
    <Suspense fallback={
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8">
              <p>{t('loading')}</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <PaymentContent />
    </Suspense>
  );
}

















