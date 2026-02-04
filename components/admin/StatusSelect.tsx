import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateOrderStatus, type Order } from "@/lib/admin-api";

type OrderStatus = Order["status"];

interface StatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

export default function StatusSelect({
  orderId,
  currentStatus,
  onStatusChange,
}: StatusSelectProps) {
  const t = useTranslations('Admin.stats');
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setIsUpdating(true);

    try {
      await updateOrderStatus(orderId, newStatus);
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on error
      e.target.value = status;
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    Received: {
      bg: "bg-[#E3F2FD]",
      text: "text-[#1976D2]",
      border: "border-[#1976D2]",
    },
    Preparing: {
      bg: "bg-[#FFF3E0]",
      text: "text-[#F57C00]",
      border: "border-[#F57C00]",
    },
    Ready: {
      bg: "bg-[#E8F5E9]",
      text: "text-[#31a354]",
      border: "border-[#31a354]",
    },
    Completed: {
      bg: "bg-[#E8F5E9]",
      text: "text-[#31a354]",
      border: "border-[#31a354]",
    },
  };

  const statusStyle = statusColors[status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isUpdating}
      className={`text-sm font-bold rounded-xl border-2 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} py-2 px-4 pr-8 focus:ring-2 focus:ring-[#31a354]/20 focus:outline-none transition-all duration-200 min-h-[44px] touch-manipulation shadow-sm hover:shadow-md ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
        }`}
    >
      <option value="Received">{t('pending')}</option>
      <option value="Preparing">{t('preparing')}</option>
      <option value="Ready">{t('ready')}</option>
      <option value="Completed">{t('completed')}</option>
    </select>
  );
}


