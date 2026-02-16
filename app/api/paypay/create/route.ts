import { NextResponse } from "next/server";
import {
  buildHmacAuthHeader,
  getPayPayBaseUrl,
  getBaseUrl,
} from "@/lib/paypay";

export async function POST(req: Request) {

  try {
    const apiKey = process.env.PAYPAY_API_KEY;
    const apiSecret = process.env.PAYPAY_API_SECRET;
    const merchantId = process.env.PAYPAY_MERCHANT_ID;

    if (!apiKey || !apiSecret || !merchantId) {
      return NextResponse.json(
        { error: "Missing PAYPAY_* env variables" },
        { status: 500 }
      );
    }

    const bodyJson = await req.json().catch(() => ({}));
    const amount = Number(bodyJson.amount || 10);
    const description = bodyJson.description || "Next.js PayPay sandbox test";
    const orderId = bodyJson.orderid;
    console.log("Creating PayPay code with payload:", {
      amount,
      description,
      orderId,
    });
    const merchantPaymentId = `mp_${Date.now()}`;
    const path = "/v2/codes";
    const baseUrl = getBaseUrl();
    
    const payload = {
      merchantPaymentId,
      amount: { amount, currency: "JPY" },
      codeType: "ORDER_QR", // Web Cashier
      orderDescription: description,
      isAuthorization: false,
      redirectUrl: `${baseUrl}/paypay/result?merchantPaymentId=${encodeURIComponent(
        merchantPaymentId
      )}&orderId=${encodeURIComponent(orderId)}`,
      redirectType: "WEB_LINK",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      requestedAt: Math.floor(Date.now() / 1000),
    };

    const { authHeader, contentTypeHeader } = buildHmacAuthHeader({
      apiKey,
      apiSecret,
      method: "POST",
      path,
      body: payload,
    });

    const headers: HeadersInit = {
      Authorization: authHeader,
      "X-ASSUME-MERCHANT": merchantId,
    };
    if (contentTypeHeader) {
      headers["Content-Type"] = contentTypeHeader;
    }

    const paypayRes = await fetch(`${getPayPayBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await paypayRes.json().catch(() => null);

    if (!paypayRes.ok) {
      return NextResponse.json(
        {
          error: "PayPay create code failed",
          status: paypayRes.status,
          body: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        merchantPaymentId,
        payPayStatus: paypayRes.status,
        body: data,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error in /api/paypay/create", err);
    return NextResponse.json(
      { error: "Internal error", details: err },
      { status: 500 }
    );
  }
}
