import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const authState = localStorage.getItem('auth_state');
    if (authState) {
      try {
        const { accessToken } = JSON.parse(authState);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error('Failed to read auth state:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retrying, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authState = localStorage.getItem('auth_state');
        if (authState) {
          const { refreshToken } = JSON.parse(authState);
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { accessToken } = response.data.data;

          // Update auth state
          const updated = JSON.parse(authState);
          updated.accessToken = accessToken;
          localStorage.setItem('auth_state', JSON.stringify(updated));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth_state');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
