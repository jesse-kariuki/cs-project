'use client';

import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { authAPI } from '@/src/lib/api-service';
import { clearAllTokens } from '@/src/lib/token-manager';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    clearAllTokens();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result = await authAPI.login(username, password);
      setMessage(result.message || "Login successful! Redirecting...");
      setMessageType("success");

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUsername');
      }

      setTimeout(() => {
        const user = localStorage.getItem('user');
        let isAdmin = false;
        if (user) {
          try {
            const parsedUser = JSON.parse(user);
            isAdmin = parsedUser?.role?.includes('ADMIN') || false;
          } catch (e) {
            console.error('Failed to parse user:', e);
          }
        }
        window.location.href = isAdmin ? "/admin" : "/cashier";
      }, 1500);
    } catch (error: any) {
      console.error("Login error:", error);
      setMessage("Login failed. Please check your credentials.");
      setMessageType("error");
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://placehold.co/1440x1024)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 z-20"
            aria-label="Close"
          >
            <FaTimes size={24} />
          </button>

          {/* Content */}
          <div className="p-10 pt-16">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-3xl font-semibold text-gray-900 text-center">Sign in</h1>
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg text-sm font-medium text-center ${
                messageType === "success" 
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email/Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm text-gray-600 mb-2">
                  Username                </label>
                <input
                  type="text"
                  id="username"
                  placeholder=""
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm text-gray-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder=""
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 rounded-full transition-colors disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {/* Remember Me & Need Help */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-900">Remember me</span>
                </label>
                
              </div>
            </form>

            {/* Divider */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="text-gray-900 font-semibold hover:underline">
                  Sign up
                </a>
              </p>
            </div>

            {/* reCAPTCHA Notice */}
            
          </div>
        </div>
      </div>
    </div>
  );
}