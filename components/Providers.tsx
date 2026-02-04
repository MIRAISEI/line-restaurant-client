"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { LiffProvider } from "@/lib/liff-provider";
import Header from "@/components/Header";
import { UIProvider } from "@/context/UIContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import React, { useEffect } from "react";

function ConditionalHeader() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) {
    return null;
  }

  return <Header />;
}

function ConditionalCartDrawer() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) {
    return null;
  }

  return <CartDrawer />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <CartProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LiffProvider>
            <AuthProvider>
              <React.Suspense fallback={null}>
                <TableNumberCapture />
              </React.Suspense>
              <ConditionalHeader />
              {children}
              <ConditionalCartDrawer />
            </AuthProvider>
          </LiffProvider>
        </ThemeProvider>
      </CartProvider>
    </UIProvider>
  );
}

function TableNumberCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tableNumber = searchParams.get("tableNumber") || searchParams.get("table");
    if (tableNumber) {
      localStorage.setItem("active_table_number", tableNumber);
    }
  }, [searchParams]);

  return null;
}

