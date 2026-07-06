"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  inventoryAPI, 
  itemAPI, 
  storeAPI,
  type Inventory, 
  type Item, 
  type Store 
} from "@/src/lib/api-service";
import {
  FaSpinner,
  FaPlus,
  FaEdit,
  FaTrash,
  FaStore,
  FaExchangeAlt,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaTimes,
  FaCheck,
  FaBox,
  FaBuilding,
} from "react-icons/fa";

// ============================================================
// INVENTORY MANAGEMENT PAGE
// ============================================================
export default function InventoryManagementPage({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const themeClasses = {
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-400" : "text-gray-600",
      muted: isDarkMode ? "text-gray-500" : "text-gray-500",
    },
    card: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
    hover: isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50",
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [inventoryData, itemsData, storesData] = await Promise.all([
        inventoryAPI.getAll(),
        itemAPI.getAll(),
        storeAPI.getAll(),
      ]);

      setInventory(inventoryData);
      setItems(itemsData);
      setStores(storesData);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory data");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter inventory based on search and store selection
  const filteredInventory = inventory.filter((inv) => {
    const matchesSearch = 
      inv.item?.partName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.item?.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.item?.code?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStore = selectedStore ? inv.store?.id === selectedStore : true;
    
    return matchesSearch && matchesStore;
  });

  // Group inventory by store for summary view
  const inventoryByStore = filteredInventory.reduce((acc, inv) => {
    const storeId = inv.store?.id || 0;
    const storeName = inv.store?.location || "Unknown Store";
    if (!acc[storeId]) {
      acc[storeId] = { name: storeName, items: [], totalItems: 0, totalValue: 0 };
    }
    acc[storeId].items.push(inv);
    acc[storeId].totalItems += inv.quantity || 0;
    acc[storeId].totalValue += (inv.quantity || 0) * (inv.item?.sellingPrice || 0);
    return acc;
  }, {} as Record<number, { name: string; items: Inventory[]; totalItems: number; totalValue: number }>);

  const handleAddStock = async (data: { storeId: number; itemId: number; quantity: number }) => {
    try {
      setError(null);
      await inventoryAPI.addStock(data.storeId, data.itemId, data.quantity);
      setSuccess(`Successfully added ${data.quantity} units to store`);
      await loadData();
      setShowAddStock(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTransfer = async (data: { 
    fromStoreId: number; 
    toStoreId: number; 
    itemId: number; 
    quantity: number 
  }) => {
    try {
      setError(null);
      await inventoryAPI.transferStock(
        data.fromStoreId,
        data.toStoreId,
        data.itemId,
        data.quantity
      );
      setSuccess(`Successfully transferred ${data.quantity} units`);
      await loadData();
      setShowTransfer(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to transfer stock");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddItem = async (data: {
    name: string;
    code: string;
    partNumber: string;
    price: string;
    buyingPrice: string;
    initialStock: string;
    storeId: number;
    type: string;
    brand: string;
  }) => {
    try {
      setError(null);
      const newItem = await itemAPI.create({
        partName: data.name,
        partNumber: data.partNumber,
        code: data.code,
        sellingPrice: parseFloat(data.price),
        buyingPrice: parseFloat(data.buyingPrice) || parseFloat(data.price) * 0.7,
        type: data.type || "FIXED",
        brand: data.brand || "",
      });
      

        await inventoryAPI.addStock(data.storeId, newItem.id, parseFloat(data.initialStock));
      
      
      setSuccess(`Successfully added item: ${data.name}`);
      await loadData();
      setShowAddItem(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add item");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Loading Inventory...</h3>
          <p className={themeClasses.text.secondary}>Fetching your store data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary}`}>Inventory Management</h2>
          <p className={`${themeClasses.text.secondary} text-sm md:text-base`}>
            Manage stock across all stores
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddItem(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <FaPlus /> New Item
          </button>
          <button
            onClick={() => setShowAddStock(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaArrowUp /> Add Stock
          </button>
          <button
            onClick={() => setShowTransfer(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaExchangeAlt /> Transfer
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
          <FaTimes className="text-red-500" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
          <FaCheck className="text-green-500" />
          {success}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-4 py-3 pl-10 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900"} focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
          />
        </div>
        <select
          value={selectedStore || ""}
          onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : null)}
          className={`px-4 py-3 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900"} focus:ring-2 focus:ring-emerald-500 min-w-[180px]`}
        >
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.location}
            </option>
          ))}
        </select>
        <button
          onClick={() => loadData()}
          className={`px-4 py-3 rounded-lg transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Refresh
        </button>
      </div>

      {/* Store Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(inventoryByStore).map(([storeId, data]) => (
          <div
            key={storeId}
            className={`${themeClasses.card} rounded-xl p-4 border shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`font-semibold ${themeClasses.text.primary} flex items-center gap-2`}>
                  <FaStore className="text-emerald-500" />
                  {data.name}
                </h4>
                <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>
                  {data.items.length} unique items
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
                  {data.totalItems} units
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Ksh {data.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className={`flex-1 ${themeClasses.card} rounded-xl border overflow-hidden`}>
        <div className="overflow-x-auto h-full">
          <table className="w-full">
            <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} sticky top-0`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text.secondary} uppercase tracking-wider`}>
                  Item Code
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text.secondary} uppercase tracking-wider`}>
                  Product Name
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text.secondary} uppercase tracking-wider`}>
                  Store
                </th>
                <th className={`px-4 py-3 text-right text-xs font-semibold ${themeClasses.text.secondary} uppercase tracking-wider`}>
                  Price (Ksh)
                </th>
                <th className={`px-4 py-3 text-right text-xs font-semibold ${themeClasses.text.secondary} uppercase tracking-wider`}>
                  Stock
                </th>
                <th className={`px-4 py-3 text-right text-xs font-semibold ${themeClasses.text.secondary} uppercase tracking-wider`}>
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-8 text-center ${themeClasses.text.secondary}`}>
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className={`${themeClasses.hover} transition-colors cursor-pointer`}
                    onClick={() => setSelectedItem(inv)}
                  >
                    <td className={`px-4 py-3 text-sm ${themeClasses.text.secondary} font-mono`}>
                      {inv.item?.partNumber || inv.item?.code || "N/A"}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${themeClasses.text.primary}`}>
                      {inv.item?.partName || "Unknown Item"}
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.text.secondary}`}>
                      {inv.store?.location || "Unknown Store"}
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.text.primary} text-right`}>
                      {inv.item?.sellingPrice?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${(inv.quantity || 0) < 10 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {inv.quantity || 0}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.text.primary} text-right`}>
                      {((inv.quantity || 0) * (inv.item?.sellingPrice || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal
          isDarkMode={isDarkMode}
          onClose={() => setShowAddItem(false)}
          onSave={handleAddItem}
          stores={stores}
        />
      )}

      {showAddStock && (
        <AddStockModal
          isDarkMode={isDarkMode}
          onClose={() => setShowAddStock(false)}
          onSave={handleAddStock}
          items={items}
          stores={stores}
        />
      )}

      {showTransfer && (
        <TransferModal
          isDarkMode={isDarkMode}
          onClose={() => setShowTransfer(false)}
          onSave={handleTransfer}
          items={items}
          stores={stores}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          isDarkMode={isDarkMode}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={loadData}
          stores={stores}
        />
      )}
    </div>
  );
}

// ============================================================
// ADD ITEM MODAL
// ============================================================
function AddItemModal({ isDarkMode, onClose, onSave, stores }: any) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    partNumber: "",
    price: "",
    buyingPrice: "",
    initialStock: "0",
    storeId: "",
    type: "FIXED",
    brand: "",
  });

  const themeClasses = {
    bg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg} rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${themeClasses.text}`}>Add New Item</h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Product Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Item Code / SKU *
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="e.g., PRD-001"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Part Number *
            </label>
            <input
              type="text"
              value={form.partNumber}
              onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="e.g., PN-10023"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Brand
            </label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Optional brand name"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="FIXED">Fixed Price</option>
              <option value="WEIGHED">Weighed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
                Selling Price (Ksh) *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
                Buying Price (Ksh)
              </label>
              <input
                type="number"
                value={form.buyingPrice}
                onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
                Initial Stock
              </label>
              <input
                type="number"
                value={form.initialStock}
                onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                placeholder="0"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
                Store
              </label>
              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              >
                <option value="">Select store</option>
                {stores.map((store: any) => (
                  <option key={store.id} value={store.id}>
                    {store.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSave(form)}
              disabled={!form.name || !form.code || !form.partNumber || !form.price}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus className="inline mr-2" /> Add Item
            </button>
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADD STOCK MODAL
// ============================================================
function AddStockModal({ isDarkMode, onClose, onSave, items, stores }: any) {
  const [form, setForm] = useState({
    storeId: "",
    itemId: "",
    quantity: "",
  });

  const themeClasses = {
    bg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg} rounded-xl max-w-lg w-full p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${themeClasses.text}`}>Add Stock</h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Store *
            </label>
            <select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select store</option>
              {stores.map((store: any) => (
                <option key={store.id} value={store.id}>
                  {store.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Item *
            </label>
            <select
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select item</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.partName} ({item.partNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Quantity *
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSave(form)}
              disabled={!form.storeId || !form.itemId || !form.quantity || parseInt(form.quantity) <= 0}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowUp className="inline mr-2" /> Add Stock
            </button>
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TRANSFER MODAL
// ============================================================
function TransferModal({ isDarkMode, onClose, onSave, items, stores }: any) {
  const [form, setForm] = useState({
    fromStoreId: "",
    toStoreId: "",
    itemId: "",
    quantity: "",
  });

  const themeClasses = {
    bg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg} rounded-xl max-w-lg w-full p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${themeClasses.text}`}>Transfer Stock</h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              From Store *
            </label>
            <select
              value={form.fromStoreId}
              onChange={(e) => setForm({ ...form, fromStoreId: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select source store</option>
              {stores.map((store: any) => (
                <option key={store.id} value={store.id}>
                  {store.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              To Store *
            </label>
            <select
              value={form.toStoreId}
              onChange={(e) => setForm({ ...form, toStoreId: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select destination store</option>
              {stores
                .filter((store: any) => store.id !== parseInt(form.fromStoreId))
                .map((store: any) => (
                  <option key={store.id} value={store.id}>
                    {store.location}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Item *
            </label>
            <select
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="">Select item</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.partName} ({item.partNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              Quantity *
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSave(form)}
              disabled={
                !form.fromStoreId || 
                !form.toStoreId || 
                !form.itemId || 
                !form.quantity || 
                parseInt(form.quantity) <= 0 ||
                form.fromStoreId === form.toStoreId
              }
              className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaExchangeAlt className="inline mr-2" /> Transfer Stock
            </button>
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ITEM DETAIL MODAL
// ============================================================
function ItemDetailModal({ isDarkMode, item, onClose, onUpdate, stores }: any) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: item?.item?.partName || "",
    code: item?.item?.partNumber || item?.item?.code || "",
    price: item?.item?.sellingPrice || "",
    stock: item?.quantity || "",
  });

  const themeClasses = {
    bg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900",
    label: isDarkMode ? "text-gray-300" : "text-gray-700",
  };

  const handleUpdate = async () => {
    try {
      // Update item details
      await itemAPI.update(item.item.id, {
        partName: form.name,
        partNumber: form.code,
        sellingPrice: parseFloat(form.price),
      });
      
      // Update inventory quantity if changed
      if (parseInt(form.stock) !== item.quantity) {
        const diff = parseInt(form.stock) - item.quantity;
        await inventoryAPI.addStock(item.store.id, item.item.id, diff);
      }
      
      await onUpdate();
      setEditMode(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg} rounded-xl max-w-md w-full p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${themeClasses.text}`}>Item Details</h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.label}`}>Store</label>
            <p className={themeClasses.text}>{item?.store?.location || "Unknown"}</p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.label}`}>Item Code</label>
            {editMode ? (
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              />
            ) : (
              <p className={`${themeClasses.text} font-mono`}>{item?.item?.partNumber || item?.item?.code}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.label}`}>Product Name</label>
            {editMode ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              />
            ) : (
              <p className={themeClasses.text}>{item?.item?.partName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.label}`}>Price (Ksh)</label>
              {editMode ? (
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                />
              ) : (
                <p className={themeClasses.text}>{item?.item?.sellingPrice?.toFixed(2)}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${themeClasses.label}`}>Stock</label>
              {editMode ? (
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                />
              ) : (
                <p className={`font-semibold ${(item?.quantity || 0) < 10 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {item?.quantity || 0}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaEdit /> Edit Item
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}