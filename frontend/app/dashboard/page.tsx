'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '../components/DashboardNav';
import { getUserProfile, getUserCreditCards, getRewardSummary, getToken } from '../../lib/api';

// Types for our data
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Bank {
  id: string;
  name: string;
  logo: string | null;
}

interface CreditCard {
  id: string;
  name: string;
  bank: Bank;
  cardNumber: string | null;
  expiryDate: string | null;
  rewardBalance?: number;
  rewardType?: 'CASHBACK' | 'POINTS' | 'MILES';
  image?: string;
}

interface RewardSummary {
  totalCashback: number;
  totalPoints: number;
  totalMiles: number;
  byCategory: {
    categoryName: string;
    cashback: number;
    points: number;
    miles: number;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [rewardSummary, setRewardSummary] = useState<RewardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data
        const userData = await getUserProfile();
        setUser(userData || null);
        
        // Fetch user's credit cards
        const userCards = await getUserCreditCards();
        setCards(userCards || []);
        
        // Fetch reward summary
        try {
          const summary = await getRewardSummary();
          // Ensure the reward summary has all required properties
          const processedSummary = {
            totalCashback: summary?.totalCashback || 0,
            totalPoints: summary?.totalPoints || 0,
            totalMiles: summary?.totalMiles || 0,
            byCategory: summary?.byCategory || []
          };
          setRewardSummary(processedSummary);
        } catch (summaryError) {
          console.error('Error fetching reward summary:', summaryError);
          // Set a default reward summary with zero values
          setRewardSummary({
            totalCashback: 0,
            totalPoints: 0,
            totalMiles: 0,
            byCategory: []
          });
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        // Set default values for all state
        setUser(null);
        setCards([]);
        setRewardSummary({
          totalCashback: 0,
          totalPoints: 0,
          totalMiles: 0,
          byCategory: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Function to format reward value based on type
  const formatRewardValue = (card: CreditCard) => {
    if (!card || card.rewardBalance === undefined || card.rewardBalance === null) {
      return '0';
    }
    
    if (card.rewardType === 'CASHBACK') {
      return `$${card.rewardBalance.toFixed(2)}`;
    } else {
      return card.rewardBalance.toLocaleString();
    }
  };

  // Helper function to safely format numbers
  const safeToFixed = (value?: number | null, decimals: number = 2) => {
    if (value === undefined || value === null) return '0.00';
    return value.toFixed(decimals);
  };

  const safeToLocaleString = (value?: number | null) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardNav activePage="dashboard" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardNav activePage="dashboard" />
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's an overview of your credit cards and rewards.
          </p>
        </div>
        
        {/* Cards Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Credit Cards</h2>
            <button
              onClick={() => router.push('/dashboard/cards')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All Cards →
            </button>
          </div>
          
          {(cards && cards.length === 0) ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't added any credit cards yet.</p>
              <button
                onClick={() => router.push('/dashboard/cards')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Your First Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards && cards.slice(0, 3).map((card) => (
                <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className={`p-4 bg-gradient-to-r ${
                    card.rewardType === 'CASHBACK' ? 'from-green-500 to-green-700' : 
                    card.rewardType === 'POINTS' ? 'from-blue-500 to-blue-700' : 
                    'from-purple-500 to-purple-700'
                  } text-white`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          {card.bank?.logo ? (
                            <img 
                              src={card.bank.logo} 
                              alt={card.bank?.name || 'Bank'} 
                              className="h-6 w-6 mr-2 rounded-full bg-white dark:bg-gray-200 p-0.5" 
                            />
                          ) : (
                            <div className="h-6 w-6 mr-2 rounded-full bg-white dark:bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-800">
                                {card.bank?.name?.substring(0, 1).toUpperCase() || 'B'}
                              </span>
                            </div>
                          )}
                          <p className="text-xs font-medium">{card.bank?.name || 'Bank'}</p>
                        </div>
                        <h3 className="text-lg font-bold mt-1">{card.name}</h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-xs font-medium opacity-80">{card.rewardType || 'Rewards'}</p>
                        <p className="text-lg font-semibold">{formatRewardValue(card)}</p>
                      </div>
                    </div>
                    
                    {card.image && (
                      <div className="mt-4 flex justify-center">
                        <div className="h-12 bg-white dark:bg-gray-200 rounded p-1 flex items-center justify-center">
                          <img 
                            src={card.image} 
                            alt={`${card.name} card`} 
                            className="h-full object-contain" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Card Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {card.cardNumber ? `****${card.cardNumber.slice(-4)}` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Expiry</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {card.expiryDate || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Rewards Summary */}
        {rewardSummary && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rewards Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cashback Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Cashback</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Cashback
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{safeToFixed(rewardSummary.totalCashback)}
                </p>
              </div>

              {/* Points Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Points</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Points
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {safeToLocaleString(rewardSummary.totalPoints)}
                </p>
              </div>

              {/* Miles Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Miles</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Miles
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {safeToLocaleString(rewardSummary.totalMiles)}
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            {rewardSummary.byCategory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rewards by Category</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Cashback
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Points
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Miles
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {rewardSummary.byCategory.map((category, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {category.categoryName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ₹{safeToFixed(category.cashback)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {safeToLocaleString(category.points)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {safeToLocaleString(category.miles)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 