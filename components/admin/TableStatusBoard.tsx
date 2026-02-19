"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  clearTableStatuses,
  getOrders,
  getTableStatuses,
  updateTableStatus as updateTableStatusApi,
  type Order,
  type TableStatus,
} from "@/lib/admin-api";
import { Armchair, BrushCleaning, CircleDot, Clock3, Sparkles } from "lucide-react";

type StatusMeta = {
  label: string;
  ribbon: string;
  card: string;
  dot: string;
};

const DEFAULT_TABLE_COUNT = 16;
const DEFAULT_RANGE_START = 1;
const DEFAULT_RANGE_END = 16;

export default function TableStatusBoard() {
  const t = useTranslations("Admin");
  const [orders, setOrders] = useState<Order[]>([]);
  const [rangeStart, setRangeStart] = useState(DEFAULT_RANGE_START);
  const [rangeEnd, setRangeEnd] = useState(DEFAULT_RANGE_END);
  const [tableStatuses, setTableStatuses] = useState<Record<string, TableStatus>>({});
  const [updatingTable, setUpdatingTable] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [settingRangeAvailable, setSettingRangeAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTableData() {
      try {
        const [ordersData, statusesData] = await Promise.all([
          getOrders(),
          getTableStatuses(),
        ]);
        setOrders(ordersData);

        const nextStatuses = statusesData.reduce<Record<string, TableStatus>>((acc, row) => {
          acc[row.tableNumber] = row.status;
          return acc;
        }, {});
        setTableStatuses(nextStatuses);
      } catch (error) {
        console.error("Failed to fetch table board data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTableData();
    const interval = setInterval(fetchTableData, 20000);
    return () => clearInterval(interval);
  }, []);

  const derivedStatuses = useMemo(() => {
    const latestByTable = new Map<string, Order>();

    for (const order of orders) {
      const key = order.tableNumber?.trim();
      if (!key) continue;

      const existing = latestByTable.get(key);
      const currentTs = new Date(order.createdAt).getTime();
      const existingTs = existing ? new Date(existing.createdAt).getTime() : 0;
      if (!existing || currentTs > existingTs) {
        latestByTable.set(key, order);
      }
    }

    const next: Record<string, TableStatus> = {};
    for (const [table, order] of latestByTable.entries()) {
      if (order.status === "Completed") {
        next[table] = "cleaning";
      } else {
        next[table] = "occupied";
      }
    }
    return next;
  }, [orders]);

  useEffect(() => {
    const sourceTables = [
      ...orders.map((o) => o.tableNumber),
      ...Object.keys(tableStatuses),
    ];

    const numericTables = sourceTables
      .map((table) => Number.parseInt(table, 10))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (numericTables.length > 0) {
      const maxTable = Math.max(...numericTables);
      setRangeEnd((prev) => Math.max(prev, maxTable, DEFAULT_TABLE_COUNT));
    }
  }, [orders, tableStatuses]);

  const allTables = useMemo(() => {
    const start = Math.max(1, Math.min(rangeStart, rangeEnd));
    const end = Math.max(start, Math.max(rangeStart, rangeEnd));
    const fromRange = Array.from({ length: end - start + 1 }, (_, idx) => String(start + idx));
    const fromOrders = orders.map((o) => o.tableNumber?.trim()).filter(Boolean) as string[];
    const fromStatuses = Object.keys(tableStatuses);
    return Array.from(new Set([...fromRange, ...fromOrders, ...fromStatuses])).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [orders, rangeStart, rangeEnd, tableStatuses]);

  const rangeTables = useMemo(() => {
    const start = Math.max(1, Math.min(rangeStart, rangeEnd));
    const end = Math.max(start, Math.max(rangeStart, rangeEnd));
    return Array.from({ length: end - start + 1 }, (_, idx) => String(start + idx));
  }, [rangeStart, rangeEnd]);

  const statusMeta: Record<TableStatus, StatusMeta> = {
    available: {
      label: t("tableStatus.available"),
      ribbon: "bg-emerald-500 text-white",
      card: "from-emerald-50 via-green-50 to-teal-50 border-emerald-200",
      dot: "bg-emerald-500",
    },
    occupied: {
      label: t("tableStatus.occupied"),
      ribbon: "bg-rose-500 text-white",
      card: "from-rose-50 via-red-50 to-orange-50 border-rose-200",
      dot: "bg-rose-500",
    },
    reserved: {
      label: t("tableStatus.reserved"),
      ribbon: "bg-sky-600 text-white",
      card: "from-sky-50 via-blue-50 to-indigo-50 border-sky-200",
      dot: "bg-sky-600",
    },
    cleaning: {
      label: t("tableStatus.cleaning"),
      ribbon: "bg-amber-500 text-white",
      card: "from-amber-50 via-yellow-50 to-orange-50 border-amber-200",
      dot: "bg-amber-500",
    },
  };

  const currentStatusFor = (table: string): TableStatus =>
    tableStatuses[table] || derivedStatuses[table] || "available";

  const handleUpdateTableStatus = async (table: string, status: TableStatus) => {
    const previous = tableStatuses[table];
    setUpdatingTable(table);
    setTableStatuses((prev) => ({ ...prev, [table]: status }));

    try {
      await updateTableStatusApi(table, status);
    } catch (error) {
      console.error("Failed to update table status:", error);
      setTableStatuses((prev) => {
        const next = { ...prev };
        if (previous) {
          next[table] = previous;
        } else {
          delete next[table];
        }
        return next;
      });
    } finally {
      setUpdatingTable(null);
    }
  };

  const resetManualStatuses = async () => {
    try {
      setResetting(true);
      await clearTableStatuses();
      setTableStatuses({});
    } catch (error) {
      console.error("Failed to clear table statuses:", error);
    } finally {
      setResetting(false);
    }
  };

  const setRangeAsAvailable = async () => {
    if (rangeTables.length === 0) return;

    setSettingRangeAvailable(true);
    try {
      await Promise.all(
        rangeTables.map((tableNumber) => updateTableStatusApi(tableNumber, "available"))
      );
      setTableStatuses((prev) => {
        const next = { ...prev };
        for (const tableNumber of rangeTables) {
          next[tableNumber] = "available";
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to set range as available:", error);
    } finally {
      setSettingRangeAvailable(false);
    }
  };

  const statusCounts = allTables.reduce(
    (acc, table) => {
      const status = currentStatusFor(table);
      acc[status] += 1;
      return acc;
    },
    { available: 0, occupied: 0, reserved: 0, cleaning: 0 } as Record<TableStatus, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 md:text-4xl">{t("tables")}</h1>
          <p className="mt-1 text-sm text-gray-600">{t("tableStatus.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
            <span>{t("tableStatus.rangeFrom")}</span>
            <input
              type="number"
              min={1}
              value={rangeStart}
              onChange={(e) => setRangeStart(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right outline-none focus:border-[#06C755]"
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
            <span>{t("tableStatus.rangeTo")}</span>
            <input
              type="number"
              min={1}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right outline-none focus:border-[#06C755]"
            />
          </label>
          <button
            onClick={setRangeAsAvailable}
            disabled={settingRangeAvailable}
            className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("tableStatus.setRangeAvailable")}
          </button>
          <button
            onClick={resetManualStatuses}
            disabled={resetting}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            {t("tableStatus.reset")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile icon={<CircleDot className="h-4 w-4" />} label={statusMeta.available.label} value={statusCounts.available} tone="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <SummaryTile icon={<Armchair className="h-4 w-4" />} label={statusMeta.occupied.label} value={statusCounts.occupied} tone="text-rose-700 bg-rose-50 border-rose-200" />
        <SummaryTile icon={<Clock3 className="h-4 w-4" />} label={statusMeta.reserved.label} value={statusCounts.reserved} tone="text-sky-700 bg-sky-50 border-sky-200" />
        <SummaryTile icon={<BrushCleaning className="h-4 w-4" />} label={statusMeta.cleaning.label} value={statusCounts.cleaning} tone="text-amber-700 bg-amber-50 border-amber-200" />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          {t("loadingOrders")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {allTables.map((table) => {
            const status = currentStatusFor(table);
            const meta = statusMeta[status];

            return (
              <article
                key={table}
                className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${meta.card}`}
              >
                <div className={`pointer-events-none absolute -right-10 top-4 rotate-45 px-10 py-1 text-xs font-black uppercase tracking-wider shadow-md ${meta.ribbon}`}>
                  {meta.label}
                </div>

                <div className="pr-20">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{t("tableHeader")}</p>
                  <p className="mt-1 text-3xl font-black text-gray-900">#{table}</p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span>{meta.label}</span>
                  </div>
                  <select
                    value={status}
                    onChange={(e) => handleUpdateTableStatus(table, e.target.value as TableStatus)}
                    disabled={updatingTable === table}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-[#06C755] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="available">{statusMeta.available.label}</option>
                    <option value="occupied">{statusMeta.occupied.label}</option>
                    <option value="reserved">{statusMeta.reserved.label}</option>
                    <option value="cleaning">{statusMeta.cleaning.label}</option>
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <Sparkles className="h-3.5 w-3.5" />
        {t("tableStatus.note")}
      </p>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
