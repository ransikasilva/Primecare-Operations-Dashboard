"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Shield,
  Globe,
  Activity
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOTP, setResetOTP] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { login, logout } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      // Validate user type - only allow operations users
      const userData = result?.data?.user;
      if (userData?.user_type !== 'operations') {
        setError('Access denied. This dashboard is only for operations team members.');
        await logout(); // Clear the invalid session
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOTP = async () => {
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (data.success) {
        setResetSuccess('Reset code sent to your email!');
        setForgotPasswordStep('otp');
      } else {
        setResetError(data.error?.message || 'Failed to send reset code');
      }
    } catch (error) {
      setResetError('Failed to send reset code. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOTP })
      });

      const data = await response.json();

      if (data.success) {
        setResetToken(data.data.resetToken);
        setResetSuccess('Code verified! Now set your new password.');
        setForgotPasswordStep('reset');
      } else {
        setResetError(data.error?.message || 'Invalid or expired code');
      }
    } catch (error) {
      setResetError('Failed to verify code. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          resetToken: resetToken,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setResetSuccess('Password reset successfully! You can now login.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep('email');
          setResetEmail('');
          setResetOTP('');
          setNewPassword('');
          setConfirmPassword('');
          setResetToken('');
        }, 2000);
      } else {
        setResetError(data.error?.message || 'Failed to reset password');
      }
    } catch (error) {
      setResetError('Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo & Title */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center relative overflow-hidden bg-white"
                style={{
                  boxShadow: '0 12px 40px rgba(78, 205, 196, 0.4)'
                }}
              >
                <img
                  src="/logo.png"
                  alt="TransFleet Logo"
                  className="w-14 h-14 object-contain"
                />
              </div>
              <div>
                <h1
                  className="text-3xl font-bold tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  TransFleet
                </h1>
                <p className="text-lg font-medium" style={{ color: '#64748b' }}>
                  Operations Dashboard
                </p>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome back to Operations
              </h2>
              <p className="text-gray-600">
                Sign in to access the system-wide management dashboard
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div 
                className="p-4 rounded-2xl text-red-800 text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  placeholder="admin@primecare.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border-0 text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 group"
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                  : 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                boxShadow: loading 
                  ? 'none'
                  : '0 8px 32px rgba(78, 205, 196, 0.4)',
                transform: loading ? 'none' : 'translateY(0)',
              }}
            >
              <span>{loading ? 'Signing in...' : 'Sign in to Operations'}</span>
              {!loading && (
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact system administrator
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div 
        className="hidden lg:flex lg:flex-1 flex-col justify-center items-center px-12"
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
        }}
      >
        <div className="text-center text-white max-w-lg">
          <div className="mb-12">
            <Globe className="w-24 h-24 mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl font-bold mb-4">
              System-Wide Operations
            </h2>
            <p className="text-xl opacity-90 leading-relaxed">
              Manage 25+ hospital networks, 847 riders, and 156 collection centers across Sri Lanka
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: Shield, title: 'Final Approvals', subtitle: 'Secondary approval workflow' },
              { icon: Activity, title: 'SLA Monitoring', subtitle: 'National compliance tracking' },
              { icon: Globe, title: 'Network Oversight', subtitle: 'System-wide management' }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm opacity-80">{feature.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordStep('email');
                setResetError('');
                setResetSuccess('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Password</h2>

            {resetError && (
              <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm mb-4">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-4 rounded-xl bg-green-50 text-green-800 text-sm mb-4">
                {resetSuccess}
              </div>
            )}

            {/* Step 1: Enter Email */}
            {forgotPasswordStep === 'email' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Enter your email address and we'll send you a verification code.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="admin@primecare.com"
                  />
                </div>
                <button
                  onClick={handleSendResetOTP}
                  disabled={resetLoading || !resetEmail}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {/* Step 2: Enter OTP */}
            {forgotPasswordStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit code sent to <strong>{resetEmail}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={resetOTP}
                    onChange={(e) => setResetOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={resetLoading || resetOTP.length !== 6}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50"
                >
                  {resetLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => setForgotPasswordStep('email')}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to email
                </button>
              </div>
            )}

            {/* Step 3: Set New Password */}
            {forgotPasswordStep === 'reset' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Create a new password for your account
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Re-enter your password"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || !newPassword || !confirmPassword}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}