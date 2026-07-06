"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saleAPI, inventoryAPI, itemAPI, Sale } from "@/src/lib/api-service";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaChartLine,
  FaBox,
  FaReceipt,
  FaBars,
  FaTimes,
  FaSpinner,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaUserCircle,
  FaDollarSign,
  FaChartBar,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaTruck,
  FaUsers,
} from "react-icons/fa";

import InventoryManagementPage from "@/src/components/InventoryManagementPage";
import ReportsSection from "@/src/components/ReportsSection";
import CustomerCreditPage from "@/src/components/CustomerCreditPage";
import SuppliesPage from "@/src/components/SuppliesPage";



// --- Dashboard Section ---
function DashboardSection({ isDarkMode }: { isDarkMode: boolean }) {
  const [trendView, setTrendView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [salesForTrends, setSalesForTrends] = useState<Array<{ createdAt: string; totalAmount: number }>>([]);
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    orderCount: 0,
    avgOrderValue: 0,
    topProducts: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  const toNairobiDate = (dateValue: string) => {
    return new Date(new Date(dateValue).toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  };

  const buildWeekRanges = (year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const weeks: Array<{ label: string; start: Date; end: Date }> = [];

    const firstSundayOffset = (7 - monthStart.getDay()) % 7;
    const firstWeekEnd = new Date(monthStart);
    firstWeekEnd.setDate(monthStart.getDate() + firstSundayOffset);

    weeks.push({ label: "Week 1", start: new Date(monthStart), end: new Date(firstWeekEnd) });

    let nextWeekStart = new Date(firstWeekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);

    while (nextWeekStart <= monthEnd) {
      const weekStart = new Date(nextWeekStart);
      const weekEnd = new Date(weekStart);
      const daysUntilSunday = (7 - weekStart.getDay()) % 7;
      weekEnd.setDate(weekStart.getDate() + daysUntilSunday);
      if (weekEnd > monthEnd) {
        weekEnd.setTime(monthEnd.getTime());
      }

      weeks.push({ label: `Week ${weeks.length + 1}`, start: weekStart, end: weekEnd });

      nextWeekStart = new Date(weekEnd);
      nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    }

    return weeks;
  };

  const nowInNairobi = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

  const trendData = (() => {
    if (salesForTrends.length === 0) {
      return [] as Array<{ label: string; value: number }>;
    }

    if (trendView === "daily") {
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const monday = new Date(nowInNairobi);
      const mondayOffset = (monday.getDay() + 6) % 7;
      monday.setDate(monday.getDate() - mondayOffset);

      return dayNames.map((label, index) => {
        const start = new Date(monday);
        start.setDate(monday.getDate() + index);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        const value = salesForTrends.reduce((sum, order) => {
          const date = toNairobiDate(order.createdAt);
          if (date >= start && date <= end) {
            return sum + (order.totalAmount || 0);
          }
          return sum;
        }, 0);

        return { label, value };
      });
    }

    if (trendView === "weekly") {
      const weeks = buildWeekRanges(nowInNairobi.getFullYear(), nowInNairobi.getMonth());
      return weeks.map((week) => {
        const start = new Date(week.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(week.end);
        end.setHours(23, 59, 59, 999);

        const value = salesForTrends.reduce((sum, order) => {
          const date = toNairobiDate(order.createdAt);
          if (date >= start && date <= end) {
            return sum + (order.totalAmount || 0);
          }
          return sum;
        }, 0);

        return { label: week.label, value };
      });
    }

    const rows: Array<{ label: string; value: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const monthDate = new Date(nowInNairobi.getFullYear(), nowInNairobi.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const value = salesForTrends.reduce((sum, order) => {
        const date = toNairobiDate(order.createdAt);
        if (date.getFullYear() === year && date.getMonth() === month) {
          return sum + (order.totalAmount || 0);
        }
        return sum;
      }, 0);

      rows.push({
        label: monthDate.toLocaleDateString("en-US", { month: "short" }),
        value,
      });
    }
    return rows;
  })();

  const highestValue = trendData.reduce((max, point) => (point.value > max ? point.value : max), 0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = await saleAPI.getTodayTotal();
        const orders = await saleAPI.getAll();
        const monthly = await saleAPI.getMonthlyTotal();
        const topProd = await saleAPI.getTopSellingItems();

        const totalValue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

        setStats({
          todaySales: today || 0,
          monthSales: monthly || 0,
          orderCount: orders.length,
          avgOrderValue: orders.length > 0 ? totalValue / orders.length : 0,
          topProducts: topProd || []
        });
        setSalesForTrends(
          orders.map((order: any) => ({
            createdAt: order.saleDate,
            totalAmount: order.totalAmount || 0,
          }))
        );
      } catch (error) {
        console.error("Stats loading error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const themeClasses = {
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
      muted: isDarkMode ? "text-gray-500" : "text-gray-500",
    },
    card: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
    hover: isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Dashboard...</h3>
          <p className={themeClasses.text.muted}>Fetching your store statistics</p>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col">
      <div className="flex flex-col mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Dashboard</h2>
        <p className={`${themeClasses.text.secondary} text-sm md:text-base`}>
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Today"
            value={`Ksh ${stats.todaySales.toLocaleString()}`}
            icon={<FaDollarSign className="text-emerald-600" />}
            color="emerald"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Monthly"
            value={`Ksh ${stats.monthSales.toLocaleString()}`}
            icon={<FaChartBar className="text-blue-600" />}
            color="blue"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Transactions"
            value={stats.orderCount.toString()}
            icon={<FaShoppingCart className="text-purple-600" />}
            color="purple"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Avg. Order"
            value={`Ksh ${stats.avgOrderValue.toFixed(0)}`}
            icon={<FaChartLine className="text-amber-600" />}
            color="amber"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg overflow-hidden flex flex-col`}>
            <div className="p-4 md:p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-base md:text-lg font-semibold ${themeClasses.text.primary}`}>Top Products</h3>
                <span className="text-xs md:text-sm text-emerald-600 font-medium">This Month</span>
              </div>
            </div>
            <div className="divide-y divide-gray-700 flex-1 overflow-y-auto max-h-[300px]">
              {stats.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className={`p-3 md:p-4 ${themeClasses.hover} transition-colors`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs md:text-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`font-medium ${themeClasses.text.primary} text-sm md:text-base truncate`}>
                          {product.name}
                        </h4>
                        <p className={`text-xs ${themeClasses.text.muted}`}>{product.quantitySold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`font-semibold ${themeClasses.text.primary} text-sm md:text-base`}>
                        Ksh {product.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Trends */}
          <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg overflow-hidden flex flex-col`}>
            <div className="p-4 md:p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className={`text-base md:text-lg font-semibold ${themeClasses.text.primary}`}>Sales Trends</h3>
                <div className="flex items-center gap-1 shrink-0">
                  {(["daily", "weekly", "monthly"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTrendView(mode)}
                      className={`px-2 py-1 md:px-3 rounded-md text-[11px] md:text-xs font-medium capitalize border transition-colors ${
                        trendView === mode
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-300 border-gray-600"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[220px] md:min-h-[280px] p-2 md:p-4 overflow-x-auto">
              <div className="min-w-[420px] sm:min-w-0 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                    <CartesianGrid stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeDasharray="4 4" />
                    <XAxis dataKey="label" tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
                    <YAxis tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: isDarkMode ? "#1f2937" : "#fff" }} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value, icon, color, isDarkMode }: any) {
  const colorClasses = {
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-violet-500",
    amber: "from-amber-500 to-orange-500",
  };

  const bgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-100";

  return (
    <div className={`${bgColor} ${borderColor} rounded-xl md:rounded-2xl shadow-lg p-3 md:p-4 lg:p-6 relative overflow-hidden group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-5`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className={`p-2 md:p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-sm`}>
            <span className="text-sm md:text-base lg:text-lg">{icon}</span>
          </div>
          <div className="flex items-center space-x-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <FaArrowUp className="w-2 h-2 md:w-3 md:h-3" />
          </div>
        </div>
        <div>
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-xs md:text-sm font-medium mb-1`}>{title}</p>
          <h3 className={`text-lg md:text-xl lg:text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"} truncate`}>
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}

// --- Orders Section ---
function OrdersSection({ isDarkMode }: { isDarkMode: boolean }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const formatMoney = (amount: number) => `Ksh ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const toNairobiDate = (dateValue: string) => {
    return new Date(new Date(dateValue).toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  };

  const monthLabel = monthCursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const buildWeekRanges = (year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const weeks: { label: string; start: Date; end: Date }[] = [];

    const firstSundayOffset = (7 - monthStart.getDay()) % 7;
    const firstWeekEnd = new Date(monthStart);
    firstWeekEnd.setDate(monthStart.getDate() + firstSundayOffset);

    weeks.push({
      label: "Week 1",
      start: new Date(monthStart),
      end: new Date(firstWeekEnd),
    });

    let nextWeekStart = new Date(firstWeekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);

    while (nextWeekStart <= monthEnd) {
      const weekStart = new Date(nextWeekStart);
      const weekEnd = new Date(weekStart);
      const daysUntilSunday = (7 - weekStart.getDay()) % 7;
      weekEnd.setDate(weekStart.getDate() + daysUntilSunday);
      if (weekEnd > monthEnd) {
        weekEnd.setTime(monthEnd.getTime());
      }

      weeks.push({
        label: `Week ${weeks.length + 1}`,
        start: weekStart,
        end: weekEnd,
      });

      nextWeekStart = new Date(weekEnd);
      nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    }

    return weeks;
  };

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const weekRanges = buildWeekRanges(monthCursor.getFullYear(), monthCursor.getMonth());
  const selectedWeek = weekRanges[Math.min(selectedWeekIndex, weekRanges.length - 1)] || weekRanges[0];

  const weekDays: Date[] = [];
  if (selectedWeek) {
    const cursor = new Date(selectedWeek.start);
    while (cursor <= selectedWeek.end) {
      weekDays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await saleAPI.getAll();
        const filteredByMonth = data.filter((order: Sale) => {
          const orderDate = toNairobiDate(order.saleDate);
          return (
            orderDate.getFullYear() === monthCursor.getFullYear() &&
            orderDate.getMonth() === monthCursor.getMonth()
          );
        });
        setOrders(filteredByMonth);
        setExpandedDays({});
        setSelectedWeekIndex(0);
      } catch (err) {
        console.error("Order fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [monthCursor]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (order: Sale) => {
    if (!normalizedSearch) return true;

    return (
      String(order.id).toLowerCase().includes(normalizedSearch) ||
      String(order.paymentMethod.name || "").toLowerCase().includes(normalizedSearch)
    );
  };

  const ordersByDate = orders.reduce((acc: Record<string, any[]>, order: any) => {
    const dateKey = getDateKey(toNairobiDate(order.saleDate));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {});

  const dayRows = weekDays.map((date) => {
    const key = getDateKey(date);
    const dayOrders = (ordersByDate[key] || []).filter(matchesSearch);
    const total = dayOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    return {
      key,
      date,
      orders: dayOrders,
      count: dayOrders.length,
      total,
    };
  });

  const weekTotal = dayRows.reduce((sum, row) => sum + row.total, 0);
  const weekTransactions = dayRows.reduce((sum, row) => sum + row.count, 0);
  const weekAvg = weekTransactions > 0 ? weekTotal / weekTransactions : 0;

  const shiftMonth = (direction: -1 | 1) => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const toggleDay = (key: string, count: number) => {
    if (count === 0) return;
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const themeClasses = {
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
      muted: isDarkMode ? "text-gray-500" : "text-gray-500",
    },
    card: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Transactions...</h3>
          <p className={themeClasses.text.muted}>Fetching your order history</p>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Transactions</h2>
        <p className={`${themeClasses.text.secondary} text-sm md:text-base`}>Week and day transaction breakdown</p>
      </div>

      <div className={`${themeClasses.card} rounded-xl md:rounded-2xl border p-4 md:p-6 space-y-4 mb-6`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search order ID or payment method"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 text-gray-900"}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {weekRanges.map((week, idx) => (
            <button
              key={`${week.label}-${idx}`}
              onClick={() => {
                setSelectedWeekIndex(idx);
                setExpandedDays({});
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                idx === selectedWeekIndex
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300"
                    : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              {week.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`${themeClasses.card} border rounded-lg p-3`}>
            <p className={`text-xs ${themeClasses.text.secondary} mb-1`}>Week Total</p>
            <p className="text-lg md:text-2xl font-bold text-emerald-500">
              {formatMoney(weekTotal)}
            </p>
          </div>
          <div className={`${themeClasses.card} border rounded-lg p-3`}>
            <p className={`text-xs ${themeClasses.text.secondary} mb-1`}>Transactions</p>
            <p className={`text-lg md:text-2xl font-bold ${themeClasses.text.primary}`}>{weekTransactions}</p>
          </div>
          <div className={`${themeClasses.card} border rounded-lg p-3`}>
            <p className={`text-xs ${themeClasses.text.secondary} mb-1`}>Avg per Order</p>
            <p className={`text-lg md:text-2xl font-bold ${themeClasses.text.primary}`}>
              {formatMoney(weekAvg)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="space-y-3">
          {dayRows.map((day) => {
            const isExpanded = expandedDays[day.key];
            return (
              <div key={day.key} className={`${themeClasses.card} border rounded-xl overflow-hidden`}>
                <button
                  onClick={() => toggleDay(day.key, day.count)}
                  className={`w-full p-4 flex items-center justify-between gap-2 ${isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}`}
                >
                  <div className="min-w-0 flex items-center gap-3 text-left">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm md:text-base ${themeClasses.text.primary}`}>
                        {day.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs ${themeClasses.text.secondary}`}>{day.count} transactions</span>
                    <span className="text-sm font-semibold text-emerald-500">{formatMoney(day.total)}</span>
                  </div>
                </button>

                {isExpanded && day.count > 0 && (
                  <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className={isDarkMode ? "bg-gray-750" : "bg-gray-50"}>
                          <tr>
                            <th className={`text-left py-3 px-4 text-xs font-semibold ${themeClasses.text.secondary}`}>Order ID</th>
                            <th className={`text-left py-3 px-4 text-xs font-semibold ${themeClasses.text.secondary}`}>Time</th>
                            <th className={`text-left py-3 px-4 text-xs font-semibold ${themeClasses.text.secondary}`}>Items</th>
                            <th className={`text-left py-3 px-4 text-xs font-semibold ${themeClasses.text.secondary}`}>Payment</th>
                            <th className={`text-left py-3 px-4 text-xs font-semibold ${themeClasses.text.secondary}`}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.orders.map((order) => (
                            <tr key={order.id} className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td className={`py-3 px-4 font-semibold ${themeClasses.text.primary}`}>#{order.id}</td>
                              <td className={themeClasses.text.primary}>
                                {toNairobiDate(order.saleDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className={themeClasses.text.primary}>{order.orderItems?.length || 0}</td>
                              <td className={`text-xs font-medium ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
                                {order.paymentMethod}
                              </td>
                              <td className="font-semibold text-emerald-500">{formatMoney(order.totalAmount || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- Inventory Section ---
function InventorySection({ isDarkMode }: { isDarkMode: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inventoryAPI.getAll();
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filtered = items.filter(
    (item) =>
      item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.code?.toLowerCase().includes(search.toLowerCase())
  );

  const themeClasses = {
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    },
    card: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Inventory...</h3>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col">
      <div className="flex flex-col mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Inventory</h2>
        <p className={`${themeClasses.text.secondary} text-sm md:text-base mb-4`}>Track and manage your product stock</p>

        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg focus:ring-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 text-gray-900"}`}
        />
      </div>

      <div className={`${themeClasses.card} p-6 rounded-xl md:rounded-2xl shadow-lg flex-1 overflow-y-auto`}>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className={themeClasses.text.secondary}>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className={`${themeClasses.card} rounded-lg p-4 border`}>
                <h3 className={`font-bold ${themeClasses.text.primary} text-base mb-2`}>{item.product?.name}</h3>
                <p className={`text-sm ${themeClasses.text.secondary} mb-3`}>SKU: {item.product?.code}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={themeClasses.text.secondary}>Price:</span>
                    <span className={`font-semibold ${themeClasses.text.primary}`}>
                      Ksh {item.product?.sellingPrice?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={themeClasses.text.secondary}>Stock:</span>
                    <span className={`font-semibold ${item.quantity < 10 ? "text-red-500" : "text-emerald-500"}`}>
                      {item.quantity.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// --- Main Page ---
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleThemeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menuItems = [
    { id: "Dashboard", icon: <FaChartLine />, label: "Dashboard" },
    { id: "Inventory", icon: <FaBox />, label: "Inventory" },
    { id: "Deliveries", icon: <FaTruck />, label: "Deliveries" },
    { id: "Orders", icon: <FaReceipt />, label: "Transactions" },
    { id: "Customers", icon: <FaUsers />, label: "Customers" },
    { id: "Reports", icon: <FaChartBar />, label: "Reports" },
  ];

  const bgColor = isDarkMode ? "bg-gray-900" : "bg-gray-50";

  const themeClasses = {
     background: isDarkMode ? "bg-gray-900" : "bg-gray-50",
     text: {
       primary: isDarkMode ? "text-gray-100" : "text-gray-900",
       secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
       muted: isDarkMode ? "text-gray-500" : "text-gray-500",
     },
     card: isDarkMode
       ? "bg-gray-800 border-gray-700"
       : "bg-white border-gray-100",
     hover: isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50",
   };

  return (
    <div className={`min-h-screen fixed inset-0 overflow-hidden ${bgColor}`}>
      {/* Mobile Header */}
      <div className={`lg:hidden ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-b px-4 py-3 flex items-center justify-between z-40`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1 className={`text-lg font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>RETAIL POS</h1>
        </div>
      </div>

      <div className="flex h-full pt-[57px] lg:pt-0">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-r transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 h-full pt-16 lg:pt-0`}>
          <div className={`p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"} hidden lg:block`}>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>RETAIL POS</h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Administrator Panel</p>
              <button
                onClick={handleThemeToggle}
                className={`p-3 rounded-xl ${isDarkMode ? "hover:bg-gray-800 text-yellow-300" : "hover:bg-gray-100 text-gray-600"} transition-colors`}
                title={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? isDarkMode
                        ? "bg-emerald-900/30 text-emerald-300 font-semibold border border-emerald-800"
                        : "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-semibold border border-emerald-100"
                      : `${isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm md:text-base">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className={`p-4 border-t ${themeClasses.border}`}>
                      
                      <div
                        className={`flex items-center space-x-3 mb-4 px-4 py-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} rounded-xl`}
                      >
                        <FaUserCircle
                          className={`text-2xl md:text-3xl ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        />
                        <div>
                          <p
                            className={`font-medium ${themeClasses.text.primary} text-sm md:text-base`}
                          >
                            Admin User
                          </p>
                          <p className={`text-xs ${themeClasses.text.muted}`}>
                            Administrator
                          </p>
                        </div>
                      </div>
                    </div>

          <div className={`p-4 border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-3 ${
                isDarkMode
                  ? "text-red-400 bg-red-900/20 hover:bg-red-900/30"
                  : "text-red-600 bg-red-50 hover:bg-red-100"
              } rounded-xl font-medium transition-colors text-sm`}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            {activeTab === "Dashboard" && <DashboardSection isDarkMode={isDarkMode} />}
            {activeTab === "Inventory" && <InventoryManagementPage isDarkMode={isDarkMode} />}
            {activeTab === "Deliveries" && <SuppliesPage isDarkMode={isDarkMode} />}
            {activeTab === "Orders" && <OrdersSection isDarkMode={isDarkMode} />}
            {activeTab === "Customers" && <CustomerCreditPage isDarkMode={isDarkMode} />}
            {activeTab === "Reports" && <ReportsSection isDarkMode={isDarkMode} />}

          </div>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden mt-4">
            <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-2xl border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-around p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all flex-1 mx-1 text-xs ${
                      activeTab === item.id
                        ? isDarkMode
                          ? "bg-emerald-900 text-emerald-300"
                          : "bg-emerald-500 text-white"
                        : isDarkMode
                          ? "text-gray-400 hover:bg-gray-750"
                          : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl mb-1">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}