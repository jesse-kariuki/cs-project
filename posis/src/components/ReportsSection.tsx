"use client";

import { useState, useEffect } from "react";
import { reportAPI, MonthlyReportDto, ProductProfitDto } from "@/src/lib/api-service";
import {
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFilter,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";


function ReportsSection({ isDarkMode }: { isDarkMode: boolean }) {
  const [viewMode, setViewMode] = useState<"monthly" | "alltime">("monthly");
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportDto | null>(null);
  const [allTimeProfit, setAllTimeProfit] = useState<ProductProfitDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [filterLossMakers, setFilterLossMakers] = useState(false);

  const themeClasses = {
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
      muted: isDarkMode ? "text-gray-500" : "text-gray-500",
    },
    card: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
    hover: isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50",
  };

  // Load monthly report
  useEffect(() => {
    if (viewMode === "monthly") {
      loadMonthlyReport();
    }
  }, [monthDate, viewMode]);

  // Load all-time profit
  useEffect(() => {
    if (viewMode === "alltime") {
      loadAllTimeProfit();
    }
  }, [viewMode]);

  const loadMonthlyReport = async () => {
    try {
      setLoading(true);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const report = await reportAPI.getMonthlyReport(year, month);
      setMonthlyReport(report);
    } catch (err) {
      console.error("Failed to load monthly report:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTimeProfit = async () => {
    try {
      setLoading(true);
      const profits = await reportAPI.getAllTimeProfit();
      setAllTimeProfit(profits);
    } catch (err) {
      console.error("Failed to load all-time profit:", err);
    } finally {
      setLoading(false);
    }
  };

  const shiftMonth = (direction: -1 | 1) => {
    const newDate = new Date(monthDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setMonthDate(newDate);
  };

  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const renderMonthlyView = () => {
    if (!monthlyReport) return null;

    const reportData = [
      {
        name: "Revenue",
        value: monthlyReport.totalRevenue,
        color: "#10b981",
      },
      {
        name: "Cost",
        value: monthlyReport.totalCost,
        color: "#ef4444",
      },
    ];

    const topPerformersData = monthlyReport.topPerformers.slice(0, 5).map((p) => ({
      name: p.productName.slice(0, 12),
      profit: p.profit,
      margin: p.marginPercent,
    }));

    return (
      <div className="space-y-6 pb-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Revenue"
            value={monthlyReport.totalRevenue}
            icon={<FaArrowUp />}
            color="emerald"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Total Cost"
            value={monthlyReport.totalCost}
            icon={<FaArrowDown />}
            color="red"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Net Profit"
            value={monthlyReport.netProfit}
            icon={<FaArrowUp />}
            color={monthlyReport.netProfit >= 0 ? "green" : "red"}
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Profit Margin"
            value={monthlyReport.overallMargin}
            suffix="%"
            icon={<FaFilter />}
            color="blue"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Cost Chart */}
          <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg p-6 border`}>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
              Revenue vs Cost
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData}>
                  <CartesianGrid stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="name" tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280" }} />
                  <YAxis tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280" }} />
                  <Tooltip
                    contentStyle={{
                      background: isDarkMode ? "#1f2937" : "#fff",
                      border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    }}
                    formatter={(value) => `Ksh ${Number(value).toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers Chart */}
          {topPerformersData.length > 0 && (
            <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg p-6 border`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
                Top 5 Products by Profit
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPerformersData}>
                    <CartesianGrid stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        background: isDarkMode ? "#1f2937" : "#fff",
                        border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                      }}
                      formatter={(value) => `Ksh ${Number(value).toLocaleString()}`}
                    />
                    <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Top Performers & Loss Makers Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg overflow-hidden border`}>
            <div className="p-6 border-b border-gray-700">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} flex items-center gap-2`}>
                <FaArrowUp className="text-emerald-500" />
                Top Performers
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {monthlyReport.topPerformers.slice(0, 5).map((product, idx) => (
                <div
                  key={product.productId}
                  className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold ${themeClasses.text.primary} text-sm truncate`}>
                          {product.productName}
                        </p>
                        <p className={`text-xs ${themeClasses.text.muted}`}>
                          {product.totalSold} {product.sellingUnit} sold
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold text-emerald-500`}>
                      Ksh {product.profit.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {product.marginPercent.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loss Makers */}
          {monthlyReport.lossMakers.length > 0 && (
            <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg overflow-hidden border`}>
              <div className="p-6 border-b border-gray-700">
                <h3 className={`text-lg font-semibold text-red-500 flex items-center gap-2`}>
                  <FaArrowDown />
                  Loss Making Products
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {monthlyReport.lossMakers.slice(0, 5).map((product) => (
                  <div
                    key={product.productId}
                    className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${themeClasses.text.primary} text-sm truncate`}>
                          {product.productName}
                        </p>
                        <p className={`text-xs ${themeClasses.text.muted}`}>
                          Code: {product.productCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-red-500">
                        Loss: Ksh {Math.abs(product.profit).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
                      }`}>
                        {product.marginPercent.toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Breakdown Table */}
        <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg overflow-hidden border`}>
          <div className="p-6 border-b border-gray-700">
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              Product Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-750" : "bg-gray-50"}>
                <tr>
                  <th className={`text-left px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Product
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Code
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Sold
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Revenue
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Cost
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Profit
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                {monthlyReport.productBreakdown
                  .filter((p) => !filterLossMakers || p.isLossMaking)
                  .map((product) => (
                    <tr
                      key={product.productId}
                      className={`${themeClasses.hover} transition-colors`}
                    >
                      <td className={`px-6 py-3 text-sm font-medium ${themeClasses.text.primary}`}>
                        {product.productName}
                      </td>
                      <td className={`px-6 py-3 text-sm ${themeClasses.text.secondary}`}>
                        {product.productCode}
                      </td>
                      <td className={`px-6 py-3 text-sm text-right ${themeClasses.text.primary}`}>
                        {product.totalSold} {product.sellingUnit}
                      </td>
                      <td className={`px-6 py-3 text-sm text-right ${themeClasses.text.primary}`}>
                        Ksh {product.totalRevenue.toLocaleString()}
                      </td>
                      <td className={`px-6 py-3 text-sm text-right ${themeClasses.text.primary}`}>
                        Ksh {product.totalCost.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-3 text-sm text-right font-semibold ${
                          product.profit >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        Ksh {product.profit.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-3 text-sm text-right font-semibold ${
                          product.marginPercent >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {product.marginPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAllTimeView = () => {
    const topProducts = allTimeProfit.slice(0, 10);
    const totalProfit = allTimeProfit.reduce((sum, p) => sum + p.profit, 0);
    const totalRevenue = allTimeProfit.reduce((sum, p) => sum + p.totalRevenue, 0);
    const avgMargin =
      allTimeProfit.length > 0
        ? allTimeProfit.reduce((sum, p) => sum + p.marginPercent, 0) / allTimeProfit.length
        : 0;

    return (
      <div className="space-y-6 pb-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Profit (All-Time)"
            value={totalProfit}
            icon={<FaArrowUp />}
            color="emerald"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Total Revenue (All-Time)"
            value={totalRevenue}
            icon={<FaArrowUp />}
            color="blue"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Avg. Profit Margin"
            value={avgMargin}
            suffix="%"
            icon={<FaFilter />}
            color="purple"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Top Performers */}
        <div className={`${themeClasses.card} rounded-xl md:rounded-2xl shadow-lg overflow-hidden border`}>
          <div className="p-6 border-b border-gray-700">
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              Top 10 Products by All-Time Profit
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-750" : "bg-gray-50"}>
                <tr>
                  <th className={`text-left px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Rank
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Product
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Total Profit
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Revenue
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Margin %
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Units Sold
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                {topProducts.map((product, idx) => (
                  <tr key={product.productId} className={`${themeClasses.hover} transition-colors`}>
                    <td className={`px-6 py-3 text-sm font-bold ${themeClasses.text.primary}`}>
                      {idx + 1}
                    </td>
                    <td className={`px-6 py-3 text-sm font-medium ${themeClasses.text.primary}`}>
                      {product.productName}
                    </td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold text-emerald-500`}>
                      Ksh {product.profit.toLocaleString()}
                    </td>
                    <td className={`px-6 py-3 text-sm text-right ${themeClasses.text.primary}`}>
                      Ksh {product.totalRevenue.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-3 text-sm text-right font-semibold ${
                        product.marginPercent >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {product.marginPercent.toFixed(2)}%
                    </td>
                    <td className={`px-6 py-3 text-sm text-right ${themeClasses.text.primary}`}>
                      {product.totalSold.toLocaleString()} {product.sellingUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Reports...</h3>
          <p className={themeClasses.text.muted}>Analyzing your business data</p>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>
            Reports & Analytics
          </h2>
          <p className={`${themeClasses.text.secondary} text-sm md:text-base`}>
            Detailed business performance analysis
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className={`flex gap-2 ${themeClasses.card} rounded-lg p-1 border w-fit`}>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              viewMode === "monthly"
                ? "bg-emerald-500 text-white"
                : isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode("alltime")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              viewMode === "alltime"
                ? "bg-emerald-500 text-white"
                : isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Month Selector (Monthly View) */}
      {viewMode === "monthly" && (
        <div className={`${themeClasses.card} rounded-xl md:rounded-2xl border p-4 md:p-6 mb-6`}>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => shiftMonth(-1)}
              className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <FaChevronLeft />
            </button>
            <h3 className={`text-lg md:text-xl font-semibold ${themeClasses.text.primary} min-w-max`}>
              {monthLabel}
            </h3>
            <button
              onClick={() => shiftMonth(1)}
              className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "monthly" && monthlyReport ? renderMonthlyView() : renderAllTimeView()}
      </div>
    </section>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon,
  color,
  suffix = "",
  isDarkMode,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  suffix?: string;
  isDarkMode: boolean;
}) {
  const colorClasses = {
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    red: "from-red-500 to-pink-500",
    purple: "from-purple-500 to-violet-500",
  };

  return (
    <div
      className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 relative overflow-hidden border ${
        isDarkMode ? "border-gray-700" : "border-gray-100"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-5`}></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm font-medium mb-2`}>
            {title}
          </p>
          <h3 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
            {value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
            {suffix}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default ReportsSection;