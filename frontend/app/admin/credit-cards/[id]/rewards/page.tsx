'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../../../lib/api';

// Types
interface Category {
  id: string;
  name: string;
  subCategories?: SubCategory[];
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
  subCategoryId: string | null;
  subCategory: SubCategory | null;
  transactionType: 'ONLINE' | 'OFFLINE' | 'BOTH';
  rewardType: 'CASHBACK' | 'POINTS' | 'MILES';
  rewardValue: number;
  monthlyCap: number | null;
  minimumSpend: number | null;
}

interface CreditCard {
  id: string;
  name: string;
  bank: {
    id: string;
    name: string;
  };
  image: string | null;
  annualFee: number;
}

export default function CreditCardRewardsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const creditCardId = params.id;
  
  const [creditCard, setCreditCard] = useState<CreditCard | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    transactionType: 'BOTH',
    rewardType: 'CASHBACK',
    rewardValue: 0,
    monthlyCap: '',
    minimumSpend: '',
  });
  
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Add state for editing
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    transactionType: 'BOTH',
    rewardType: 'CASHBACK',
    rewardValue: 0,
    monthlyCap: '',
    minimumSpend: '',
  });
  const [editFormError, setEditFormError] = useState('');
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editSelectedCategory, setEditSelectedCategory] = useState<Category | null>(null);
  
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
      
      // Fetch data
      fetchData();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router, creditCardId]);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Fetch credit card details
      const cardData = await apiRequest(`/api/credit-cards/${creditCardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCreditCard(cardData);
      
      // Fetch categories
      const categoriesData = await apiRequest('/api/transaction-categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCategories(categoriesData);
      
      // Fetch reward rules for this credit card
      const rulesData = await apiRequest(`/api/reward-rules/credit-card/${creditCardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setRewardRules(rulesData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'categoryId') {
      const category = categories.find(cat => cat.id === value);
      setSelectedCategory(category || null);
      setFormData(prev => ({
        ...prev,
        categoryId: value,
        subCategoryId: '', // Reset subcategory when category changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Prepare data for API
      const rewardRuleData = {
        creditCardId,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || undefined,
        transactionType: formData.transactionType,
        rewardType: formData.rewardType,
        rewardValue: parseFloat(formData.rewardValue.toString()),
        monthlyCap: formData.monthlyCap ? parseFloat(formData.monthlyCap) : undefined,
        minimumSpend: formData.minimumSpend ? parseFloat(formData.minimumSpend) : undefined,
      };
      
      // Create reward rule
      await apiRequest('/api/reward-rules', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rewardRuleData),
      });
      
      // Reset form
      setFormData({
        categoryId: '',
        subCategoryId: '',
        transactionType: 'BOTH',
        rewardType: 'CASHBACK',
        rewardValue: 0,
        monthlyCap: '',
        minimumSpend: '',
      });
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error creating reward rule:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create reward rule');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this reward rule?')) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await apiRequest(`/api/reward-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Error deleting reward rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete reward rule');
    }
  };
  
  const handleEditClick = (rule: RewardRule) => {
    setEditingRuleId(rule.id);
    setEditFormData({
      categoryId: rule.categoryId,
      subCategoryId: rule.subCategoryId || '',
      transactionType: rule.transactionType,
      rewardType: rule.rewardType,
      rewardValue: rule.rewardValue,
      monthlyCap: rule.monthlyCap ? rule.monthlyCap.toString() : '',
      minimumSpend: rule.minimumSpend ? rule.minimumSpend.toString() : '',
    });
    
    // Set the selected category for the edit form
    const category = categories.find(cat => cat.id === rule.categoryId);
    setEditSelectedCategory(category || null);
  };
  
  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditFormError('');
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'categoryId') {
      const category = categories.find(cat => cat.id === value);
      setEditSelectedCategory(category || null);
      setEditFormData(prev => ({
        ...prev,
        categoryId: value,
        subCategoryId: '', // Reset subcategory when category changes
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError('');
    setEditFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Prepare data for API
      const rewardRuleData = {
        creditCardId,
        categoryId: editFormData.categoryId,
        subCategoryId: editFormData.subCategoryId || undefined,
        transactionType: editFormData.transactionType,
        rewardType: editFormData.rewardType,
        rewardValue: parseFloat(editFormData.rewardValue.toString()),
        monthlyCap: editFormData.monthlyCap ? parseFloat(editFormData.monthlyCap) : undefined,
        minimumSpend: editFormData.minimumSpend ? parseFloat(editFormData.minimumSpend) : undefined,
      };
      
      // Update reward rule
      await apiRequest(`/api/reward-rules/${editingRuleId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rewardRuleData),
      });
      
      // Reset form and refresh data
      setEditingRuleId(null);
      fetchData();
      
    } catch (err) {
      console.error('Error updating reward rule:', err);
      setEditFormError(err instanceof Error ? err.message : 'Failed to update reward rule');
    } finally {
      setEditFormLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Reward Rules for {creditCard?.name}
            </h1>
            <Link href="/admin" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Back to Admin
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Reward Rule</h2>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Category (Optional)
                  </label>
                  <select
                    name="subCategoryId"
                    value={formData.subCategoryId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    disabled={!selectedCategory?.subCategories?.length}
                  >
                    <option value="">All sub-categories</option>
                    {selectedCategory?.subCategories?.map(subCategory => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="BOTH">Both Online & Offline</option>
                    <option value="ONLINE">Online Only</option>
                    <option value="OFFLINE">Offline Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward Type
                  </label>
                  <select
                    name="rewardType"
                    value={formData.rewardType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="CASHBACK">Cashback</option>
                    <option value="POINTS">Points</option>
                    <option value="MILES">Miles</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward Value
                  </label>
                  <input
                    type="number"
                    name="rewardValue"
                    value={formData.rewardValue}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.rewardType === 'CASHBACK' ? 'Percentage (e.g., 5 for 5%)' : 'Points/Miles per dollar spent'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Cap (Optional)
                  </label>
                  <input
                    type="number"
                    name="monthlyCap"
                    value={formData.monthlyCap}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Spend (Optional)
                  </label>
                  <input
                    type="number"
                    name="minimumSpend"
                    value={formData.minimumSpend}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  disabled={formLoading}
                >
                  {formLoading ? 'Adding...' : 'Add Reward Rule'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Current Reward Rules</h2>
            
            {rewardRules.length === 0 ? (
              <p className="text-gray-500">No reward rules have been added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sub-Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Limits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rewardRules.map(rule => (
                      <tr key={rule.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rule.category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rule.subCategory?.name || 'All'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rule.transactionType === 'BOTH' ? 'Online & Offline' : 
                           rule.transactionType === 'ONLINE' ? 'Online Only' : 'Offline Only'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rule.rewardValue} 
                          {rule.rewardType === 'CASHBACK' ? '% Cashback' : 
                           rule.rewardType === 'POINTS' ? ' Points/$' : ' Miles/$'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rule.monthlyCap ? `Cap: $${rule.monthlyCap}` : ''} 
                          {rule.monthlyCap && rule.minimumSpend ? ' / ' : ''}
                          {rule.minimumSpend ? `Min: $${rule.minimumSpend}` : ''}
                          {!rule.monthlyCap && !rule.minimumSpend ? 'None' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRuleId === rule.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleEditClick(rule)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {editingRuleId && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Edit Reward Rule</h3>
          
          {editFormError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {editFormError}
            </div>
          )}
          
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Category (Optional)
                </label>
                <select
                  name="subCategoryId"
                  value={editFormData.subCategoryId}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  disabled={!editSelectedCategory?.subCategories?.length}
                >
                  <option value="">All sub-categories</option>
                  {editSelectedCategory?.subCategories?.map(subCategory => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  name="transactionType"
                  value={editFormData.transactionType}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="BOTH">Both Online & Offline</option>
                  <option value="ONLINE">Online Only</option>
                  <option value="OFFLINE">Offline Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward Type
                </label>
                <select
                  name="rewardType"
                  value={editFormData.rewardType}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="CASHBACK">Cashback</option>
                  <option value="POINTS">Points</option>
                  <option value="MILES">Miles</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward Value
                </label>
                <input
                  type="number"
                  name="rewardValue"
                  value={editFormData.rewardValue}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editFormData.rewardType === 'CASHBACK' ? 'Percentage (e.g., 5 for 5%)' : 'Points/Miles per dollar spent'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Cap (Optional)
                </label>
                <input
                  type="number"
                  name="monthlyCap"
                  value={editFormData.monthlyCap}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Spend (Optional)
                </label>
                <input
                  type="number"
                  name="minimumSpend"
                  value={editFormData.minimumSpend}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="mt-6 flex space-x-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={editFormLoading}
              >
                {editFormLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 