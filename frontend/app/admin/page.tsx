'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '../../lib/api';

// Admin feature card component
const AdminFeatureCard = ({ title, description, icon, link }: { 
  title: string; 
  description: string; 
  icon: string; 
  link: string;
}) => (
  <Link href={link} className="block">
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 h-full">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <span className="text-blue-600 text-xl">{icon}</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  </Link>
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in and is an admin
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Decode token to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const adminFeatures = [
    {
      title: 'Credit Cards',
      description: 'Manage credit cards, their details, and reward rules',
      icon: '💳',
      link: '/admin/credit-cards'
    },
    {
      title: 'Banks',
      description: 'Manage banks and their information',
      icon: '🏦',
      link: '/admin/banks'
    },
    {
      title: 'Categories',
      description: 'Manage spending categories and subcategories',
      icon: '📊',
      link: '/admin/categories'
    },
    {
      title: 'Reward Rules',
      description: 'Manage reward rules across all credit cards',
      icon: '🎁',
      link: '/admin/reward-rules'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminFeatures.map((feature, index) => (
            <AdminFeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              link={feature.link}
            />
          ))}
        </div>
      </main>
    </div>
  );
} 