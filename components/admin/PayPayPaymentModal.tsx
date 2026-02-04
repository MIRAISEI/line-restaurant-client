import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { type Order, updateOrderPaymentStatus } from "@/lib/admin-api";

interface PayPayPaymentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (orderId: string, paymentStatus: Order["paymentStatus"]) => void;
}

export default function PayPayPaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentComplete,
}: PayPayPaymentModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const qrEndpoint = process.env.NEXT_PUBLIC_PAYPAY_QR_ENDPOINT;

  const requestUrl = useMemo(() => {
    if (!qrEndpoint) return null;
    // Allow pattern substitution like https://api.example.com/paypay/qr/{orderId}
    if (qrEndpoint.includes("{orderId}")) {
      return qrEndpoint.replace("{orderId}", order.orderId);
    }
    // Otherwise append as query param
    const joiner = qrEndpoint.includes("?") ? "&" : "?";
    return `${qrEndpoint}${joiner}orderId=${order.orderId}`;
  }, [qrEndpoint, order.orderId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!requestUrl) {
      setQrError("PayPay QR endpoint is not configured. Set NEXT_PUBLIC_PAYPAY_QR_ENDPOINT.");
      return;
    }

    let cancelled = false;
    async function fetchQr() {
      if (!requestUrl) {
        setQrError("PayPay QR endpoint is not configured. Set NEXT_PUBLIC_PAYPAY_QR_ENDPOINT.");
        setQrLoading(false);
        return;
      }

      try {
        setQrLoading(true);
        setQrError(null);
        setImageLoadError(false);
        const res = await fetch(requestUrl);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `QR request failed (${res.status})`);
        }
        const data = await res.json();
        // Prioritize qrUrl (the actual QR code image URL) over paymentUrl (the payment page URL)
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
          setQrError(error instanceof Error ? error.message : "Failed to load PayPay QR.");
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
  }, [isOpen, requestUrl, retryKey]);
  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleConfirm = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const updated = await updateOrderPaymentStatus(order._id, "paid");
      onPaymentComplete(order._id, updated.paymentStatus ?? "paid");
      onClose();
    } catch (error) {
      console.error("Failed to mark PayPay payment as complete:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Complete PayPay Payment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Confirm that PayPay payment was completed at the counter.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Order ID
                </p>
                <p className="text-lg font-bold text-gray-900">{order.orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Amount
                </p>
                <p className="text-lg font-extrabold text-gray-900">¥{order.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-800 mb-2">Items</p>
              <ul className="space-y-1">
                {order.items.map((item) => (
                  <li key={item.itemId} className="flex justify-between text-sm text-gray-700">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">¥{item.price.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center">
            <h3 className="font-bold text-gray-900 mb-3">PayPay QR</h3>
            {qrLoading ? (
              <div className="py-6 text-sm text-gray-600 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                Loading PayPay QR...
              </div>
            ) : qrError ? (
              <p className="text-sm text-red-600">
                {qrError}
              </p>
            ) : qrUrl ? (
              <div className="space-y-3">
                {imageLoadError ? (
                  <div className="py-6 text-sm text-red-600">
                    <p className="font-semibold mb-2">Failed to load QR code image</p>
                    <p className="text-xs text-gray-500">The QR code URL may be invalid or blocked.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setImageLoadError(false);
                        setQrUrl(null);
                        setQrError(null);
                        setRetryKey((prev) => prev + 1);
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="inline-block bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="PayPay QR Code"
                      className="w-48 h-48 object-contain"
                      onError={() => {
                        setImageLoadError(true);
                        console.error("Failed to load QR code image from:", qrUrl);
                      }}
                      onLoad={() => {
                        setImageLoadError(false);
                      }}
                    />
                  </div>
                )}
                {!imageLoadError && (
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#ff6b35] hover:bg-[#e55f2f] transition-colors"
                  >
                    Open in PayPay
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                QR code is not available from the backend. Please refresh after the backend provides a PayPay QR URL.
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600">
            By confirming, this order will be marked as <strong className="text-green-700">Paid</strong> via PayPay.
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#ff6b35] hover:bg-[#e55f2f] disabled:opacity-60 transition-colors"
          >
            {isSaving ? "Saving..." : "Mark as Paid"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
