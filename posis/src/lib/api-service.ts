/**
 * API Service for Garage POS System
 * Centralized API calls to Spring Boot backend
 * 
 * Uses TokenManager for consistent token handling:
 * - Only uses 'accessToken' key in localStorage
 * - Clears all old tokens on login
 * - Validates token before each request
 */

import {
  clearAllTokens,
  setTokens,
  getAccessToken,
  getRefreshToken,
  getAuthHeaders,
  setUser,
  getUser,
  logout,
  isTokenExpired,
  debugTokenStorage,
} from '@/src/lib/token-manager';



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';


export const authAPI = {

  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        let errorMessage = `Login failed (${response.status})`;
        try {
          const errorJson = JSON.parse(rawText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (rawText) errorMessage = rawText;
        }
        throw new Error(errorMessage);
      }

      if (!rawText) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${rawText.slice(0, 100)}`);
      }

      if (result.data?.accessToken) {
        setTokens(result.data.accessToken, result.data.refreshToken);
        setUser({
          username: result.data.user?.username,
          role: result.data.user?.role,
        });
        console.log('✓ Login successful - tokens refreshed');
      } else {
        throw new Error('No access token in response');
      }

      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },


  signup: async (username: string, password: string, role: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const result = await response.json();
    if (result.data?.accessToken) {
      setTokens(result.data.accessToken, result.data.refreshToken);
      setUser({
        username: result.data.user?.username,
        role: result.data.user?.role,
      });
    }

    return result;
  },

  signup: async (
     email: string,
     username: string,
     phone: string,
     password: string,
     role: string = 'CASHIER'
   ) => {
     try {
       const response = await fetch(`${API_BASE_URL}/auth/signup`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           email,
           username,
           phone,
           password,
           role,
         }),
       });
  
       const rawText = await response.text();
  
       if (!response.ok) {
         let errorMessage = `Signup failed (${response.status})`;
         try {
           const errorJson = JSON.parse(rawText);
           errorMessage = errorJson.message || errorJson.error || errorMessage;
         } catch {
           if (rawText) errorMessage = rawText;
         }
         throw new Error(errorMessage);
       }
  
       if (!rawText) {
         throw new Error('Empty response from server');
       }
  
       let result;
       try {
         result = JSON.parse(rawText);
       } catch (e) {
         throw new Error(`Invalid JSON response: ${rawText.slice(0, 100)}`);
       }
  
       // Handle token storage (same as login)
       if (result.data?.accessToken) {
         setTokens(result.data.accessToken, result.data.refreshToken);
         setUser({
           email: result.data.user?.email,
           username: result.data.user?.username,
           role: result.data.user?.role,
         });
         console.log('✓ Signup successful - tokens stored');
       } else {
         throw new Error('No access token in response');
       }
  
       return result;
     } catch (error: any) {
       console.error('Signup error:', error);
       throw error;
     }
   },
  


  refresh: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available - please login again');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAllTokens();
      throw new Error('Token refresh failed - please login again');
    }

    const result = await response.json();
    if (result.data?.accessToken) {
      setTokens(result.data.accessToken, result.data.refreshToken);
      console.log('✓ Token refreshed');
    }

    return result;
  },


  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      logout(); 
      return response.ok;
    } catch (error) {
      logout();
      return true;
    }
  },
};



// 




// ============================================================================
// INVENTORY API (Updated)
// ============================================================================

export const inventoryAPI = {
  getAll: async (): Promise<Inventory[]> => {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    return response.json();
  },

  getByStore: async (storeId: number): Promise<Inventory[]> => {
    const response = await fetch(`${API_BASE_URL}/inventory/store/${storeId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch store inventory');
    }

    return response.json();
  },

  addStock: async (storeId: number, itemId: number, quantity: number): Promise<Inventory> => {
    const response = await fetch(
      `${API_BASE_URL}/inventory/add?storeId=${storeId}&itemId=${itemId}&quantity=${quantity}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add stock');
    }

    return response.json();
  },

  transferStock: async (
    fromStoreId: number,
    toStoreId: number,
    itemId: number,
    quantity: number
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/inventory/transfer?fromStoreId=${fromStoreId}&toStoreId=${toStoreId}&itemId=${itemId}&quantity=${quantity}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Transfer failed');
    }

    return response.json();
  },

  // Get inventory by store and item
  getByStoreAndItem: async (storeId: number, itemId: number): Promise<Inventory> => {
    const response = await fetch(`${API_BASE_URL}/inventory/store/${storeId}/item/${itemId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory item');
    }

    return response.json();
  },
};

// ============================================================================
// STORES API (Enhanced)
// ============================================================================

export const storeAPI = {
  getAll: async (): Promise<Store[]> => {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stores');
    }

    return response.json();
  },

  getById: async (id: number): Promise<Store> => {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Store not found');
    }

    return response.json();
  },

  create: async (storeData: { location: string }): Promise<Store> => {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create store');
    }

    return response.json();
  },

  update: async (id: number, storeData: { location: string }): Promise<Store> => {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      throw new Error('Failed to update store');
    }

    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete store');
    }
  },
};

// ============================================================================
// ITEMS API (Enhanced)
// ============================================================================

export const itemAPI = {
  getAll: async (): Promise<Item[]> => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }

    return response.json();
  },

  getById: async (id: number): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Item not found');
    }

    return response.json();
  },

  create: async (itemData: {
    partName: string;
    code?: string;
    partNumber: string;
    brand?: string;
    type?: string;
    buyingPrice?: number;
    sellingPrice?: number;
  }): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create item');
    }

    return response.json();
  },

  update: async (id: number, itemData: any): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      throw new Error('Failed to update item');
    }

    return response.json();
  },

  delete: async (id: number): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    return response.ok;
  },

  search: async (keyword: string): Promise<Item[]> => {
    const response = await fetch(
      `${API_BASE_URL}/items/search?keyword=${encodeURIComponent(keyword)}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return response.json();
  },
};



export const saleAPI = {
  checkout: async (checkoutData: {
    storeId: number;
    paymentMethodId: number;
    customerId?: number;
    cartItems: Array<{
      itemId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Checkout failed');
    }

    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sales');
    }

    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Sale not found');
    }

    return response.json();
  },

  getByDateRange: async (startDate: string, endDate: string) => {
    const response = await fetch(
      `${API_BASE_URL}/sales/by-date?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch sales');
    }

    return response.json();
  },

  getTodayTotal: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/today/total`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch today\'s total');
    }

    return response.json();
  },

  getMonthlyTotal: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/monthly/total`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch monthly total');
    }

    return response.json();
  },

  getTopSellingItems: async (limit: number = 5) => {
    const response = await fetch(
      `${API_BASE_URL}/sales/reports/top-selling`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch top-selling items');
    }

    return response.json();
  },

  getByStatus: async (status: string) => {
    const response = await fetch(`${API_BASE_URL}/sales/by-status/${status}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sales');
    }

    return response.json();
  },

  cancel: async (saleId: number) => {
    const response = await fetch(`${API_BASE_URL}/sales/${saleId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel sale');
    }

    return response.json();
  },

  checkoutWithMpesa: async (checkoutData: {
    storeId: number;
    paymentMethodId: number;
    phone: string;  // M-Pesa phone number
    cartItems: Array<{
      itemId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/sales/checkout/with-mpesa`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(checkoutData),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'M-Pesa checkout failed');
    }
  
    return response.json();
  },
  
  // New method: Poll payment status
  getSaleStatus: async (saleId: number) => {
      const response = await fetch(`${API_BASE_URL}/sales/${saleId}/status`, {
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        throw new Error('Failed to check sale status');
      }
  
      return response.json();
    },
};

// ============================================================================
// SUPPLY API (Stock Additions)
// ============================================================================

export const supplyAPI = {
  receive: async (deliveryData: {
    companyId: number;
    storeId: number;
    itemId: number;
    quantity: number;
    basePrice: number;
  }): Promise<Supply> => {
    const response = await fetch(`${API_BASE_URL}/supplies/receive`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        company: { id: deliveryData.companyId },
        store: { id: deliveryData.storeId },
        item: { id: deliveryData.itemId },
        quantity: deliveryData.quantity,
        basePrice: deliveryData.basePrice,
      }),
    });

    if (!response.ok) {
      let message = 'Failed to receive delivery';
      try {
        const err = await response.json();
        message = err.message || message;
      } catch {
        // response wasn't JSON
      }
      throw new Error(message);
    }

    return response.json();
  },

  getAll: async (): Promise<Supply[]> => {
    const response = await fetch(`${API_BASE_URL}/supplies`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch supply history');
    return response.json();
  },

  getByStore: async (storeId: number): Promise<Supply[]> => {
    const response = await fetch(`${API_BASE_URL}/supplies/store/${storeId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch supplies for store');
    return response.json();
  },

  getByCompany: async (companyId: number): Promise<Supply[]> => {
    const response = await fetch(`${API_BASE_URL}/supplies/company/${companyId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch supplies for company');
    return response.json();
  },
};
// ============================================================================
// COMPANIES API (Suppliers)
// ============================================================================

export const companyAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }

    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Company not found');
    }

    return response.json();
  },

  create: async (companyData: { name: string; phone: string }) => {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(companyData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create company');
    }

    return response.json();
  },
};

// ============================================================================
// CUSTOMERS API
// ============================================================================

export const customerAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }

    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Customer not found');
    }

    return response.json();
  },

  create: async (customerData: { name: string; phone: string }) => {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer');
    }

    return response.json();
  },

  getCreditSummary: async (id: number): Promise<CreditSummaryDto> => {
      const response = await fetch(`${API_BASE_URL}/customers/${id}/credit`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch credit summary');
      return response.json();
    },
  
    getAllCreditSummaries: async (): Promise<CreditSummaryDto[]> => {
      const response = await fetch(`${API_BASE_URL}/customers/credit`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch credit summaries');
      return response.json();
    },
  
    setCreditLimit: async (id: number, creditLimit: number): Promise<Customer> => {
      const response = await fetch(`${API_BASE_URL}/customers/${id}/credit-limit`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ creditLimit }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to set credit limit');
      }
      return response.json();
    },
};

// ============================================================================
// STORES API
// ============================================================================

// export const storeAPI = {
//   getAll: async () => {
//     const response = await fetch(`${API_BASE_URL}/stores`, {
//       headers: getAuthHeaders(),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to fetch stores');
//     }

//     return response.json();
//   },

//   create: async (storeData: { location: string }) => {
//     const response = await fetch(`${API_BASE_URL}/stores`, {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify(storeData),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || 'Failed to create store');
//     }

//     return response.json();
//   },
// };

// ============================================================================
// PAYMENT METHODS API
// ============================================================================

export const paymentAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    return response.json();
  },

  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/active`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active payment methods');
    }

    return response.json();
  },

  create: async (methodData: { name: string; isActive?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(methodData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment method');
    }

    return response.json();
  },

  toggleStatus: async (id: number, status: boolean) => {
    const response = await fetch(
      `${API_BASE_URL}/payments/${id}/toggle?status=${status}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle payment method');
    }

    return response.json();
  },
};

export const ledgerAPI = {
  recordCustomerPayment: async (payment: {
    customerId: number;
    paymentMethodId: number;
    amount: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/ledger/customer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payment),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to record payment');
    }
    return response.json();
  },

  getCustomerHistory: async (customerId: number) => {
    const response = await fetch(`${API_BASE_URL}/ledger/customer/${customerId}/history`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payment history');
    return response.json();
  },
};

// ============================================================================
// SCAN API
// ============================================================================

export const scanAPI = {
  scan: async (barcode: string) => {
    const response = await fetch(
      `${API_BASE_URL}/scan?barcode=${encodeURIComponent(barcode)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Scan failed');
    }

    return response.json();
  },

  validate: async (barcode: string) => {
    const response = await fetch(
      `${API_BASE_URL}/scan/validate?barcode=${encodeURIComponent(barcode)}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Validation failed');
    }

    return response.json();
  },

  generateWeighedBarcode: async (
    plu: string,
    weight: number,
    pricePerKg: number
  ) => {
    const response = await fetch(`${API_BASE_URL}/scan/generate-weighed`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plu, weight, pricePerKg }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate barcode');
    }

    return response.json();
  },
};

// ============================================================================
// REPORTS API
// ============================================================================

// export const reportAPI = {
//   getDashboardSummary: async () => {
//     const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
//       headers: getAuthHeaders(),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to fetch dashboard summary');
//     }

//     return response.json();
//   },

//   getMonthlySummary: async (year: number, month: number) => {
//     const response = await fetch(
//       `${API_BASE_URL}/reports/monthly?year=${year}&month=${month}`,
//       { headers: getAuthHeaders() }
//     );

//     if (!response.ok) {
//       throw new Error('Failed to fetch monthly summary');
//     }

//     return response.json();
//   },

//   getAllTimeProfit: async () => {
//     const response = await fetch(`${API_BASE_URL}/reports/all-time-profit`, {
//       headers: getAuthHeaders(),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to fetch all-time profit');
//     }

//     return response.json();
//   },
// };

// ==========================================================================
// reports
//
export const reportAPI = {
  getMonthlyReport: async (year: number, month: number): Promise<MonthlyReportDto> => {
    const response = await fetch(
      `${API_BASE_URL}/reports/monthly?year=${year}&month=${month}`,
      { headers: getAuthHeaders() }
    );
 
    if (!response.ok) {
      throw new Error('Failed to fetch monthly report');
    }
 
    return response.json();
  },
 
  getAllTimeProfit: async (): Promise<ProductProfitDto[]> => {
    const response = await fetch(`${API_BASE_URL}/reports/profit`, {
      headers: getAuthHeaders(),
    });
 
    if (!response.ok) {
      throw new Error('Failed to fetch all-time profit');
    }
 
    return response.json();
  },
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: number;
  username: string;
  role: string;
  createdAt?: string;
}

export interface CheckoutRequest {
  storeId: number;
  paymentMethodId: number;
  customerId?: number;
  cartItems: Array<{
    itemId: number;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface Item {
  id: number;
  partName: string;
  partNumber: string;
  code?: string;
  brand?: string;
  type?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  image?: string;
  name?: string; 
}

export interface Inventory {
  id: number;
  store: Store;
  item: Item;
  quantity: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  creditLimit?: number;
}

export interface Sale {
  id: number;
  store: Store;
  customer?: Customer;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  amountPaid?: number;
  saleDate: string;
  status: 'PAID' | 'CREDIT' | 'FAILED' | 'CANCELLED';
  saleItems: SaleItem[];
}

export interface CreditSummaryDto {
  customerId: number;
  customerName: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  unpaidSales: {
    saleId: number;
    saleDate: string;
    totalAmount: number;
    amountPaid: number;
    balance: number;
  }[];
}

export interface SaleItem {
  id: number;
  item: Item;
  quantity: number;
  unitPrice: number;
}

export interface Supply {
  id: number;
  company: Company;
  store: Store;
  item: Item;
  quantity: number;
  basePrice: number;
  dateAdded: string;
}

export interface Company {
  id: number;
  name: string;
  phone: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
}

export interface Store {
  id: number;
  location: string;
}

export interface PaymentMethod {
  id?: number;
  name: string;
  isActive?: boolean;
}

export interface CartItemDto {
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: number;
}


export interface MonthlyReportDto {
 month: string;
 totalRevenue: number;
 totalCost: number;
 netProfit: number;
 overallMargin: number;
 productBreakdown: ProductProfitDto[];
 topPerformers: ProductProfitDto[];
 lossMakers: ProductProfitDto[];
}

export interface ProductProfitDto {
 productId: number;
 productName: string;
 productCode: string;
 totalCost: number;
 totalRevenue: number;
 profit: number;
 marginPercent: number;
 totalBought: number;
 buyingUnit: string;
 totalSold: number;
 sellingUnit: string;
 isLossMaking: boolean;
}

export interface ReceiptHeaderDto {
  printType: string;
  dateOfPurchase: string;
  customerName: string;
  phoneNumber: string;
  allTotal: number;
  paid: number;
  onCredit: number;
}
 
export interface ReceiptLineItemDto {
  dateOfCredit: string;
  partNumber: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
}
 
export interface ReceiptDto {
  header: ReceiptHeaderDto;
  lineItems: ReceiptLineItemDto[];
  totalAmount: number;
  totalItems: number;
}

// ============================================================================
// Debug Exports for development
// ============================================================================
export { debugTokenStorage, getAccessToken, getRefreshToken, isTokenExpired };