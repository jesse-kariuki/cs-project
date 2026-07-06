/**
 * Token Management Utility
 * 
 * Ensures:
 * - Only ONE valid token is stored at a time
 * - Clean localStorage on every login
 * - Consistent key naming (accessToken)
 * - Automatic token validation
 */

// Define storage keys (single source of truth)
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  // Legacy keys to clean up
  LEGACY_KEYS: ['token', 'jwt', 'auth_token', 'authToken', 'Token', 'JWT']
} as const;

/**
 * Clean up ALL tokens from localStorage
 * Removes both current and legacy keys
 */
export const clearAllTokens = () => {
  // Remove current keys
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER);

  // Remove any legacy keys that might exist
  TOKEN_KEYS.LEGACY_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('✓ All tokens cleared from localStorage');
};

/**
 * Set new tokens (only)
 * Clears old tokens first to ensure only new ones are stored
 */
export const setTokens = (accessToken: string, refreshToken?: string) => {
  // CRITICAL: Clear all old tokens first
  clearAllTokens();

  // Then set new ones
  if (accessToken) {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    console.log('✓ Access token stored');
  }

  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    console.log('✓ Refresh token stored');
  }
};

/**
 * Get the current access token
 * ONLY checks for the correct key
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  return token || null;
};

/**
 * Get the refresh token
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  return token || null;
};

/**
 * Check if token exists
 */
export const hasAccessToken = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Decode JWT token (without verification - client-side only)
 */
export const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token?: string): boolean => {
  const tokenToCheck = token || getAccessToken();
  if (!tokenToCheck) return true;

  try {
    const decoded = decodeToken(tokenToCheck);
    if (!decoded || !decoded.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    // Consider token expired if less than 1 minute remaining
    const isExpired = currentTime >= expirationTime - 60000;

    if (isExpired) {
      console.warn('⚠ Token is expired or about to expire');
    }

    return isExpired;
  } catch (e) {
    console.error('Failed to check token expiration:', e);
    return true;
  }
};

/**
 * Get auth headers for API requests
 * Ensures only current token is used
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();

  if (!token) {
    console.warn('⚠ No access token available');
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Store user info
 */
export const setUser = (user: any) => {
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  console.log('✓ User info stored');
};

/**
 * Get stored user info
 */
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(TOKEN_KEYS.USER);
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

/**
 * Logout: clear everything
 */
export const logout = () => {
  clearAllTokens();
  console.log('✓ User logged out');
};

/**
 * Debug function: show what's in localStorage
 */
export const debugTokenStorage = () => {
  console.group('🔐 Token Storage Debug');
  console.log('Access Token:', getAccessToken() ? '✓ Present' : '✗ Missing');
  console.log('Refresh Token:', getRefreshToken() ? '✓ Present' : '✗ Missing');
  console.log('User:', getUser() ? '✓ Present' : '✗ Missing');
  console.log('Access Token Expired:', isTokenExpired());

  // Show decoded token info
  const token = getAccessToken();
  if (token) {
    const decoded = decodeToken(token);
    if (decoded) {
      console.log('Token Exp:', new Date(decoded.exp * 1000).toISOString());
      console.log('Token Sub:', decoded.sub);
      console.log('Token Iss:', decoded.iss);
    }
  }

  console.groupEnd();
};

export default {
  clearAllTokens,
  setTokens,
  getAccessToken,
  getRefreshToken,
  hasAccessToken,
  decodeToken,
  isTokenExpired,
  getAuthHeaders,
  setUser,
  getUser,
  logout,
  debugTokenStorage,
};