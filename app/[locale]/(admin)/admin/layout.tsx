"use client";

import { usePathname } from "@/i18n/routing";
import AdminNavigation from "./navigation";
import AuthGuard from "./auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // Don't apply AuthGuard and navigation to login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50 touch-manipulation">
        <AdminNavigation />

        <main className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

