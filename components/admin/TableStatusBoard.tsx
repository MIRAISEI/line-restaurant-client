"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  clearTableStatuses,
  getOrders,
  getTableRange,
  getTableStatuses,
  updateTableStatus as updateTableStatusApi,
  updateTableRange,
  type Order,
  type TableStatus,
} from "@/lib/admin-api";
import { Armchair, BrushCleaning, CircleDot, Clock3 } from "lucide-react";

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
  const saveRangeLabel = t.has("tableStatus.saveRange") ? t("tableStatus.saveRange") : "Save range";
  const [orders, setOrders] = useState<Order[]>([]);
  const [rangeStart, setRangeStart] = useState(DEFAULT_RANGE_START);
  const [rangeEnd, setRangeEnd] = useState(DEFAULT_RANGE_END);
  const [tableStatuses, setTableStatuses] = useState<Record<string, TableStatus>>({});
  const [updatingTable, setUpdatingTable] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [settingRangeAvailable, setSettingRangeAvailable] = useState(false);
  const [savingRange, setSavingRange] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [historyStartAt, setHistoryStartAt] = useState("");
  const [historyEndAt, setHistoryEndAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTableData() {
      try {
        const [ordersResult, statusesResult, rangeResult] = await Promise.allSettled([
          getOrders(),
          getTableStatuses(),
          getTableRange(),
        ]);
        const ordersData = ordersResult.status === "fulfilled" ? ordersResult.value : [];
        const statusesData = statusesResult.status === "fulfilled" ? statusesResult.value : [];
        const rangeData = rangeResult.status === "fulfilled" ? rangeResult.value : null;

        setOrders(ordersData);

        if (ordersResult.status === "rejected") {
          console.error("Failed to fetch orders:", ordersResult.reason);
        }
        if (statusesResult.status === "rejected") {
          console.error("Failed to fetch table statuses:", statusesResult.reason);
        }
        if (rangeResult.status === "rejected") {
          console.error("Failed to fetch table range:", rangeResult.reason);
        }

        const nextStatuses = statusesData.reduce<Record<string, TableStatus>>((acc, row) => {
          acc[row.tableNumber] = row.status;
          return acc;
        }, {});
        const mergedStatuses = { ...nextStatuses };

        const ensureRangeAvailable = async (start: number, end: number) => {
          const missingTables = Array.from({ length: end - start + 1 }, (_, idx) =>
            String(start + idx)
          ).filter((tableNumber) => !mergedStatuses[tableNumber]);

          if (missingTables.length === 0) return;

          await Promise.all(
            missingTables.map((tableNumber) =>
              updateTableStatusApi(tableNumber, "available")
            )
          );
          for (const tableNumber of missingTables) {
            mergedStatuses[tableNumber] = "available";
          }
        };

        if (rangeData) {
          setRangeStart(rangeData.rangeStart);
          setRangeEnd(rangeData.rangeEnd);
          await ensureRangeAvailable(rangeData.rangeStart, rangeData.rangeEnd);
        } else {
          // Implicit default: persist 1-16 range on first setup.
          const implicitStart = DEFAULT_RANGE_START;
          const implicitEnd = DEFAULT_RANGE_END;
          setRangeStart(implicitStart);
          setRangeEnd(implicitEnd);

          await updateTableRange(implicitStart, implicitEnd);
          await ensureRangeAvailable(implicitStart, implicitEnd);
        }
        setTableStatuses(mergedStatuses);
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

  const saveRangeSettings = async () => {
    try {
      setSavingRange(true);
      const updated = await updateTableRange(rangeStart, rangeEnd);
      setRangeStart(updated.rangeStart);
      setRangeEnd(updated.rangeEnd);

      const tablesToSetAvailable = Array.from(
        { length: updated.rangeEnd - updated.rangeStart + 1 },
        (_, idx) => String(updated.rangeStart + idx)
      );

      await Promise.all(
        tablesToSetAvailable.map((tableNumber) =>
          updateTableStatusApi(tableNumber, "available")
        )
      );

      setTableStatuses((prev) => {
        const next = { ...prev };
        for (const tableNumber of tablesToSetAvailable) {
          next[tableNumber] = "available";
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to save table range:", error);
    } finally {
      setSavingRange(false);
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

  const tableHistoryOrders = useMemo(() => {
    if (!selectedTable) return [];

    const startTs = historyStartAt ? new Date(historyStartAt).getTime() : Number.NEGATIVE_INFINITY;
    const endTs = historyEndAt ? new Date(historyEndAt).getTime() : Number.POSITIVE_INFINITY;

    return orders
      .filter((order) => {
        if (order.tableNumber?.trim() !== selectedTable) return false;
        const createdAt = new Date(order.createdAt).getTime();
        return createdAt >= startTs && createdAt <= endTs;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, selectedTable, historyStartAt, historyEndAt]);

  const tableHistoryUsers = useMemo(() => {
    const users = new Map<string, { label: string; count: number }>();
    for (const order of tableHistoryOrders) {
      const key = order.userId || order.displayName;
      const label = order.displayName ? `${order.displayName} (${order.userId})` : order.userId;
      const existing = users.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        users.set(key, { label, count: 1 });
      }
    }
    return Array.from(users.values());
  }, [tableHistoryOrders]);

  const closeHistoryModal = () => {
    setSelectedTable(null);
    setHistoryStartAt("");
    setHistoryEndAt("");
  };

  const formatDateTime = (dateValue: string) => {
    const date = new Date(dateValue);
    return date.toLocaleString();
  };

  const orderStatusTone: Record<Order["status"], string> = {
    Received: "bg-blue-50 text-blue-700 border-blue-200",
    Preparing: "bg-orange-50 text-orange-700 border-orange-200",
    Ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Completed: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };

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
            onClick={saveRangeSettings}
            disabled={savingRange}
            className="rounded-2xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveRangeLabel}
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
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTable(table)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTable(table);
                  }
                }}
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
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateTableStatus(table, e.target.value as TableStatus)}
                    disabled={updatingTable === table}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-[#06C755] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="available">{statusMeta.available.label}</option>
                    <option value="occupied">{statusMeta.occupied.label}</option>
                    <option value="reserved">{statusMeta.reserved.label}</option>
                    <option value="cleaning">{statusMeta.cleaning.label}</option>
                  </select>
                  <p className="text-xs font-semibold text-gray-500">{t("tableStatus.tapForHistory")}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeHistoryModal}>
          <div
            className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  {t("tableStatus.historyTitle", { table: selectedTable })}
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-600">{t("tableStatus.historySubtitle")}</p>
              </div>
              <button
                onClick={closeHistoryModal}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                {t("close")}
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
              <p className="mb-3 text-sm font-bold text-sky-900">{t("filtersAndSort")}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>{t("tableStatus.filterFrom")}</span>
                <input
                  type="datetime-local"
                  value={historyStartAt}
                  onChange={(e) => setHistoryStartAt(e.target.value)}
                  className="rounded-xl border border-sky-200 bg-white px-3 py-2 outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>{t("tableStatus.filterTo")}</span>
                <input
                  type="datetime-local"
                  value={historyEndAt}
                  onChange={(e) => setHistoryEndAt(e.target.value)}
                  className="rounded-xl border border-sky-200 bg-white px-3 py-2 outline-none focus:border-sky-500"
                />
              </label>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setHistoryStartAt("");
                    setHistoryEndAt("");
                  }}
                  className="w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm font-bold text-sky-700 hover:bg-sky-100"
                >
                  {t("clearAll")}
                </button>
              </div>
            </div>
            </div>

            <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
              <p className="text-sm font-bold text-violet-900">{t("tableStatus.previousUsers")}</p>
              {tableHistoryUsers.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600">{t("tableStatus.noHistory")}</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tableHistoryUsers.map((user) => (
                    <span key={user.label} className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-800">
                      {user.label} x{user.count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {tableHistoryOrders.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm font-medium text-gray-600">
                  {t("tableStatus.noHistory")}
                </div>
              ) : (
                tableHistoryOrders.map((order) => (
                  <div key={order._id} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-bold text-gray-900">
                        {order.displayName} ({order.userId})
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${orderStatusTone[order.status]}`}>
                          {order.status}
                        </span>
                        <p className="text-xs font-semibold text-gray-500">{formatDateTime(order.createdAt)}</p>
                      </div>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {t("orderId")}: {order.orderId}
                    </p>
                    <div className="mt-3 space-y-1 rounded-xl border border-emerald-100 bg-white p-3">
                      {order.items.map((item, idx) => (
                        <p key={`${order._id}-${item.itemId}-${idx}`} className="text-sm font-medium text-gray-700">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
