"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const paymentMethod = searchParams.get("payment");
  const paymentStatus = searchParams.get("status");

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

            <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
            
            {orderId && (
              <p className="text-lg text-gray-600 mb-2">
                Order ID: <span className="font-bold text-primary">{orderId}</span>
              </p>
            )}

            {paymentMethod === "manual" ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  <strong>Manual Payment:</strong> Please pay at the counter when your order is ready.
                </p>
              </div>
            ) : paymentMethod === "paypay" && paymentStatus === "pending" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 mb-2">
                  <strong>Order Placed Successfully!</strong> Your order has been confirmed.
                </p>
                <p className="text-blue-700 text-sm mb-3">
                  You can pay with PayPay after enjoying your meal. We&apos;ll notify you when your order is ready.
                </p>
                {orderId && (
                  <Link
                    href={`/payment/${orderId}`}
                    className="inline-block mt-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg font-bold hover:bg-[#FF6B35]/90 transition-all duration-200 text-sm"
                  >
                    Pay Now with PayPay
                  </Link>
                )}
              </div>
            ) : paymentMethod === "paypay" && paymentStatus === "paid" ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">
                  <strong>Payment Successful!</strong> Your order has been confirmed and payment processed with PayPay.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">
                  <strong>Payment Successful:</strong> Your order has been confirmed and payment processed.
                </p>
              </div>
            )}

            <p className="text-gray-600 mb-8">
              We&apos;ll notify you when your order is ready. Thank you for your order!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all duration-200"
              >
                Back to Menu
              </Link>
              {orderId && (
                <button
                  onClick={() => router.push(`/orders/${orderId}`)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-200"
                >
                  View Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen bg-background transition-colors duration-300">
        <div className="inner-wrapper flex-col mt-[100px] py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 md:p-12">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}


