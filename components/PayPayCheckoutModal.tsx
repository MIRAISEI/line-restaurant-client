"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface PayPayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  amount: number;
  onPaymentComplete: (timing: "now" | "after") => void;
}

export default function PayPayCheckoutModal({
  isOpen,
  onClose,
  orderId,
  amount,
  onPaymentComplete,
}: PayPayCheckoutModalProps) {
  const t = useTranslations('PayPayModal');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [paymentTiming, setPaymentTiming] = useState<"now" | "after">("after");

  // QR endpoint (string | null)
  const qrEndpoint = orderId
    ? process.env.NEXT_PUBLIC_PAYPAY_QR_ENDPOINT ||
    `${process.env.NEXT_PUBLIC_API_URL || "https://sukiyaapi.vercel.app"}/api/paypay/qr/${orderId}`
    : null;

  useEffect(() => {
    if (!isOpen || paymentTiming !== "now" || !orderId) return;

    let cancelled = false;

    async function fetchQr() {
      try {
        setQrLoading(true);
        setQrError(null);
        setImageLoadError(false);

        //  TypeScript guard — FIXES BUILD ERROR
        if (!qrEndpoint) {
          throw new Error("QR endpoint is not available");
        }

        const response = await fetch(qrEndpoint);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `QR request failed (${response.status})`);
        }

        const data = await response.json();
        const url =
          data?.qrUrl ||
          data?.paypayQrUrl ||
          data?.paypayQrCode ||
          data?.qrCodeUrl ||
          data?.url;

        if (!url) {
          throw new Error("QR URL missing in backend response.");
        }

        if (!cancelled) {
          setQrUrl(url);
          setImageLoadError(false);
        }
      } catch (error) {
        if (!cancelled) {
          setQrError(
            error instanceof Error
              ? error.message
              : t('failedQR')
          );
          setQrUrl(null);
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    }

    fetchQr();

    return () => {
      cancelled = true;
    };
  }, [isOpen, paymentTiming, orderId, qrEndpoint, retryKey, t]);

  const handleConfirm = () => {
    onPaymentComplete(paymentTiming);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">{t('chooseTiming')}</p>

            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  checked={paymentTiming === "after"}
                  onChange={() => setPaymentTiming("after")}
                  className="w-5 h-5 text-primary"
                />
                <div className="ml-3">
                  <span className="text-lg font-bold">{t('payAfter')}</span>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  checked={paymentTiming === "now"}
                  onChange={() => setPaymentTiming("now")}
                  className="w-5 h-5 text-primary"
                />
                <div className="ml-3">
                  <span className="text-lg font-bold">{t('payNow')}</span>
                </div>
              </label>
            </div>
          </div>

          {paymentTiming === "now" && (
            <div className="mb-6">
              {qrLoading && (
                <p className="text-center text-gray-600">
                  {t('loadingQR')}
                </p>
              )}

              {qrError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm mb-2">{qrError}</p>
                  <button
                    onClick={() => setRetryKey((p) => p + 1)}
                    className="text-sm text-red-600 underline"
                  >
                    {t('retry')}
                  </button>
                </div>
              )}

              {qrUrl && !imageLoadError && (
                <div className="flex flex-col items-center">
                  <Image
                    src={qrUrl}
                    alt="PayPay QR Code"
                    width={300}
                    height={300}
                    onError={() => setImageLoadError(true)}
                  />
                  <p className="text-sm text-gray-600 mt-3">
                    {t('amount')}: ¥{amount.toLocaleString()}
                  </p>
                </div>
              )}

              {imageLoadError && (
                <p className="text-red-600 text-center">
                  {t('failedImage')}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl"
            >
              {paymentTiming === "now" ? t('process') : t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
