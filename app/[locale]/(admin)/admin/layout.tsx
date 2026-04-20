"use client";

import AdminNavigation from "./navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <AdminNavigation />

      <main className="flex-1 w-full min-h-screen">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

