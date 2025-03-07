'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../../lib/api';

interface Bank {
  id: string;
  name: string;
  logo: string | null;
}

interface RewardRule {
  id: string;
  categoryId: string;
  category: {
    name: string;
  };
  subCategoryId?: string;
  subCategory?: {
    name: string;
  };
  rewardType: string;
  rewardValue: number;
  transactionType: string;
  monthlyCap?: number;
  minimumSpend?: number;
}

interface CreditCard {
  id: string;
  name: string;
  bank: Bank;
  image: string | null;
  annualFee: number;
  rewardType: string;
  rewardRules: RewardRule[];
}

export default function CreditCardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const creditCardId = params.id;
  
  const [creditCard, setCreditCard] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
      
      // Fetch credit card details
      fetchCreditCard();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router, creditCardId]);
  
  const fetchCreditCard = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const data = await apiRequest(`/api/credit-cards/${creditCardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!data || !data.id) {
        throw new Error('Invalid credit card data received');
      }
      
      console.log('Credit card data:', data);
      setCreditCard(data);
      
    } catch (err) {
      console.error('Error fetching credit card:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credit card data');
    } finally {
      setLoading(false);
    }
  };
  
  // Format reward value based on reward type
  const formatRewardValue = (rewardType: string, value: number) => {
    switch (rewardType) {
      case 'CASHBACK':
        return `${value}% cashback`;
      case 'POINTS':
        return `${value} points per $1`;
      case 'MILES':
        return `${value} miles per $1`;
      default:
        return `${value}`;
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/admin/credit-cards" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Credit Cards
          </Link>
        </div>
      </div>
    );
  }
  
  if (!creditCard) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Credit Card Not Found</h1>
          <p className="text-gray-700 mb-4">The requested credit card could not be found.</p>
          <Link href="/admin/credit-cards" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Credit Cards
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/admin/credit-cards" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Credit Cards
        </Link>
        
        <div className="flex space-x-3">
          <Link 
            href={`/admin/credit-cards/${creditCardId}/rewards`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Reward Rules
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Card Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                {creditCard.bank?.logo ? (
                  <img 
                    src={creditCard.bank.logo} 
                    alt={creditCard.bank.name} 
                    className="h-8 w-8 mr-3 rounded-full bg-white p-0.5" 
                  />
                ) : (
                  <div className="h-8 w-8 mr-3 rounded-full bg-white flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-800">
                      {creditCard.bank?.name?.substring(0, 1).toUpperCase() || 'B'}
                    </span>
                  </div>
                )}
                <p className="text-lg text-blue-100">{creditCard.bank?.name}</p>
              </div>
              <h1 className="text-3xl font-bold">{creditCard.name}</h1>
            </div>
            {creditCard.image && (
              <div className="w-32 h-20 bg-white rounded p-2 flex items-center justify-center">
                <img src={creditCard.image} alt={`${creditCard.name} card`} className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>
        
        {/* Card Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Card Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 block">Bank:</span>
                  <span className="font-medium">{creditCard.bank?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Annual Fee:</span>
                  <span className="font-medium">${creditCard.annualFee}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Reward Type:</span>
                  <span className="font-medium">{creditCard.rewardType}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">ID:</span>
                  <span className="font-medium text-sm text-gray-500">{creditCard.id}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Reward Rules</h2>
              {creditCard.rewardRules && creditCard.rewardRules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reward
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {creditCard.rewardRules.map(rule => (
                        <tr key={rule.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {rule.category?.name}
                            {rule.subCategory && ` > ${rule.subCategory.name}`}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {formatRewardValue(rule.rewardType, rule.rewardValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No reward rules found for this card.</p>
                  <Link 
                    href={`/admin/credit-cards/${creditCardId}/rewards`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Reward Rules
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 