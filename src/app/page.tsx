"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while determining authentication state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{
            backgroundColor: '#4ECDC4',
            boxShadow: '0 12px 40px rgba(78, 205, 196, 0.4)'
          }}
        >
          <span className="text-white font-bold text-2xl">P</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#4ECDC4' }}></div>
        <p className="mt-4 text-gray-600">Loading TransFleet Operations...</p>
      </div>
    </div>
  );
}
