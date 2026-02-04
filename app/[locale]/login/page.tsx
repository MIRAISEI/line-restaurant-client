"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLineLoginUrl } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import { useLiff } from "@/lib/liff-provider";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

function LoginContent() {
  const t = useTranslations('Login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isInLiff, isLiffLoading, liffError } = useLiff();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect");
      const table = searchParams.get("table") || searchParams.get("tableNumber");

      if (redirect) {
        const redirectUrl = table ? `${redirect}${redirect.includes('?') ? '&' : '?'}table=${table}` : redirect;
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, router, searchParams]);

  // Show LIFF error if present
  useEffect(() => {
    if (liffError) {
      setError(liffError);
    }
  }, [liffError]);

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { loginUrl, state } = await getLineLoginUrl();
      const redirect = searchParams.get("redirect");
      const table = searchParams.get("table") || searchParams.get("tableNumber");

      // Store state in sessionStorage for verification
      if (typeof window !== "undefined") {
        sessionStorage.setItem("line_login_state", state);
        if (redirect) sessionStorage.setItem("login_redirect", redirect);
        if (table) sessionStorage.setItem("login_table", table);
      }

      // Redirect to LINE login
      window.location.href = loginUrl;
    } catch (err) {
      console.error("LINE login error:", err);
      setError(err instanceof Error ? err.message : t('failed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {isInLiff ? t('authenticating') : t('signInToContinue')}
          </p>
        </div>

        {isLiffLoading && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
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
              {t('initializing')}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isInLiff && !isLiffLoading && (
            <button
              onClick={handleLineLogin}
              disabled={isLoading}
              className="w-full rounded-md bg-[#06C755] px-4 py-3 text-white font-medium hover:bg-[#05B048] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                  {t('loading')}
                </>
              ) : (
                <>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.27l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.058 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
                      fill="currentColor"
                    />
                  </svg>
                  {t('signInWithLine')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations('Login');
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}



