'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '../../components/DashboardNav';
import { getToken, getUserCreditCards, apiRequest } from '../../../lib/api';

interface Category {
  id: string;
  name: string;
  subCategories: {
    id: string;
    name: string;
  }[];
}

interface CreditCard {
  id: string;
  name: string;
  bank: {
    name: string;
  };
  rewardRules: {
    id: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
    subCategoryId?: string;
    subCategory?: {
      id: string;
      name: string;
    };
    rewardType: string;
    rewardValue: number;
    transactionType: string;
    monthlyCap?: number;
    minimumSpend?: number;
  }[];
}

interface CalculationResult {
  cardId: string;
  cardName: string;
  bankName: string;
  rewardRate: number;
  rewardAmount: number;
}

// Add a new interface for the user credit card data structure
interface UserCreditCardData {
  id?: string;
  creditCard?: {
    id: string;
    name: string;
    bank: {
      name: string;
    };
    rewardRules?: {
      id: string;
      categoryId: string;
      category: {
        id: string;
        name: string;
      };
      subCategoryId?: string;
      subCategory?: {
        id: string;
        name: string;
      };
      rewardType: string;
      rewardValue: number;
      transactionType: string;
      monthlyCap?: number;
      minimumSpend?: number;
    }[];
  };
  name?: string;
  bank?: {
    name: string;
  };
  rewardRules?: {
    id: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
    subCategoryId?: string;
    subCategory?: {
      id: string;
      name: string;
    };
    rewardType: string;
    rewardValue: number;
    transactionType: string;
    monthlyCap?: number;
    minimumSpend?: number;
  }[];
}

export default function CalculatorPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [userCards, setUserCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<CalculationResult[]>([]);

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
        
        // Fetch categories
        const categoriesData = await apiRequest('/api/transaction-categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Categories data:', categoriesData);
        setCategories(categoriesData || []);
        
        // Fetch user's credit cards with reward rules
        const userCardsData = await getUserCreditCards();
        console.log('User cards data for calculator:', userCardsData);
        
        // Enhanced debugging for reward rules
        if (userCardsData && userCardsData.length > 0) {
          // Log the structure of the first card to understand the data format
          console.log('First card structure:', JSON.stringify(userCardsData[0], null, 2));
          
          // Check if reward rules are present and in the expected format
          const hasRewardRules = userCardsData.some((card: UserCreditCardData) => 
            (card.creditCard?.rewardRules && card.creditCard.rewardRules.length > 0) || 
            (card.rewardRules && card.rewardRules.length > 0)
          );
          
          console.log('Has reward rules:', hasRewardRules);
          
          // Check if we need to access rules through creditCard property or directly
          const needsCreditCardAccess = userCardsData.some((card: UserCreditCardData) => card.creditCard?.rewardRules);
          console.log('Needs creditCard access:', needsCreditCardAccess);
          
          // Check if any cards are missing reward rules
          const cardsWithoutRules = userCardsData.filter((card: UserCreditCardData) => {
            const rules = card.creditCard?.rewardRules || card.rewardRules;
            return !rules || rules.length === 0;
          });
          
          if (cardsWithoutRules.length > 0) {
            console.warn('Cards missing reward rules:', cardsWithoutRules.map((c: UserCreditCardData) => c.creditCard?.name || c.name));
          }
          
          // Normalize the data structure to ensure consistent access
          const normalizedCards = userCardsData.map((card: UserCreditCardData) => {
            // If the card has a nested creditCard property, use that structure
            if (card.creditCard) {
              return {
                id: card.creditCard.id,
                name: card.creditCard.name,
                bank: card.creditCard.bank,
                rewardRules: card.creditCard.rewardRules || []
              };
            }
            // Otherwise use the direct structure
            return {
              id: card.id!,
              name: card.name!,
              bank: card.bank!,
              rewardRules: card.rewardRules || []
            };
          });
          
          console.log('Normalized cards:', normalizedCards);
          setUserCards(normalizedCards);
        } else {
          setUserCards([]);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setSelectedSubCategoryId('');
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId || !amount) {
      return;
    }
    
    setCalculating(true);
    
    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      console.log('Calculating rewards for category:', selectedCategoryId);
      console.log('Selected subcategory:', selectedSubCategoryId || 'None');
      console.log('Transaction amount:', amountValue);
      console.log('Available cards for calculation:', userCards);
      
      // Calculate rewards for each card
      const calculationResults: CalculationResult[] = userCards.map(card => {
        console.log(`Processing card: ${card.name}`, card.rewardRules);
        
        // Find the reward rule for the selected category
        const rule = card.rewardRules?.find(r => {
          // Log each rule to debug
          console.log(`Checking rule for ${card.name}:`, r);
          
          // Match by category
          const categoryMatch = r.categoryId === selectedCategoryId;
          console.log(`Category match for ${card.name}:`, categoryMatch, `(${r.categoryId} vs ${selectedCategoryId})`);
          
          // If subcategory is selected, check for subcategory match
          if (selectedSubCategoryId) {
            const subCategoryMatch = categoryMatch && r.subCategoryId === selectedSubCategoryId;
            console.log(`Subcategory match for ${card.name}:`, subCategoryMatch, `(${r.subCategoryId} vs ${selectedSubCategoryId})`);
            return subCategoryMatch;
          }
          
          // Otherwise just match by category
          return categoryMatch;
        });
        
        console.log(`Found rule for ${card.name}:`, rule);
        
        // Use the rule's reward value if found, otherwise default to 0%
        const rewardRate = rule ? rule.rewardValue : 0;
        const rewardAmount = (amountValue * rewardRate) / 100;
        
        return {
          cardId: card.id,
          cardName: card.name,
          bankName: card.bank.name,
          rewardRate,
          rewardAmount
        };
      });
      
      // Filter out cards with 0% reward rate
      const filteredResults = calculationResults.filter(result => result.rewardRate > 0);
      
      // Sort by reward amount (highest first)
      filteredResults.sort((a, b) => b.rewardAmount - a.rewardAmount);
      
      console.log('Calculation results:', filteredResults);
      setResults(filteredResults);
      
    } catch (err) {
      console.error('Error calculating rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate rewards');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardNav activePage="calculator" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardNav activePage="calculator" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reward Calculator</h1>
          <p className="text-gray-600 dark:text-gray-400">Find the best card for your purchase</p>
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

        {categories.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  No transaction categories found. Please add categories in the admin panel.
                </p>
              </div>
            </div>
          </div>
        )}

        {userCards.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Credit Cards Added Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first credit card to use the reward calculator</p>
            <a href="/dashboard/cards" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              Add Credit Card
            </a>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calculate Rewards</h2>
            
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Category
                  </label>
                  <select
                    id="category"
                    value={selectedCategoryId}
                    onChange={handleCategoryChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub-Category (Optional)
                  </label>
                  <select
                    id="subcategory"
                    value={selectedSubCategoryId}
                    onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                    disabled={!selectedCategoryId}
                  >
                    <option value="">All sub-categories</option>
                    {selectedCategoryId && categories.find(c => c.id === selectedCategoryId)?.subCategories?.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      name="amount"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={calculating || !selectedCategoryId || !amount}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                  {calculating ? 'Calculating...' : 'Calculate Rewards'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credit Card
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reward Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reward Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((result, index) => (
                    <tr key={result.cardId} className={index === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">#{index + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{result.bankName} - {result.cardName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{result.rewardRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">₹{result.rewardAmount.toFixed(2)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {results.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Best Card: {results[0].bankName} - {results[0].cardName}</h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>Using this card will earn you ₹{results[0].rewardAmount.toFixed(2)} in rewards for this purchase.</p>
                    </div>
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