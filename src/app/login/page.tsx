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

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
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
    </div>
  );
}