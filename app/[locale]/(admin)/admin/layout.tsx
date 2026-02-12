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
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <AdminNavigation />

        <main className="flex-1 w-full min-h-screen">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

