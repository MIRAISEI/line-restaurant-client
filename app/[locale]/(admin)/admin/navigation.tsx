"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/admin-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Check,
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Tags,
  Users,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Armchair
} from "lucide-react";

export default function AdminNavigation() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const switchLanguage = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const orders = await getOrders();
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const recentCount = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= oneDayAgo;
        }).length;

        setUnreadCount(recentCount);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    }

    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const navItems = [
    { href: "/admin", label: t('dashboard'), icon: LayoutDashboard },
    { href: "/admin/orders", label: t('orders'), icon: ShoppingCart },
    { href: "/admin/tables", label: t('tables'), icon: Armchair },
    { href: "/admin/reports", label: t('reports') || "Reports", icon: BarChart3 },
    { href: "/admin/menu", label: t('menu'), icon: Utensils },
    { href: "/admin/categories", label: t('categories'), icon: Tags },
    ...(user?.role === "admin" || user?.role === "manager"
      ? [{ href: "/admin/users", label: t('users'), icon: Users }]
      : []),
    { href: "/admin/profile", label: t('profile'), icon: User },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-slate-50/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#06C755] to-[#00C300] bg-clip-text text-transparent">
          Miraisei Admin
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/notifications"
            className="p-2 text-gray-500 hover:text-[#06C755] relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-500"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-50/95 backdrop-blur-3xl pt-20 px-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all ${pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))
                  ? "bg-[#06C755] text-white shadow-lg shadow-[#06C755]/20"
                  : "text-gray-600 hover:bg-white/80"
                  }`}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-6 h-6" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 left-0 bg-slate-50 border-r border-gray-200/50 z-50 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#06C755] via-[#00C300] to-[#06C755] bg-clip-text text-transparent drop-shadow-sm">
            Miraisei Admin
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 px-1">
            Restaurant Management
          </p>
        </div>

        {/* Top Actions Section */}
        <div className="px-6 py-4 space-y-4 border-b border-gray-100/50 mb-2">
          {/* User Info */}
          {user && (
            <Link
              href="/admin/profile"
              className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-sm hover:border-gray-200 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#06C755] to-[#00C300] flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white flex-shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-gray-900 truncate">{user.displayName}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">{user.role}</span>
              </div>
            </Link>
          )}

          <div className="flex items-center justify-between gap-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex-1 h-12 rounded-2xl gap-2 font-bold text-gray-600 bg-white hover:bg-gray-50 border border-gray-100 hover:shadow-sm transition-all">
                  <Globe className="w-4 h-4 text-[#06C755]" />
                  <span>{locale === 'en' ? 'EN' : locale === 'ja' ? 'JP' : 'ZH'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 rounded-2xl shadow-xl border-gray-100">
                <DropdownMenuItem onClick={() => switchLanguage('en')} className="font-medium p-3 rounded-xl gap-2 cursor-pointer">
                  <span>English</span>
                  {locale === 'en' && <Check className="w-4 h-4 text-[#06C755]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLanguage('ja')} className="font-medium p-3 rounded-xl gap-2 cursor-pointer">
                  <span>日本語</span>
                  {locale === 'ja' && <Check className="w-4 h-4 text-[#06C755]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLanguage('zh')} className="font-medium p-3 rounded-xl gap-2 cursor-pointer">
                  <span>中文</span>
                  {locale === 'zh' && <Check className="w-4 h-4 text-[#06C755]" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Link
              href="/admin/notifications"
              className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-gray-500 hover:text-[#06C755] hover:bg-[#06C755]/5 transition-all relative border border-gray-100 hover:shadow-sm"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 hover:shadow-sm"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                  ? "bg-[#06C755] text-white shadow-xl shadow-[#06C755]/15"
                  : "text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom space */}
        <div className="p-4 mt-auto">
          {/* Empty bottom space to allow navigation to stay at the top */}
        </div>
      </aside>
    </>
  );
}
