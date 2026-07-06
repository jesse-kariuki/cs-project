"use client";

import {
  inventoryAPI,
  saleAPI,
  itemAPI,
  scanAPI,
  paymentAPI,
  customerAPI,
  type Item,
  type CartItemDto as ScanCartItemDto,
  type CheckoutRequest,
  type PaymentMethod,
  type Sale,
  type Customer,
  type CreditSummaryDto,
} from "@/src/lib/api-service";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAccessToken, logout } from "@/src/lib/token-manager";
import {
  DEFAULT_THERMAL_PRINTER_SETTINGS,
  type ReceiptPayload,
  type ThermalPrinterSettings,
  buildBrowserReceiptHtml,
  buildThermalReceiptText,
  loadThermalPrinterSettings,
  sendRawPrintJob,
} from "@/src/lib/thermal-print";
import {
  FaBarcode,
  FaCashRegister,
  FaClock,
  FaMoneyBillWave,
  FaPhone,
  FaPlus,
  FaReceipt,
  FaShoppingCart,
  FaTimes,
  FaTrash,
  FaCreditCard,
  FaUserPlus,
  FaUser,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
} from "react-icons/fa";

interface Product extends Item {
  sellingPrice: number;
}

interface CartItem extends Product {
  qty: number;
}

const DEFAULT_STORE_ID = 1;

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const bgColor = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }[toast.type];

  const icon = {
    success: <FaCheck className="h-4 w-4" />,
    error: <FaTimes className="h-4 w-4" />,
    info: <FaBarcode className="h-4 w-4" />,
  }[toast.type];

  return (
    <div className={`animate-slide-down border rounded-lg p-4 shadow-md max-w-sm flex items-start gap-3 ${bgColor}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
};

export default function CashierDashboard() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [activeInput, setActiveInput] = useState<"barcode" | "phone" | "cash">(
    "barcode"
  );
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash" | "credit">("mpesa");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [creditSummary, setCreditSummary] = useState<CreditSummaryDto | null>(null);
  const [loadingCreditSummary, setLoadingCreditSummary] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [printerSettings] = useState<ThermalPrinterSettings>(() =>
    loadThermalPrinterSettings() || DEFAULT_THERMAL_PRINTER_SETTINGS
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button");
      if (!isInput) {
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load initial data
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      addToast("error", "No authentication token found. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }
    setIsAuthenticated(true);
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [inventoryData, paymentData, customerData] = await Promise.all([
        inventoryAPI.getAll(),
        paymentAPI.getAll(),
        customerAPI.getAll(),
      ]);

      const productList: Product[] = inventoryData.map((inv: any) => ({
        id: inv.item?.id,
        partName: inv.item?.partName || inv.item?.name || "Unknown",
        partNumber: inv.item?.partNumber || inv.item?.code || "",
        brand: inv.item?.brand || "",
        type: inv.item?.type || "FIXED",
        code: inv.item?.code || "",
        sellingPrice: inv.item?.sellingPrice || 0,
        buyingPrice: inv.item?.buyingPrice || 0,
        image: inv.item?.image || null,
      }));

      setProducts(productList);
      setPaymentMethods(paymentData);
      setCustomers(customerData);
    } catch (err: any) {
      console.error("Error loading initial data:", err);
      addToast("error", "Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const inventoryData = await inventoryAPI.getAll();
      const productList: Product[] = inventoryData.map((inv: any) => ({
        id: inv.item?.id,
        partName: inv.item?.partName || inv.item?.name || "Unknown",
        partNumber: inv.item?.partNumber || inv.item?.code || "",
        brand: inv.item?.brand || "",
        type: inv.item?.type || "FIXED",
        code: inv.item?.code || "",
        sellingPrice: inv.item?.sellingPrice || 0,
        buyingPrice: inv.item?.buyingPrice || 0,
        image: inv.item?.image || null,
      }));
      setProducts(productList);
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      addToast("error", "Failed to load inventory");
    }
  }, []);

  // Search products
  const handleSearch = useCallback(
    async (keyword: string) => {
      setSearchTerm(keyword);
      if (!keyword.trim()) {
        loadInventory();
        setShowProducts(false);
        return;
      }

      try {
        const results: Item[] = await itemAPI.search(keyword);
        const productsWithPrice: Product[] = results.map((item) => ({
          id: item.id,
          partName: item.partName || item.name || "Unknown",
          partNumber: item.partNumber || item.code || "",
          brand: item.brand || "",
          type: item.type || "FIXED",
          code: item.code || "",
          sellingPrice: item.sellingPrice || 0,
          buyingPrice: item.buyingPrice || 0,
          image: item.image || undefined,
        }));
        setProducts(productsWithPrice);
        setShowProducts(true);
      } catch (err: any) {
        console.error("Search error:", err);
        addToast("error", "Product not found");
      }
    },
    [loadInventory]
  );

  // Scan barcode
  const handleScan = useCallback(
    async (scannedBarcode: string) => {
      if (!scannedBarcode.trim()) return;

      try {
        const cartItemDto: ScanCartItemDto = await scanAPI.scan(
          scannedBarcode
        );

        const newItem: CartItem = {
          id: cartItemDto.productId,
          partName: cartItemDto.productName,
          partNumber: cartItemDto.productSku,
          brand: "",
          code: cartItemDto.productSku,
          type:
            cartItemDto.quantity > 1 &&
            cartItemDto.quantity !== Math.floor(cartItemDto.quantity)
              ? "WEIGHED"
              : "FIXED",
          sellingPrice: cartItemDto.unitPrice,
          buyingPrice: 0,
          image: undefined,
          qty: cartItemDto.quantity,
        };

        setCart((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === newItem.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              qty: updated[existingIndex].qty + newItem.qty,
            };
            return updated;
          }
          return [...prev, newItem];
        });

        setBarcode("");
        addToast(
          "success",
          `Added ${newItem.partName} (${newItem.qty}${newItem.type === "WEIGHED" ? "kg" : "pcs"})`
        );
        barcodeInputRef.current?.focus();
      } catch (err: any) {
        console.error("Scan error:", err);
        addToast("error", "Product not found - invalid barcode");
        setBarcode("");
        barcodeInputRef.current?.focus();
      }
    },
    []
  );

  // Calculate totals
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.sellingPrice * item.qty, 0),
    [cart]
  );

  const cartItemCount = useMemo(() => cart.length, [cart]);

  const changeQty = useCallback((id: number, change: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const step = item.type === "WEIGHED" ? 0.001 : 0.5;
            const newQty = Math.round((item.qty + change) * 1000) / 1000;
            if (newQty <= 0) return null;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [{ ...product, qty: 1 }, ...prev];
      }
    });
    addToast("success", `Added ${product.partName} to cart`);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPhone("");
    setCashGiven("");
    setBarcode("");
    setSelectedCustomer(null);
    setCreditSummary(null);
    setCustomerQuery("");
    setNewCustomerMode(false);
  }, []);

  // Payment method lookup
  const getPaymentMethodId = (name: string): number => {
    const found = paymentMethods.find(
      (pm) => pm.name.toLowerCase() === name.toLowerCase()
    );
    if (!found) {
      throw new Error(`Payment method "${name}" not found`);
    }
    return found.id!;
  };

  // Get cashier name
  const getCashierName = () => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return "Cashier";
      const parsed = JSON.parse(rawUser);
      return parsed?.name?.split(" ")[0] || "Cashier";
    } catch {
      return "Cashier";
    }
  };

  // Fetch credit summary whenever "credit" is selected + a customer is chosen
  useEffect(() => {
    if (paymentMethod === "credit" && selectedCustomer) {
      setLoadingCreditSummary(true);
      customerAPI
        .getCreditSummary(selectedCustomer.id)
        .then(setCreditSummary)
        .catch(() => setCreditSummary(null))
        .finally(() => setLoadingCreditSummary(false));
    } else {
      setCreditSummary(null);
    }
  }, [paymentMethod, selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerQuery]);

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      addToast("error", "Name and phone are required");
      return;
    }
    try {
      const created = await customerAPI.create({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
      });
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomer(created);
      setNewCustomerMode(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      addToast("success", `Customer ${created.name} added`);
    } catch (err: any) {
      addToast("error", err.message || "Failed to add customer");
    }
  }, [newCustomerName, newCustomerPhone, addToast]);

  // Build receipt
  const buildReceiptPayload = (sale: Sale): ReceiptPayload => {
    const receiptDate = new Date();
    const amountReceived =
      paymentMethod === "cash" ? Number(cashGiven) || total : total;
    const changeAmount = Math.max(0, amountReceived - total);

    return {
      storeName: "GARAGE POSIS",
      tagline: "Great Service, Happy customer",
      address: "Nairobi, Kenya",
      createdAt: receiptDate.toLocaleString(),
      receiptNumber: String(sale.id),
      paymentMethod:
        paymentMethod === "mpesa" ? "M-Pesa" : paymentMethod === "credit" ? "Credit" : "Cash",
      phone: paymentMethod === "mpesa" && phone ? phone : undefined,
      cashierName: getCashierName(),
      items: cart.map((item) => ({
        name: item.partName,
        qty: item.qty,
        unitPrice: item.sellingPrice,
        lineTotal: item.sellingPrice * item.qty,
        unitLabel: item.type === "WEIGHED" ? "kg" : "pcs",
      })),
      subtotal: total,
      amountPaid: paymentMethod === "credit" ? 0 : amountReceived,
      changeAmount: paymentMethod === "credit" ? 0 : changeAmount,
      total,
    };
  };

  // Print receipt
  const printReceiptBrowser = (payload: ReceiptPayload) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      addToast("error", "Pop-up blocked! Please allow pop-ups to print.");
      return;
    }
    printWindow.document.write(buildBrowserReceiptHtml(payload));
    printWindow.document.close();
  };

  const printReceipt = async (payload: ReceiptPayload) => {
    if (printerSettings.mode === "browser") {
      printReceiptBrowser(payload);
      return;
    }

    try {
      const rawReceipt = buildThermalReceiptText(
        payload,
        printerSettings.paperWidth
      );
      await sendRawPrintJob(rawReceipt, printerSettings);
    } catch (err: any) {
      if (printerSettings.fallbackToBrowser) {
        printReceiptBrowser(payload);
        addToast("error", `Thermal failed: ${err?.message || "unknown"}`);
        return;
      }
      addToast("error", `Print failed: ${err?.message || "Unable to print"}`);
    }
  };

  // Complete payment
  const completePayment = useCallback(async () => {
    if (cart.length === 0) {
      addToast("error", "Cart is empty!");
      return;
    }

    try {
      setProcessingPayment(true);

      if (paymentMethod === "mpesa") {
        if (!phone || phone.trim().length < 9) {
          addToast("error", "Valid phone number required for M-Pesa");
          setProcessingPayment(false);
          return;
        }

        const mpesaCheckoutRequest = {
          storeId: DEFAULT_STORE_ID,
          paymentMethodId: getPaymentMethodId("mpesa"),
          phone: phone,
          cartItems: cart.map((item) => ({
            itemId: item.id!,
            quantity: item.qty,
            unitPrice: item.sellingPrice,
          })),
        };

        const mpesaResponse = await saleAPI.checkoutWithMpesa(mpesaCheckoutRequest);
        const saleId = mpesaResponse.saleId;

        addToast("info", "STK push sent to your phone. Enter your M-Pesa PIN within 60 seconds...");

        let paymentConfirmed = false;
        let pollAttempts = 0;
        const maxAttempts = 10;

        while (!paymentConfirmed && pollAttempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 6000));

          try {
            const statusResponse = await saleAPI.getSaleStatus(saleId);
            const saleStatus = statusResponse.data?.status || statusResponse.data?.saleStatus;

            if (saleStatus === "PAID" || saleStatus === "mpesa") {
              paymentConfirmed = true;
              addToast("success", "Payment confirmed!");
              break;
            } else if (saleStatus === "FAILED" || saleStatus === "CANCELLED") {
              addToast("error", "Payment failed or was cancelled. Please try again.");
              setProcessingPayment(false);
              return;
            }
          } catch (err) {
            // Continue polling
          }

          pollAttempts++;
        }

        if (!paymentConfirmed) {
          addToast("error", "Payment timeout. Please check your M-Pesa account and try again.");
          setProcessingPayment(false);
          return;
        }

        const sale: Sale = await saleAPI.getById(saleId);
        const receiptPayload = buildReceiptPayload(sale);

        await printReceipt(receiptPayload);
        clearCart();
        setSearchTerm("");
        setShowProducts(false);
        await loadInitialData();
        barcodeInputRef.current?.focus();
      } else if (paymentMethod === "credit") {
        if (!selectedCustomer) {
          addToast("error", "Please select a customer for credit sale");
          setProcessingPayment(false);
          return;
        }

        const available = creditSummary ? creditSummary.availableCredit : 0;
        if (total > available) {
          addToast("error", `Credit limit exceeded. Available: Ksh ${available.toFixed(2)}`);
          setProcessingPayment(false);
          return;
        }

        const checkoutRequest: CheckoutRequest = {
          storeId: DEFAULT_STORE_ID,
          paymentMethodId: getPaymentMethodId("credit"),
          customerId: selectedCustomer.id,
          cartItems: cart.map((item) => ({
            itemId: item.id!,
            quantity: item.qty,
            unitPrice: item.sellingPrice,
          })),
        };

        const sale: Sale = await saleAPI.checkout(checkoutRequest);
        const receiptPayload = buildReceiptPayload(sale);

        addToast("success", `Credit sale recorded! Order #${sale.id}`);
        await printReceipt(receiptPayload);

        clearCart();
        setSearchTerm("");
        setShowProducts(false);
        await loadInitialData();
        barcodeInputRef.current?.focus();
      } else {
        const checkoutRequest: CheckoutRequest = {
          storeId: DEFAULT_STORE_ID,
          paymentMethodId: getPaymentMethodId("cash"),
          cartItems: cart.map((item) => ({
            itemId: item.id!,
            quantity: item.qty,
            unitPrice: item.sellingPrice,
          })),
        };

        const sale: Sale = await saleAPI.checkout(checkoutRequest);
        const receiptPayload = buildReceiptPayload(sale);

        addToast("success", `Payment completed! Order #${sale.id}`);
        await printReceipt(receiptPayload);

        clearCart();
        setSearchTerm("");
        setShowProducts(false);
        await loadInitialData();
        barcodeInputRef.current?.focus();
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      const msg = err.message || "Payment failed. Please try again.";

      if (msg.toLowerCase().includes("stock") || msg.toLowerCase().includes("quantity")) {
        addToast("error", `Insufficient stock: ${msg}`);
      } else if (msg.toLowerCase().includes("credit limit")) {
        addToast("error", msg);
      } else if (err.status === 401 || err.status === 403) {
        addToast("error", "Authentication failed. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        addToast("error", msg);
      }
    } finally {
      setProcessingPayment(false);
    }
  }, [cart, paymentMethod, phone, cashGiven, total, selectedCustomer, creditSummary]);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = "/login";
  }, []);

  const creditBlocked =
    paymentMethod === "credit" &&
    (!selectedCustomer || (creditSummary ? total > creditSummary.availableCredit : true));

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600 text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
                <FaCashRegister className="text-lg text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">GARAGE POS</h1>
                <p className="text-xs text-gray-500">Point of Sale System</p>
              </div>
            </div>

            {/* Center: Cashier Info */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
              <FaUser className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{getCashierName()}</span>
            </div>

            {/* Right: Actions */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-900 font-medium text-sm transition-all duration-200"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cart & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div>
              <div className="relative">
                <FaBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, code, or barcode..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Search Results */}
            {showProducts && searchTerm && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {products.length} found
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-2">
                      Search Results
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowProducts(false);
                      setSearchTerm("");
                      loadInventory();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          addToCart(product);
                          setSearchTerm("");
                          setShowProducts(false);
                        }}
                        className="group p-3 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-lg transition-all duration-200 text-left"
                      >
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {product.partName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {product.code}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600">
                            Ksh {product.sellingPrice.toFixed(2)}
                          </span>
                          <FaPlus className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Shopping Cart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <FaShoppingCart className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Shopping Cart
                    </h2>
                    <p className="text-xs text-gray-500">
                      {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">
                    Ksh {total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto max-h-96">
                {cartItemCount === 0 ? (
                  <div className="h-48 flex items-center justify-center p-6">
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <FaShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-600">
                          Cart is empty
                        </p>
                        <p className="text-xs text-gray-500">
                          Scan items or search to add
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {cart.map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onChangeQty={changeQty}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItemCount > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={clearCart}
                    className="w-full py-2 text-xs font-medium text-gray-700 border border-gray-300 hover:border-red-300 hover:text-red-700 rounded-lg transition-all duration-200"
                  >
                    Clear Cart
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Payment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full sticky top-24">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <FaReceipt className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Payment</h2>
                  <p className="text-xs text-gray-500">Complete transaction</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Barcode Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Barcode Scanner
                  </label>
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onFocus={() => setActiveInput("barcode")}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleScan(barcode)
                      }
                      placeholder="Scan barcode..."
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400 text-sm"
                    />
                    <button
                      onClick={() => handleScan(barcode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <FaBarcode className="h-4 w-4 text-gray-400 hover:text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                        paymentMethod === "mpesa"
                          ? "border-emerald-300 bg-emerald-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg mx-auto w-fit mb-1 ${
                        paymentMethod === "mpesa"
                          ? "bg-emerald-200"
                          : "bg-gray-100"
                      }`}>
                        <FaPhone className={`h-4 w-4 ${
                          paymentMethod === "mpesa"
                            ? "text-emerald-600"
                            : "text-gray-600"
                        }`} />
                      </div>
                      <p className={`text-xs font-bold ${
                        paymentMethod === "mpesa"
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}>M-Pesa</p>
                      <p className="text-xs text-gray-500">Mobile</p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                        paymentMethod === "cash"
                          ? "border-emerald-300 bg-emerald-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg mx-auto w-fit mb-1 ${
                        paymentMethod === "cash"
                          ? "bg-emerald-200"
                          : "bg-gray-100"
                      }`}>
                        <FaMoneyBillWave className={`h-4 w-4 ${
                          paymentMethod === "cash"
                            ? "text-emerald-600"
                            : "text-gray-600"
                        }`} />
                      </div>
                      <p className={`text-xs font-bold ${
                        paymentMethod === "cash"
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}>Cash</p>
                      <p className="text-xs text-gray-500">Physical</p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("credit")}
                      className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                        paymentMethod === "credit"
                          ? "border-emerald-300 bg-emerald-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg mx-auto w-fit mb-1 ${
                        paymentMethod === "credit"
                          ? "bg-emerald-200"
                          : "bg-gray-100"
                      }`}>
                        <FaCreditCard className={`h-4 w-4 ${
                          paymentMethod === "credit"
                            ? "text-emerald-600"
                            : "text-gray-600"
                        }`} />
                      </div>
                      <p className={`text-xs font-bold ${
                        paymentMethod === "credit"
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}>Credit</p>
                      <p className="text-xs text-gray-500">On account</p>
                    </button>
                  </div>
                </div>

                {/* Payment Input */}
                {paymentMethod === "mpesa" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setActiveInput("phone")}
                      placeholder="07XXXXXXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400 text-sm"
                    />
                  </div>
                ) : paymentMethod === "credit" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Customer
                    </label>

                    {selectedCustomer ? (
                      <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                          <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Change
                        </button>
                      </div>
                    ) : newCustomerMode ? (
                      <div className="space-y-2 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="text"
                          placeholder="Customer name"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateCustomer}
                            className="flex-1 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Save Customer
                          </button>
                          <button
                            onClick={() => setNewCustomerMode(false)}
                            className="flex-1 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search customer by name or phone..."
                            value={customerQuery}
                            onChange={(e) => {
                              setCustomerQuery(e.target.value);
                              setShowCustomerDropdown(true);
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          {showCustomerDropdown && customerQuery && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {filteredCustomers.length === 0 ? (
                                <p className="p-3 text-xs text-gray-500">No customers found</p>
                              ) : (
                                filteredCustomers.map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      setSelectedCustomer(c);
                                      setShowCustomerDropdown(false);
                                      setCustomerQuery("");
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm"
                                  >
                                    <span className="font-medium text-gray-900">{c.name}</span>
                                    <span className="text-gray-500 ml-2">{c.phone}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setNewCustomerMode(true)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <FaUserPlus className="h-3 w-3" /> Add new customer
                        </button>
                      </div>
                    )}

                    {selectedCustomer && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        {loadingCreditSummary ? (
                          <p className="text-xs text-gray-500">Loading credit info...</p>
                        ) : creditSummary ? (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Credit Limit</span>
                              <span className="font-medium text-gray-900">Ksh {creditSummary.creditLimit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Outstanding</span>
                              <span className="font-medium text-red-600">Ksh {creditSummary.outstandingBalance.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                              <span className="text-gray-700 font-semibold">Available</span>
                              <span className={`font-bold ${creditSummary.availableCredit >= total ? "text-emerald-600" : "text-red-600"}`}>
                                Ksh {creditSummary.availableCredit.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No credit info available</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Amount Received
                    </label>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      onFocus={() => setActiveInput("cash")}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400 text-sm"
                    />

                    {/* Change */}
                    {cashGiven && Number(cashGiven) > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-600">Change Due</div>
                          <div className="text-lg font-bold text-emerald-600">
                            Ksh {Math.max(0, Number(cashGiven) - total).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                {cartItemCount > 0 && (
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        Ksh {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Tax (0%)</span>
                      <span className="font-medium text-gray-900">Ksh 0.00</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-emerald-600">
                        Ksh {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Complete Payment Button */}
                <button
                  onClick={completePayment}
                  disabled={processingPayment || cartItemCount === 0 || creditBlocked}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    processingPayment || cartItemCount === 0 || creditBlocked
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg active:scale-95"
                  }`}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaReceipt className="h-4 w-4" />
                      <span>Complete Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CartItemRow Component
 */
function CartItemRow({
  item,
  onChangeQty,
  onRemove,
}: {
  item: CartItem;
  onChangeQty: (id: number, change: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <span className="text-lg">📦</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {item.partName}
          </h4>
          <p className="text-xs text-gray-500 truncate">{item.partNumber}</p>
        </div>

        {/* Qty Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onChangeQty(item.id, -1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <FaChevronDown className="h-3 w-3" />
          </button>

          <input
            type="number"
            step="0.01"
            min="0.01"
            value={item.qty}
            readOnly
            className="w-12 text-center px-2 py-1 text-xs font-bold border border-gray-300 rounded-lg text-gray-900 bg-gray-50"
          />

          <button
            onClick={() => onChangeQty(item.id, 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-all duration-200"
          >
            <FaChevronUp className="h-3 w-3" />
          </button>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0 min-w-20">
          <div className="text-xs text-gray-500">
            Ksh {item.sellingPrice.toFixed(2)}
          </div>
          <div className="text-sm font-bold text-emerald-600">
            Ksh {(item.sellingPrice * item.qty).toFixed(2)}
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-1"
        >
          <FaTrash className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
        </button>
      </div>
    </div>
  );
}