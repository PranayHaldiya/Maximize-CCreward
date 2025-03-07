'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, apiRequest } from '../../../../lib/api';
import Link from 'next/link';

interface Bank {
  id: string;
  name: string;
}

export default function AddCreditCardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    image: '',
    annualFee: 0,
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingBanks, setFetchingBanks] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
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
    setFetchingBanks(true);
    setFetchError('');
    
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
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch banks');
    } finally {
      setFetchingBanks(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'annualFee' ? parseFloat(value) : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await apiRequest('/api/credit-cards', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          bankId: formData.bankId,
          imageUrl: formData.image || undefined,
          annualFee: formData.annualFee ? parseFloat(formData.annualFee.toString()) : undefined,
        }),
      });

      router.push('/admin');
    } catch (err) {
      console.error('Error creating credit card:', err);
      setError(err instanceof Error ? err.message : 'Failed to create credit card');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Add New Credit Card</h1>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            Back to Admin
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
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
          
          {fetchingBanks ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Banks Available</h3>
              <p className="text-gray-500 mb-4">You need to add at least one bank before adding credit cards</p>
              <Link 
                href="/admin/banks/new" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add New Bank
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Card Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="Enter credit card name"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="bankId" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank *
                </label>
                <select
                  id="bankId"
                  name="bankId"
                  value={formData.bankId}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                >
                  <option value="">Select a bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Card Image URL (optional)
                </label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="Enter card image URL"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="annualFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Fee
                </label>
                <input
                  type="number"
                  id="annualFee"
                  name="annualFee"
                  value={formData.annualFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="Enter annual fee"
                />
              </div>
              
              <div className="flex justify-end">
                <Link
                  href="/admin"
                  className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Creating...' : 'Create Credit Card'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
} 