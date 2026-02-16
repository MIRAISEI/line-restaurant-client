"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";


type PayPayStatusBody = {
  paymentState: "CREATED" | "COMPLETED" | "CANCELED" | string;
  isPaid: boolean;
  amount?: number;
  currency?: string;
  merchantPaymentId: string;
  raw?: unknown; // optional, store full raw PayPay response if needed
};

type StatusResult = {
  payPayStatus: number;
  body: PayPayStatusBody;
};

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


export default function PayPayResultClient() {
  const searchParams = useSearchParams();
  const merchantPaymentId = searchParams.get("merchantPaymentId");
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
//new
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      if (!merchantPaymentId) {
        setError("merchantPaymentId missing in query");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/paypay/status?merchantPaymentId=${encodeURIComponent(
            merchantPaymentId
          )}`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(
            data?.error || "Failed to fetch payment status. See console."
          );
        } else {
          setStatusData(data);
        }
      } catch (err: unknown) {
        console.error(err);
        setError((err as Error)?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [merchantPaymentId]);


  const paymentState = statusData?.body?.paymentState;
  const isPaid = statusData?.body?.isPaid;
  const amount = statusData?.body?.amount;
  const currency = statusData?.body?.currency ?? "JPY";
  console.log("Payment status data:", statusData);

  // Friendly message based on payment state
  const statusMessage = isPaid
    ? "✅ Successfully paid"
    : paymentState === "CREATED"
    ? "⚠ Payment not completed / abandoned"
    : paymentState === "CANCELED"
    ? "❌ Payment canceled"
    : "❔ Unknown payment status";


  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Order not found");
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'loading');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, orderId]);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId, fetchOrder]);



  const handlePayment = async () => {
    if (!order || !order._id) return;

    setError(null);

    try {
 
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

    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Failed to process payment");
    }
  };

useEffect(() => {
  if (!isPaid) return;
  if (!orderId) return;
  if (!order) return;
  if (order.paymentStatus === 'paid') return; // prevent double update

  handlePayment();
}, [isPaid, orderId, order]);


  
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-primary/50">
      <div className="max-w-md w-full space-y-4 border-white/20 rounded-2xl shadow-2xl bg-white/30 backdrop-blur-md">
        <div className="flex items-center justify-between text-white bg-primary px-6 py-3  text-center">
          <h1 className="  text-xl font-semibold justify-center">Payment Details</h1>
          <h3 className="text-[12px]">Order ID: {orderId}</h3>
        </div>
        <div className="py-3 px-6  text-gray-600">
          {loading && <p className="text-sm text-gray-500">Checking payment status...</p>}

          {!loading && error && (
            <p className="text-sm text-red-600">Error: {error}</p>
          )}

          {!loading && !error && statusData && (
            <div className="space-y-2">
              <h3 className="text-[20px] font-semibold">{statusMessage}</h3>
              
              {/*<p className="text-sm">
                PayPay HTTP status: <span className="font-mono">{paymentState}</span>
              </p>*/}
              <ul className="border rounded-md p-4 space-y-2 bg-gray-50">
              {order?.items.map((item)=>(
                <li key={item.itemId} className="flex justify-between">
                  <div><p>{item.name} x {item.quantity}</p></div>
                  <div><p>{item.price} {currency}</p></div>
                </li>
              ))}
              </ul>

            </div>
          )}
          <div className="flex flex-col  w-full mt-4 items-center justify-center">
            
              {order?.total && currency && (
                <p className="text-2xl font-bold">
                  Total: <span className="font-mono">{order?.total}{currency}</span>
                </p>
              )}
            <Link
              href="/"
              className="inline-block mt-4 text-sm p-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
