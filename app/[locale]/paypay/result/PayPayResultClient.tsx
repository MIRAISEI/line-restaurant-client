"use client";

import { useEffect, useState } from "react";
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

export default function PayPayResultClient() {
  const searchParams = useSearchParams();
  const merchantPaymentId = searchParams.get("merchantPaymentId");

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const currency = statusData?.body?.currency;

  // Friendly message based on payment state
  const statusMessage = isPaid
    ? "✅ Payment completed"
    : paymentState === "CREATED"
    ? "⚠ Payment not completed / abandoned"
    : paymentState === "CANCELED"
    ? "❌ Payment canceled"
    : "❔ Unknown payment status";

  /*const paymentState =
    statusData?.body?.data?.status || statusData?.body?.data?.state; */

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full space-y-4 border rounded-xl p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold">Payment Details</h1>

        {/*<p className="text-sm text-gray-600">
          Merchant Payment ID:{" "}
          <span className="font-mono">{merchantPaymentId ?? "(none in URL)"}</span>
        </p>*/}

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

            {amount && currency && (
              <p className="text-sm">
                Amount: <span className="font-mono">{amount}{currency}</span>
              </p>
            )}

          </div>
        )}

        <Link
          href="/"
          className="inline-block mt-4 text-sm p-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200"
        >
          Back to Menu
        </Link>
      </div>
    </main>
  );
}
