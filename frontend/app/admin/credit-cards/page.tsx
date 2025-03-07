'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiRequest } from '../../../lib/api';

interface CreditCard {
  id: string;
  name: string;
  bank: {
    id: string;
    name: string;
    logo: string | null;
  };
  image: string | null;
  annualFee: number;
}

export default function CreditCardsPage() {
  const router = useRouter();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
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
      
      // Fetch credit cards
      fetchCreditCards();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);
  
  const fetchCreditCards = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const data = await apiRequest('/api/credit-cards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCreditCards(data);
      
    } catch (err) {
      console.error('Error fetching credit cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credit cards');
    } finally {
      setLoading(false);
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
            onClick={() => fetchCreditCards()} 
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
              Credit Cards
            </h1>
            <div className="flex space-x-4">
              <Link href="/admin" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Back to Admin
              </Link>
              <Link href="/admin/credit-cards/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Add New Card
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {creditCards.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">No credit cards have been added yet.</p>
              <Link href="/admin/credit-cards/new" className="mt-4 inline-block text-blue-500 hover:underline">
                Add your first credit card
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creditCards.map(card => (
                <div key={card.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">{card.name}</h2>
                    <p className="text-gray-500">{card.bank.name}</p>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Annual Fee:</span>
                      <span>₹{card.annualFee.toFixed(2)}</span>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <Link 
                        href={`/admin/credit-cards/${card.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        View Details
                      </Link>
                      <Link 
                        href={`/admin/credit-cards/${card.id}/rewards`}
                        className="text-green-500 hover:underline"
                      >
                        Manage Rewards
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 