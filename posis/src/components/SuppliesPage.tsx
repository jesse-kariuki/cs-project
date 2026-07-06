"use client";

import { useState, useEffect, useCallback } from "react";
import {
  companyAPI,
  storeAPI,
  itemAPI,
  supplyAPI,
  type Company,
  type Store,
  type Item,
  type Supply,
} from "@/src/lib/api-service";
import { FaSpinner, FaTruck, FaPlus, FaTimes, FaCheck, FaBuilding } from "react-icons/fa";

export default function SuppliesPage({ isDarkMode }: { isDarkMode: boolean }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [deliveries, setDeliveries] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyId: "",
    storeId: "",
    itemId: "",
    quantity: "",
    basePrice: "",
  });

  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");

  const themeClasses = {
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    },
    card: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900",
    hover: isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50",
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [companyData, storeData, itemData, supplyData] = await Promise.all([
        companyAPI.getAll(),
        storeAPI.getAll(),
        itemAPI.getAll(),
        supplyAPI.getAll(),
      ]);
      setCompanies(companyData);
      setStores(storeData);
      setItems(itemData);
      setDeliveries(
        [...supplyData].sort(
          (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to load supplier data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReceive = async () => {
    const companyId = Number(form.companyId);
    const storeId = Number(form.storeId);
    const itemId = Number(form.itemId);
    const quantity = Number(form.quantity);
    const basePrice = Number(form.basePrice);

    if (!companyId || !storeId || !itemId || !quantity || quantity <= 0 || !basePrice || basePrice < 0) {
      setError("Please fill in all fields with valid values");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await supplyAPI.receive({ companyId, storeId, itemId, quantity, basePrice });
      setSuccess(`Received ${quantity} units — inventory updated`);
      setForm({ companyId: "", storeId: "", itemId: "", quantity: "", basePrice: "" });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to record delivery");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      setError("Supplier name is required");
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      const created = await companyAPI.create({
        name: newCompanyName.trim(),
        phone: newCompanyPhone.trim(),
      });
      setCompanies((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, companyId: String(created.id) }));
      setShowNewCompany(false);
      setNewCompanyName("");
      setNewCompanyPhone("");
      setSuccess(`Supplier ${created.name} added`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add supplier");
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatMoney = (n: number) => `Ksh ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Deliveries...</h3>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Deliveries</h2>
        <p className={`${themeClasses.text.secondary} text-sm md:text-base`}>
          Receive stock from suppliers — inventory and cost tracking update together
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
          <FaTimes className="text-red-500" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
          <FaCheck className="text-green-500" /> {success}
        </div>
      )}

      {/* Receive Delivery Form */}
      <div className={`${themeClasses.card} border rounded-xl p-4 md:p-6 mb-6 flex-shrink-0`}>
        <h3 className={`text-base font-semibold ${themeClasses.text.primary} mb-4 flex items-center gap-2`}>
          <FaTruck className="text-emerald-500" /> Receive Delivery
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-1">
            <label className={`block text-xs font-semibold ${themeClasses.text.secondary} mb-1`}>Supplier</label>
            {showNewCompany ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Supplier name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newCompanyPhone}
                  onChange={(e) => setNewCompanyPhone(e.target.value)}
                  className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleCreateCompany}
                    className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowNewCompany(false)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
                >
                  <option value="">Select supplier</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewCompany(true)}
                  className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                >
                  <FaBuilding className="h-3 w-3" /> New supplier
                </button>
              </>
            )}
          </div>

          <div>
            <label className={`block text-xs font-semibold ${themeClasses.text.secondary} mb-1`}>Store</label>
            <select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.location}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold ${themeClasses.text.secondary} mb-1`}>Item</label>
            <select
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select item</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.partName} ({it.partNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold ${themeClasses.text.secondary} mb-1`}>Quantity</label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold ${themeClasses.text.secondary} mb-1`}>Unit Cost (Ksh)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              className={`w-full px-2 py-2 text-sm rounded-lg border ${themeClasses.input}`}
            />
          </div>
        </div>

        <button
          onClick={handleReceive}
          disabled={submitting}
          className="mt-4 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <FaSpinner className="animate-spin h-4 w-4" /> : <FaPlus className="h-4 w-4" />}
          Receive Delivery
        </button>
      </div>

      {/* Delivery History */}
      <div className={`flex-1 min-h-0 ${themeClasses.card} border rounded-xl overflow-hidden flex flex-col`}>
        <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <h3 className={`text-sm font-semibold ${themeClasses.text.primary}`}>Delivery History</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"} sticky top-0`}>
              <tr>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${themeClasses.text.secondary}`}>Date</th>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${themeClasses.text.secondary}`}>Supplier</th>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${themeClasses.text.secondary}`}>Store</th>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${themeClasses.text.secondary}`}>Item</th>
                <th className={`px-4 py-2 text-right text-xs font-semibold ${themeClasses.text.secondary}`}>Qty</th>
                <th className={`px-4 py-2 text-right text-xs font-semibold ${themeClasses.text.secondary}`}>Unit Cost</th>
                <th className={`px-4 py-2 text-right text-xs font-semibold ${themeClasses.text.secondary}`}>Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-8 text-center ${themeClasses.text.secondary}`}>
                    No deliveries recorded yet
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d.id} className={themeClasses.hover}>
                    <td className={`px-4 py-2 ${themeClasses.text.secondary}`}>
                      {new Date(d.dateAdded).toLocaleDateString()}
                    </td>
                    <td className={`px-4 py-2 font-medium ${themeClasses.text.primary}`}>{d.company?.name}</td>
                    <td className={`px-4 py-2 ${themeClasses.text.secondary}`}>{d.store?.location}</td>
                    <td className={`px-4 py-2 ${themeClasses.text.primary}`}>{d.item?.partName}</td>
                    <td className={`px-4 py-2 text-right ${themeClasses.text.primary}`}>{d.quantity}</td>
                    <td className={`px-4 py-2 text-right ${themeClasses.text.primary}`}>{formatMoney(d.basePrice)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-500">
                      {formatMoney(d.quantity * d.basePrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}