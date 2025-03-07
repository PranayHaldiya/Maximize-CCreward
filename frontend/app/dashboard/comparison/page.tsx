'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '../../components/DashboardNav';
import { getAllCreditCards, getToken } from '../../../lib/api';

interface Bank {
  id: string;
  name: string;
  logo: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface RewardRule {
  id: string;
  creditCardId: string;
  categoryId: string;
  category: Category;
  subCategoryId?: string;
  subCategory?: SubCategory;
  rewardType: 'CASHBACK' | 'POINTS' | 'MILES';
  rewardValue: number;
  transactionType: 'ONLINE' | 'OFFLINE' | 'BOTH';
  monthlyCap?: number;
  minimumSpend?: number;
}

interface CreditCard {
  id: string;
  name: string;
  bank: Bank;
  annualFee?: number;
  rewardRules: RewardRule[];
}

export default function ComparisonPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<(string | null)[]>([null, null, null]);
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

        // Fetch all credit cards
        const allCards = await getAllCreditCards();
        setCards(allCards || []);

      } catch (err) {
        console.error('Error fetching credit cards:', err);
        setError('Failed to load credit card data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCardSelection = (index: number, cardId: string) => {
    const newSelectedCards = [...selectedCards];
    newSelectedCards[index] = cardId;
    setSelectedCards(newSelectedCards);
  };

  // Get a card by ID
  const getCardById = (cardId: string | null) => {
    if (!cardId) return null;
    return cards.find(card => card.id === cardId) || null;
  };

  // Get all unique categories from selected cards
  const getUniqueCategories = () => {
    const categories = new Map<string, Category>();
    
    selectedCards.forEach(cardId => {
      if (!cardId) return;
      
      const card = getCardById(cardId);
      if (!card || !card.rewardRules) return;
      
      card.rewardRules.forEach(rule => {
        if (rule.category) {
          categories.set(rule.category.id, rule.category);
        }
      });
    });
    
    return Array.from(categories.values());
  };

  // Get the best reward for a category
  const getBestRewardForCategory = (categoryId: string) => {
    const results: (RewardRule | null)[] = [];
    
    for (let i = 0; i < selectedCards.length; i++) {
      const cardId = selectedCards[i];
      if (!cardId) {
        results.push(null);
        continue;
      }
      
      const card = getCardById(cardId);
      if (!card || !card.rewardRules) {
        results.push(null);
        continue;
      }
      
      // Find the best reward rule for this category
      let bestRule: RewardRule | null = null;
      let bestValue = 0;
      
      card.rewardRules.forEach(rule => {
        if (rule.categoryId === categoryId && rule.rewardValue > bestValue) {
          bestRule = rule;
          bestValue = rule.rewardValue;
        }
      });
      
      results.push(bestRule);
    }
    
    return results;
  };

  // Format reward value
  const formatRewardValue = (rule: RewardRule | null) => {
    if (!rule) return 'N/A';
    
    if (rule.rewardType === 'CASHBACK') {
      return `${rule.rewardValue}%`;
    } else if (rule.rewardType === 'POINTS') {
      return `${rule.rewardValue}x points`;
    } else {
      return `${rule.rewardValue}x miles`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardNav activePage="comparison" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        </main>
      </div>
    );
  }

  const uniqueCategories = getUniqueCategories();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardNav activePage="comparison" />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Card Comparison</h1>
          <p className="text-gray-600 dark:text-gray-400">Compare rewards across different credit cards</p>
        </div>

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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Cards to Compare</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((index) => (
              <div key={index} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Card {index + 1}
                </label>
                <select
                  value={selectedCards[index] || ''}
                  onChange={(e) => handleCardSelection(index, e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a card</option>
                  {cards && cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.bank.name} - {card.name}
                    </option>
                  ))}
                </select>
                
                {selectedCards[index] && (
                  <div className="mt-2 p-3 border dark:border-gray-600 rounded-md dark:bg-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {getCardById(selectedCards[index])?.bank?.logo ? (
                          <img 
                            src={getCardById(selectedCards[index])?.bank?.logo || ''} 
                            alt={getCardById(selectedCards[index])?.bank?.name || ''} 
                            className="h-8 w-8 rounded-full" 
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {getCardById(selectedCards[index])?.bank?.name?.substring(0, 2).toUpperCase() || 'CC'}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{getCardById(selectedCards[index])?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getCardById(selectedCards[index])?.bank?.name}</p>
                      </div>
                    </div>
                    {getCardById(selectedCards[index])?.annualFee !== undefined && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Annual Fee: ₹{getCardById(selectedCards[index])?.annualFee?.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedCards.some(id => id) && uniqueCategories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reward Comparison by Category</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      {selectedCards.map((cardId, index) => (
                        cardId && (
                          <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {getCardById(cardId)?.name}
                          </th>
                        )
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {uniqueCategories.map((category) => {
                      const rewards = getBestRewardForCategory(category.id);
                      return (
                        <tr key={category.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </td>
                          {rewards.map((reward, index) => (
                            selectedCards[index] && (
                              <td key={index} className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${
                                  reward?.rewardType === 'CASHBACK' ? 'text-green-600 dark:text-green-400' :
                                  reward?.rewardType === 'POINTS' ? 'text-blue-600 dark:text-blue-400' :
                                  reward?.rewardType === 'MILES' ? 'text-purple-600 dark:text-purple-400' :
                                  'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatRewardValue(reward)}
                                </div>
                                {reward?.monthlyCap && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Cap: ₹{reward.monthlyCap.toLocaleString()}/month
                                  </div>
                                )}
                                {reward?.minimumSpend && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Min: ₹{reward.minimumSpend.toLocaleString()}
                                  </div>
                                )}
                              </td>
                            )
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!selectedCards.some(id => id) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Cards to Compare</h3>
            <p className="text-gray-500 mb-4">Choose at least one card to see the comparison</p>
          </div>
        )}

        {selectedCards.some(id => id) && uniqueCategories.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-500 mb-4">The selected cards don't have any reward categories to compare</p>
          </div>
        )}
      </main>
    </div>
  );
} 