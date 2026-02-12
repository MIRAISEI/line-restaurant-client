"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { getOrders, type Order } from "@/lib/admin-api";
import {
    BarChart3,
    Download,
    Calendar as CalendarIcon,
    TrendingUp,
    ShoppingBag,
    Users as UsersIcon,
    Search,
    ArrowRight
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import OrderRow from "@/components/admin/OrderRow";

export default function ReportsPage() {
    const t = useTranslations('Admin');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setDate(1))); // First day of current month
    const [endDate, setEndDate] = useState<Date | null>(new Date());

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const startStr = startDate?.toISOString();
            const endStr = endDate?.toISOString();
            const data = await getOrders(startStr, endStr);
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [startDate, endDate]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const orderCount = orders.length;
        const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
        const uniqueCustomers = new Set(orders.map(o => o.userId)).size;

        return {
            totalRevenue,
            orderCount,
            avgOrderValue,
            uniqueCustomers
        };
    }, [orders]);

    const exportToCSV = () => {
        if (orders.length === 0) return;

        // Define CSV headers
        const headers = ["Order ID", "Date", "Customer", "Table", "Items", "Total (JPY)", "Status", "Payment Status"];

        // Prepare data rows
        const rows = orders.map(order => [
            order.orderId,
            new Date(order.createdAt).toLocaleString(),
            order.displayName,
            order.tableNumber,
            order.items.map(i => `${i.name} (x${i.quantity})`).join("; "),
            order.total,
            order.status,
            order.paymentStatus || 'manual'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        // Create and trigger download
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `miraisei-report-${startDate?.toISOString().split('T')[0]}-to-${endDate?.toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-[#06C755]/10 rounded-xl">
                            <BarChart3 className="w-8 h-8 text-[#06C755]" />
                        </div>
                        {t('reports') || "Management Reports"}
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Analyze your business performance and export data
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            placeholderText="Start Date"
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 w-24 cursor-pointer"
                        />
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate || undefined}
                            placeholderText="End Date"
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 w-24 cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={exportToCSV}
                        disabled={orders.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        {t('exportCsv') || "Export CSV"}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('totalRevenue') || "Total Revenue", value: `¥${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-[#06C755]", bg: "bg-[#06C755]/10" },
                    { label: t('totalOrders') || "Total Orders", value: stats.orderCount, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: t('avgOrderValue') || "Avg. Order", value: `¥${Math.round(stats.avgOrderValue).toLocaleString()}`, icon: BarChart3, color: "text-purple-500", bg: "bg-purple-50" },
                    { label: t('uniqueCustomers') || "Customers", value: stats.uniqueCustomers, icon: UsersIcon, color: "text-orange-500", bg: "bg-orange-50" },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex items-center justify-between">
                    <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        {t('detailedReport') || "Detailed Report"}
                    </h2>
                    <span className="text-xs font-bold text-[#06C755] bg-[#06C755]/10 px-3 py-1 rounded-full px-2">
                        {orders.length} {t('orders') || "Orders"}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="inline-block relative mb-4">
                                <div className="w-12 h-12 border-4 border-[#06C755]/20 rounded-full"></div>
                                <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <p className="text-gray-500 font-medium">Analyzing data...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center text-3xl">
                                📊
                            </div>
                            <p className="font-bold text-gray-900">No data for selected period</p>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your date range</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderId')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('time')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('tableHeader')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderItems')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('total')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('paymentStatus')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <OrderRow
                                        key={order._id}
                                        order={order}
                                        onStatusChange={() => { }} // Disabled in report view
                                        onPaymentStatusChange={() => { }} // Disabled in report view
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
