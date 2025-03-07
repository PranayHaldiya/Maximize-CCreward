'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNav from '../../components/DashboardNav';
import { getUserCreditCards, getAllCreditCards, addCreditCard, getToken } from '../../../lib/api';

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

export default function CardsPage() {
  const router = useRouter();
  const [userCards, setUserCards] = useState<CreditCard[]>([]);
  const [availableCards, setAvailableCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

        // Fetch user's credit cards
        const userCardsData = await getUserCreditCards();
        setUserCards(userCardsData || []);

        // Fetch all available credit cards
        const allCardsData = await getAllCreditCards();
        
        // Filter out cards that the user already has
        const userCardIds = userCardsData ? userCardsData.map((card: any) => card.id) : [];
        const filteredAvailableCards = allCardsData ? allCardsData.filter((card: any) => !userCardIds.includes(card.id)) : [];
        
        setAvailableCards(filteredAvailableCards);

      } catch (err) {
        console.error('Error fetching credit cards:', err);
        setError('Failed to load credit card data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Function to calculate reward value based on type
  const formatRewardValue = (card: CreditCard) => {
    if (!card.rewardBalance && card.rewardBalance !== 0) return '0';
    
    if (card.rewardType === 'CASHBACK') {
      return `$${card.rewardBalance.toFixed(2)}`;
    } else {
      return card.rewardBalance.toLocaleString();
    }
  };

  const handleAddCard = async () => {
    try {
      setLoading(true);
      
      // Refresh the available cards
      const userCardsData = await getUserCreditCards();
      const allCardsData = await getAllCreditCards();
      
      // Filter out cards that the user already has
      const userCardIds = userCardsData ? userCardsData.map((card: any) => card.id) : [];
      const filteredAvailableCards = allCardsData ? allCardsData.filter((card: any) => !userCardIds.includes(card.id)) : [];
      
      setAvailableCards(filteredAvailableCards);
      
      if (filteredAvailableCards.length === 0) {
        // If no cards are available, show an error message
        setError('No credit cards available to add. Please try again later.');
        return;
      }
      
      // Clear any previous errors
      setError('');
      setShowAddCardModal(true);
    } catch (err) {
      console.error('Error refreshing credit cards:', err);
      setError('Failed to load credit card data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddCardModal(false);
    setSelectedCard(null);
    setCardDetails({
      cardNumber: '',
      expiryDate: '',
    });
  };

  const handleCardSelection = (cardId: string) => {
    setSelectedCard(cardId);
  };

  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCard) {
      return;
    }

    try {
      setSubmitting(true);

      // Format the expiry date properly
      let formattedExpiryDate: string | undefined = undefined;
      if (cardDetails.expiryDate) {
        // Convert MM/YY format to a valid date string
        const [month, year] = cardDetails.expiryDate.split('/');
        if (month && year && month.length === 2 && year.length === 2) {
          // Create a date for the last day of the expiry month
          const fullYear = `20${year}`;
          const lastDayOfMonth = new Date(parseInt(fullYear), parseInt(month), 0).getDate();
          formattedExpiryDate = `${fullYear}-${month}-${lastDayOfMonth}`;
        }
      }

      await addCreditCard({
        creditCardId: selectedCard,
        cardNumber: cardDetails.cardNumber,
        expiryDate: formattedExpiryDate
      });

      // Refresh user cards
      const updatedCards = await getUserCreditCards();
      setUserCards(updatedCards || []);

      // Close modal
      handleCloseModal();
    } catch (err) {
      console.error('Error adding credit card:', err);
      setError('Failed to add credit card. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardNav activePage="cards" />
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
      <DashboardNav activePage="cards" />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Credit Cards</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your credit cards and track rewards</p>
          </div>
          <button
            onClick={handleAddCard}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Credit Card
          </button>
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

        {userCards && userCards.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Credit Cards Added Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first credit card to start tracking rewards</p>

            <button
              onClick={handleAddCard}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
            >
              Add Credit Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCards && userCards.map((card) => (
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
                  <button
                    onClick={() => router.push(`/dashboard/cards/${card.id}`)}
                    className="mt-4 w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Card Modal */}
        {showAddCardModal && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Add Credit Card</h3>
                  
                  <form onSubmit={handleSubmitCard}>
                    <div className="mb-4">
                      <label htmlFor="card" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Card
                      </label>
                      <select
                        id="card"
                        value={selectedCard || ''}
                        onChange={(e) => handleCardSelection(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Select a card</option>
                        {availableCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.bank.name} - {card.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Card Number (Optional)
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleCardDetailsChange}
                        placeholder="**** **** **** ****"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={handleCardDetailsChange}
                        placeholder="MM/YY"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedCard || submitting}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                      >
                        {submitting ? 'Adding...' : 'Add Card'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 