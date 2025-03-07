'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, apiRequest } from '../../../lib/api';

interface Bank {
  id: string;
  name: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankLogo, setBankLogo] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
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
      
      // Fetch banks
      fetchBanks();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);
  
  const fetchBanks = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const data = await apiRequest('/api/banks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setBanks(data);
      
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load banks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddBank = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      if (!bankName.trim()) {
        throw new Error('Bank name is required');
      }
      
      const data = await apiRequest('/api/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: bankName.trim(),
          logo: bankLogo.trim() || null,
        }),
      });
      
      // Reset form
      setBankName('');
      setBankLogo('');
      setFormSuccess('Bank added successfully!');
      
      // Refresh banks list
      fetchBanks();
      
      // Hide form after successful submission
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Error adding bank:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to add bank');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteBank = async (bankId: string) => {
    if (!confirm('Are you sure you want to delete this bank? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await apiRequest(`/api/banks/${bankId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh banks list
      fetchBanks();
      
    } catch (err) {
      console.error('Error deleting bank:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete bank');
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
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Banks Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add New Bank'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Bank</h2>
          <form onSubmit={handleAddBank}>
            <div className="mb-4">
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter bank name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="bankLogo" className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="text"
                id="bankLogo"
                value={bankLogo}
                onChange={(e) => setBankLogo(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter logo URL (optional)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a URL to the bank's logo image (optional)
              </p>
            </div>
            
            {formError && (
              <div className="mb-4 text-sm text-red-600">{formError}</div>
            )}
            
            {formSuccess && (
              <div className="mb-4 text-sm text-green-600">{formSuccess}</div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {formLoading ? 'Adding...' : 'Add Bank'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Logo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {banks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No banks found. Add a new bank to get started.
                </td>
              </tr>
            ) : (
              banks.map((bank) => (
                <tr key={bank.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bank.name}</div>
                    <div className="text-sm text-gray-500">ID: {bank.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bank.logo ? (
                      <div className="flex items-center">
                        <img src={bank.logo} alt={bank.name} className="h-10 w-10 rounded-full object-cover" />
                        <a 
                          href={bank.logo} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No logo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bank.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteBank(bank.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 