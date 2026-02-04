"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken, verifyToken } from "@/lib/admin-api";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      try {
        // Store token
        setAuthToken(token);

        // Verify token to ensure it's valid
        verifyToken(token)
          .then((result) => {
            if (result.valid) {
              // Check for redirect and table in sessionStorage (set by login page)
              const redirect = sessionStorage.getItem("login_redirect");
              const table = sessionStorage.getItem("login_table");

              // Clear session storage
              sessionStorage.removeItem("login_redirect");
              sessionStorage.removeItem("login_table");

              // Build redirect URL
              if (redirect) {
                const redirectUrl = table ? `${redirect}${redirect.includes('?') ? '&' : '?'}table=${table}` : redirect;
                router.push(redirectUrl);
              } else {
                router.push("/");
              }
            } else {
              router.push("/login?error=invalid_token");
            }
          })
          .catch((error) => {
            console.error("Token verification error:", error);
            router.push("/login?error=verification_failed");
          });
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/login?error=invalid_response");
      }
    } else {
      router.push("/login?error=missing_token");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="animate-spin h-8 w-8 mx-auto text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <p className="text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

