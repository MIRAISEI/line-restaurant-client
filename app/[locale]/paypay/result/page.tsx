import { Suspense } from "react";
import PayPayResultClient from "./PayPayResultClient";

export default function PayPayResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="border rounded-xl p-6 shadow-sm">
            <p>Loading PayPay result...</p>
          </div>
        </main>
      }
    >
      <PayPayResultClient />
    </Suspense>
  );
}
