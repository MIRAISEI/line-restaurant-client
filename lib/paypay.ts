// lib/paypay.ts
import crypto from "crypto";

const SANDBOX_BASE_URL = "https://stg-api.sandbox.paypay.ne.jp";
const JSON_CONTENT_TYPE = "application/json;charset=UTF-8";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface HmacOptions {
  apiKey: string;
  apiSecret: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}

export function buildHmacAuthHeader({
  apiKey,
  apiSecret,
  method,
  path,
  body,
}: HmacOptions) {
  const httpMethod = method.toUpperCase() as HttpMethod;
  const epoch = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const hasBody =
    body &&
    (httpMethod === "POST" || httpMethod === "PUT" || httpMethod === "PATCH");

  let contentType: string;
  let hash: string;
  let bodyString = "";

  if (hasBody) {
    bodyString = JSON.stringify(body);
    contentType = JSON_CONTENT_TYPE;

    const md5 = crypto.createHash("md5");
    md5.update(contentType, "utf8");
    md5.update(bodyString, "utf8");
    hash = md5.digest("base64");
  } else {
    contentType = "empty";
    hash = "empty";
  }

  const dataToSign = [path, httpMethod, nonce, epoch, contentType, hash].join(
    "\n"
  );

  const macData = crypto
    .createHmac("sha256", apiSecret)
    .update(dataToSign, "utf8")
    .digest("base64");

  const authHeader = `hmac OPA-Auth:${apiKey}:${macData}:${nonce}:${epoch}:${hash}`;

  return {
    authHeader,
    contentTypeHeader: hasBody ? JSON_CONTENT_TYPE : undefined,
  };
}

export function getPayPayBaseUrl() {
  const env = process.env.PAYPAY_ENV;
  if (env === "prod" || env === "production") {
    return "https://api.paypay.ne.jp";
  }
  return SANDBOX_BASE_URL;
}

export function getBaseUrl() {
  // For redirectUrl etc.
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}
