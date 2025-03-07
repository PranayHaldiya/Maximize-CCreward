// API utility functions for making requests to the backend

const API_BASE_URL = 'http://localhost:3001';

/**
 * Generic function to make API requests
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${baseUrl}${endpoint}`;
  
  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, 
      options.body ? `Body: ${options.body}` : '');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Log response status
    console.log(`API Response: ${response.status} ${response.statusText} for ${url}`);
    
    // Handle non-2xx responses
    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        try {
          // Try to parse as JSON
          errorData = text ? JSON.parse(text) : { message: response.statusText };
        } catch (parseError) {
          // If not JSON, use text as message
          errorData = { message: text || response.statusText };
        }
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
      console.error(`API Error: ${errorMessage}`, errorData);
      throw new Error(errorMessage);
    }
    
    // For 204 No Content responses, return empty object
    if (response.status === 204) {
      return {};
    }
    
    // Check if there's content to parse
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    if (contentLength === '0' || (contentLength && parseInt(contentLength) === 0)) {
      console.log('Response has no content, returning empty object');
      return {};
    }
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Response is not JSON, returning text content');
      const text = await response.text();
      return text ? { message: text } : {};
    }
    
    try {
      // Parse JSON response
      const text = await response.text();
      if (!text) {
        console.log('Empty response text, returning empty object');
        return {};
      }
      
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      // If JSON parsing fails but response was OK, return empty object
      return {};
    }
  } catch (error) {
    console.error(`API Request Failed: ${url}`, error);
    throw error;
  }
}

/**
 * Register a new user
 */
export async function register(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login a user
 */
export async function login(email: string, password: string) {
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
      return response;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Get the current user's profile
 */
export async function getUserProfile() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to fetch the user profile
    return apiRequest(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error decoding token or fetching user profile:', error);
    throw new Error('Failed to get user profile');
  }
}

/**
 * Get the user's credit cards
 */
export async function getUserCreditCards() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to fetch the user's credit cards
    return apiRequest(`/api/users/${userId}/credit-cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error decoding token or fetching credit cards:', error);
    throw new Error('Failed to get user credit cards');
  }
}

/**
 * Get reward summary for the user
 */
export async function getRewardSummary() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to fetch the reward summary
    return apiRequest(`/api/users/${userId}/rewards/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error decoding token or fetching reward summary:', error);
    throw new Error('Failed to get reward summary');
  }
}

/**
 * Add a new credit card for the user
 */
export async function addCreditCard(cardData: {
  creditCardId: string;
  cardNumber?: string;
  expiryDate?: string;
}) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    console.log('Using user ID:', userId);

    // Then use the user ID to add a credit card
    return apiRequest(`/api/users/${userId}/credit-cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        creditCardId: cardData.creditCardId,
        cardNumber: cardData.cardNumber,
        expiryDate: cardData.expiryDate
      }),
    });
  } catch (error) {
    console.error('Error adding credit card:', error);
    throw error;
  }
}

/**
 * Get all available credit cards
 */
export async function getAllCreditCards() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await apiRequest('/api/credit-cards', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('API response for getAllCreditCards:', response);
    
    // Check if reward rules are present
    if (response && response.length > 0) {
      console.log('First card reward rules:', response[0].rewardRules);
      
      // Check if any cards are missing reward rules
      const cardsWithoutRules = response.filter((card: any) => !card.rewardRules || card.rewardRules.length === 0);
      if (cardsWithoutRules.length > 0) {
        console.warn('Cards missing reward rules in API response:', cardsWithoutRules.map((c: any) => c.name));
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error in getAllCreditCards:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userData: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to update the user profile
    return apiRequest(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('Error decoding token or updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Change user password
 */
export async function changePassword(passwordData: {
  currentPassword: string;
  newPassword: string;
}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)
    
    // Then use the user ID to change the password
    return apiRequest(`/api/users/${userId}/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });
  } catch (error) {
    console.error('Error decoding token or changing password:', error);
    throw new Error('Failed to change password');
  }
}

/**
 * Store authentication token in localStorage
 */
export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Get authentication token from localStorage
 */
export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 */
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Get a specific user credit card by ID
 */
export async function getUserCreditCard(cardId: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // First, try to decode the JWT token to get the user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // JWT standard for subject (user ID)

    // Try to get the card directly from the API first
    try {
      // Direct API call to get the card with all details
      const cardData = await apiRequest(`/api/credit-cards/${cardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Card data from direct API call:', cardData);
      return cardData;
    } catch (directApiError) {
      console.warn('Could not fetch card directly, falling back to user cards:', directApiError);
      
      // Fallback: Get all user credit cards and find the specific one
      const userCards = await getUserCreditCards();
      
      // Find the specific card by ID
      interface CreditCard {
        id: string;
        name: string;
        [key: string]: any; // Allow for other properties
      }
      
      const card = userCards.find((card: CreditCard) => card.id === cardId);
      
      if (!card) {
        throw new Error(`Credit card with ID ${cardId} not found`);
      }
      
      return card;
    }
  } catch (error) {
    console.error('Error fetching user credit card:', error);
    throw error;
  }
}

/**
 * Get a specific credit card by ID
 * @param id The ID of the credit card to retrieve
 * @returns The credit card data
 */
export async function getCreditCard(id: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    // Direct API call to get the card with all details
    const response = await apiRequest(`/api/credit-cards/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (response.statusCode === 404 || !response.id) {
      throw new Error(`Credit card with ID ${id} not found`);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching credit card:', error);
    throw error;
  }
}

/**
 * Check if the user has a specific credit card
 * @param cardId The ID of the credit card to check
 * @returns The user's credit card if found, null otherwise
 */
export async function checkUserHasCard(cardId: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const userCards = await getUserCreditCards();
    
    if (!Array.isArray(userCards)) {
      return null;
    }
    
    const foundCard = userCards.find((card: any) => 
      card.id === cardId || 
      (card.creditCard && card.creditCard.id === cardId)
    );
    
    return foundCard || null;
  } catch (error) {
    console.error('Error checking if user has card:', error);
    return null;
  }
} 