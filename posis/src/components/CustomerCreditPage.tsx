"use client";

import { useState, useEffect, useCallback } from "react";
import {
  customerAPI,
  paymentAPI,
  ledgerAPI,
  type CreditSummaryDto,
  type PaymentMethod,
} from "@/src/lib/api-service";
import { FaSpinner, FaUserCircle, FaChevronDown, FaChevronUp, FaMoneyBillWave } from "react-icons/fa";

export default function CustomerCreditPage({ isDarkMode }: { isDarkMode: boolean }) {
  const [summaries, setSummaries] = useState<CreditSummaryDto[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editingLimit, setEditingLimit] = useState<Record<number, string>>({});
  const [repayForm, setRepayForm] = useState<Record<number, { amount: string; paymentMethodId: string }>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, methods] = await Promise.all([
        customerAPI.getAllCreditSummaries(),
        paymentAPI.getAll(),
      ]);
      setSummaries(summaryData);
      setPaymentMethods(methods.filter((m: PaymentMethod) => m.name.toLowerCase() !== "credit"));
    } catch (err) {
      console.error("Failed to load credit data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSetLimit = async (customerId: number) => {
    const raw = editingLimit[customerId];
    const value = raw !== undefined ? Number(raw) : NaN;
    if (isNaN(value) || value < 0) return;
    setBusyId(customerId);
    try {
      await customerAPI.setCreditLimit(customerId, value);
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to update limit");
    } finally {
      setBusyId(null);
    }
  };

  const handleRepay = async (customerId: number) => {
    const form = repayForm[customerId];
    const amount = Number(form?.amount);
    const paymentMethodId = Number(form?.paymentMethodId);
    if (!amount || amount <= 0 || !paymentMethodId) return;
    setBusyId(customerId);
    try {
      await ledgerAPI.recordCustomerPayment({ customerId, paymentMethodId, amount });
      setRepayForm((prev) => ({ ...prev, [customerId]: { amount: "", paymentMethodId: "" } }));
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setBusyId(null);
    }
  };

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
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Customer Credit...</h3>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col">
      <div className="flex flex-col mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Customer Credit</h2>
        <p className={`${themeClasses.text.secondary} text-sm md:text-base`}>
          Manage credit limits, view balances, and record repayments
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {summaries.length === 0 ? (
          <div className={`${themeClasses.card} border rounded-xl p-8 text-center`}>
            <p className={themeClasses.text.secondary}>No customers found</p>
          </div>
        ) : (
          summaries.map((s) => (
            <div key={s.customerId} className={`${themeClasses.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggleExpand(s.customerId)}
                className={`w-full p-4 flex items-center justify-between gap-3 ${isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3 text-left min-w-0">
                  <FaUserCircle className={`text-2xl ${themeClasses.text.secondary} shrink-0`} />
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm md:text-base ${themeClasses.text.primary}`}>{s.customerName}</p>
                    <p className={`text-xs ${themeClasses.text.secondary}`}>{s.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Outstanding</p>
                    <p className={`text-sm font-bold ${s.outstandingBalance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                      Ksh {(s.outstandingBalance??0).toFixed(2)}
                    </p>
                  </div>
                  {expanded[s.customerId] ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                </div>
              </button>

              {expanded[s.customerId] && (
                <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"} p-4 space-y-4`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`text-xs font-semibold ${themeClasses.text.secondary} whitespace-nowrap`}>Credit Limit</label>
                    <input
                      type="number"
                      defaultValue={s.creditLimit}
                      onChange={(e) => setEditingLimit((prev) => ({ ...prev, [s.customerId]: e.target.value }))}
                      className={`w-32 px-2 py-1 text-sm border rounded-lg ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300"}`}
                    />
                    <button
                      disabled={busyId === s.customerId}
                      onClick={() => handleSetLimit(s.customerId)}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Update
                    </button>
                    <span className={`text-xs ${themeClasses.text.secondary} ml-auto`}>
                      Available: Ksh {s.availableCredit.toFixed(2)}
                    </span>
                  </div>

                  {s.unpaidSales.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold ${themeClasses.text.secondary} mb-2`}>Unpaid Sales (oldest first)</p>
                      <div className="space-y-1">
                        {s.unpaidSales.map((sale) => (
                          <div key={sale.saleId} className={`flex justify-between text-xs p-2 rounded ${isDarkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                            <span className={themeClasses.text.primary}>
                              #{sale.saleId} — {new Date(sale.saleDate).toLocaleDateString()}
                            </span>
                            <span className="text-red-500 font-medium">Ksh {sale.balance.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`p-3 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-750" : "border-gray-200 bg-gray-50"}`}>
                    <p className={`text-xs font-semibold ${themeClasses.text.secondary} mb-2 flex items-center gap-1`}>
                      <FaMoneyBillWave /> Record Repayment
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={repayForm[s.customerId]?.amount || ""}
                        onChange={(e) =>
                          setRepayForm((prev) => ({
                            ...prev,
                            [s.customerId]: { ...prev[s.customerId], amount: e.target.value, paymentMethodId: prev[s.customerId]?.paymentMethodId || "" },
                          }))
                        }
                        className={`w-28 px-2 py-1.5 text-sm border rounded-lg ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300"}`}
                      />
                      <select
                        value={repayForm[s.customerId]?.paymentMethodId || ""}
                        onChange={(e) =>
                          setRepayForm((prev) => ({
                            ...prev,
                            [s.customerId]: { ...prev[s.customerId], paymentMethodId: e.target.value, amount: prev[s.customerId]?.amount || "" },
                          }))
                        }
                        className={`px-2 py-1.5 text-sm border rounded-lg ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300"}`}
                      >
                        <option value="">Method...</option>
                        {paymentMethods.map((m, index) => (
                          <option key={m.id ?? index} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <button
                        disabled={busyId === s.customerId}
                        onClick={() => handleRepay(s.customerId)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Record
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}