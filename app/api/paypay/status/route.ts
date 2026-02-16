// app/api/paypay/status/route.ts
import { NextResponse } from "next/server";
import { buildHmacAuthHeader, getPayPayBaseUrl } from "@/lib/paypay";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantPaymentId = searchParams.get("merchantPaymentId");
    const orderId = searchParams.get("orderId");

    if (!merchantPaymentId) {
      return NextResponse.json(
        { error: "merchantPaymentId is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PAYPAY_API_KEY;
    const apiSecret = process.env.PAYPAY_API_SECRET;
    const merchantId = process.env.PAYPAY_MERCHANT_ID;

    if (!apiKey || !apiSecret || !merchantId) {
      return NextResponse.json(
        { error: "Missing PAYPAY_* env variables" },
        { status: 500 }
      );
    }

    const path = `/v2/codes/payments/${encodeURIComponent(merchantPaymentId)}`;

    const { authHeader } = buildHmacAuthHeader({
      apiKey,
      apiSecret,
      method: "GET",
      path,
      body: undefined,
    });

    const headers: HeadersInit = {
      Authorization: authHeader,
      "X-ASSUME-MERCHANT": merchantId,
    };

    const paypayRes = await fetch(`${getPayPayBaseUrl()}${path}`, {
      method: "GET",
      headers,
    });

    const data = await paypayRes.json().catch(() => null);

    if (!paypayRes.ok) {
      return NextResponse.json(
        {
          error: "PayPay get payment details failed",
          status: paypayRes.status,
          body: data,
        },
        { status: 500 }
      );
    }

    const rawData = data?.data || {};
    const paymentState = rawData.status || "UNKNOWN";
    console.log("adada", data);
    return NextResponse.json({
      payPayStatus: paypayRes.status,
      body: {
        paymentState,
        isPaid: paymentState === "COMPLETED",
        amount: rawData.amount?.amount ?? null,
        currency: rawData.amount?.currency ?? null,
        merchantPaymentId: rawData.merchantPaymentId ?? merchantPaymentId,
        raw: data, // keep the raw response for debugging
        orderid: orderId
      },
    }, { status: 200 });

  } catch (err: unknown ) {
    console.error("Error in /api/paypay/status", err);
    return NextResponse.json(
      { error: "Internal error", details: err},
      { status: 500 }
    );
  }
}
