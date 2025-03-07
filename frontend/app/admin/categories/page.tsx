'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, apiRequest } from '../../../lib/api';

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  subCategories?: SubCategory[];
  isExpanded?: boolean; // For UI state
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryFormSuccess, setCategoryFormSuccess] = useState('');
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  
  // Subcategory form state
  const [subcategoryName, setSubcategoryName] = useState('');
  const [subcategoryFormError, setSubcategoryFormError] = useState('');
  const [subcategoryFormSuccess, setSubcategoryFormSuccess] = useState('');
  const [subcategoryFormLoading, setSubcategoryFormLoading] = useState(false);
  
  // Active category for adding subcategories
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  
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
      
      // Check API accessibility
      checkApiAccessibility();
      
      // Fetch categories
      fetchCategories();
      
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);
  
  // Check if the transaction-categories API is accessible
  const checkApiAccessibility = async () => {
    try {
      const token = getToken();
      if (!token) {
        return;
      }
      
      console.log('Checking transaction-categories API accessibility...');
      
      // Make a simple GET request to check if the API is accessible
      await apiRequest('/api/transaction-categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Transaction-categories API is accessible');
    } catch (err) {
      console.error('Error accessing transaction-categories API:', err);
      setError('Unable to access the transaction-categories API. Please check if the backend server is running.');
    }
  };
  
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('Fetching transaction categories...');
      
      // Fetch categories
      const categoriesData = await apiRequest('/api/transaction-categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Transaction categories response:', categoriesData);
      
      if (!Array.isArray(categoriesData)) {
        throw new Error('Invalid response format: categories data is not an array');
      }
      
      // For each category, fetch its subcategories
      const categoriesWithSubcategories = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            console.log(`Fetching subcategories for category ${category.id}...`);
            
            const subcategoriesData = await apiRequest(`/api/transaction-categories/${category.id}/sub-categories`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log(`Subcategories for category ${category.id}:`, subcategoriesData);
            
            return {
              ...category,
              subCategories: Array.isArray(subcategoriesData) ? subcategoriesData : [],
              isExpanded: false,
            };
          } catch (error) {
            console.error(`Error fetching subcategories for category ${category.id}:`, error);
            
            // Return the category without subcategories if there was an error
            return {
              ...category,
              subCategories: [],
              isExpanded: false,
            };
          }
        })
      );
      
      console.log('Categories with subcategories:', categoriesWithSubcategories);
      
      setCategories(categoriesWithSubcategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setCategoryFormError('');
    setCategoryFormSuccess('');
    setCategoryFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      if (!categoryName.trim()) {
        throw new Error('Category name is required');
      }
      
      await apiRequest('/api/transaction-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName.trim(),
        }),
      });
      
      // Reset form
      setCategoryName('');
      setCategoryFormSuccess('Category added successfully!');
      
      // Refresh categories list
      fetchCategories();
      
      // Hide form after successful submission
      setTimeout(() => {
        setShowCategoryForm(false);
        setCategoryFormSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Error adding category:', err);
      setCategoryFormError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setCategoryFormLoading(false);
    }
  };
  
  const handleAddSubcategory = async (e: FormEvent, categoryId: string) => {
    e.preventDefault();
    setSubcategoryFormError('');
    setSubcategoryFormSuccess('');
    setSubcategoryFormLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      if (!subcategoryName.trim()) {
        throw new Error('Subcategory name is required');
      }
      
      console.log(`Attempting to add subcategory to category ${categoryId}`);
      
      // Use the exact endpoint format from the backend controller
      const endpoint = `/api/transaction-categories/${categoryId}/sub-categories`;
      console.log(`Using endpoint: ${endpoint}`);
      
      try {
        await apiRequest(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: subcategoryName.trim(),
          }),
        });
        
        // Reset form
        setSubcategoryName('');
        setSubcategoryFormSuccess('Subcategory added successfully!');
        
        // Refresh categories list
        fetchCategories();
        
        // Clear success message after a delay
        setTimeout(() => {
          setSubcategoryFormSuccess('');
        }, 2000);
      } catch (error) {
        console.error('Error adding subcategory:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error in handleAddSubcategory:', err);
      setSubcategoryFormError(err instanceof Error ? err.message : 'Failed to add subcategory');
    } finally {
      setSubcategoryFormLoading(false);
    }
  };
  
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories. This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await apiRequest(`/api/transaction-categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh categories list
      fetchCategories();
      
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };
  
  const handleDeleteSubcategory = async (subcategoryId: string, categoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`Attempting to delete subcategory ${subcategoryId}`);
      
      // Use the exact endpoint format from the backend controller
      const endpoint = `/api/transaction-categories/sub-categories/${subcategoryId}`;
      console.log(`Using endpoint: ${endpoint}`);
      
      try {
        await apiRequest(endpoint, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log('Subcategory deleted successfully');
        
        // Refresh categories list
        fetchCategories();
      } catch (error) {
        console.error('Error deleting subcategory:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error in handleDeleteSubcategory:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete subcategory');
    }
  };
  
  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setCategories(prevCategories => 
      prevCategories.map(category => 
        category.id === categoryId 
          ? { ...category, isExpanded: !category.isExpanded }
          : category
      )
    );
  };
  
  // Toggle subcategory form for a specific category
  const toggleSubcategoryForm = (categoryId: string) => {
    if (activeCategoryId === categoryId) {
      setActiveCategoryId(null);
      setSubcategoryName('');
      setSubcategoryFormError('');
      setSubcategoryFormSuccess('');
    } else {
      setActiveCategoryId(categoryId);
      setSubcategoryName('');
      setSubcategoryFormError('');
      setSubcategoryFormSuccess('');
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
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <button
          onClick={() => {
            setShowCategoryForm(!showCategoryForm);
            setActiveCategoryId(null);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {showCategoryForm ? 'Cancel' : 'Add Category'}
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
      
      {showCategoryForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory}>
            <div className="mb-4">
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter category name"
                required
              />
            </div>
            
            {categoryFormError && (
              <div className="mb-4 text-sm text-red-600">{categoryFormError}</div>
            )}
            
            {categoryFormSuccess && (
              <div className="mb-4 text-sm text-green-600">{categoryFormSuccess}</div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={categoryFormLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {categories.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No categories found. Add a new category to get started.</p>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div 
                className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleCategoryExpansion(category.id)}
              >
                <div className="flex items-center">
                  <svg 
                    className={`h-5 w-5 text-gray-500 mr-2 transform transition-transform ${category.isExpanded ? 'rotate-90' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.subCategories?.length || 0} subcategories
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubcategoryForm(category.id);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    {activeCategoryId === category.id ? 'Cancel' : 'Add Subcategory'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Subcategory form */}
              {activeCategoryId === category.id && (
                <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Subcategory</h4>
                  <form onSubmit={(e) => handleAddSubcategory(e, category.id)}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={subcategoryName}
                        onChange={(e) => setSubcategoryName(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter subcategory name"
                        required
                      />
                      <button
                        type="submit"
                        disabled={subcategoryFormLoading}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {subcategoryFormLoading ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                    
                    {subcategoryFormError && (
                      <div className="mt-2 text-sm text-red-600">{subcategoryFormError}</div>
                    )}
                    
                    {subcategoryFormSuccess && (
                      <div className="mt-2 text-sm text-green-600">{subcategoryFormSuccess}</div>
                    )}
                  </form>
                </div>
              )}
              
              {/* Subcategories list */}
              {category.isExpanded && category.subCategories && category.subCategories.length > 0 && (
                <div className="px-6 py-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subcategory Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.subCategories.map((subcategory) => (
                        <tr key={subcategory.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subcategory.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory.id, category.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Empty state for subcategories */}
              {category.isExpanded && (!category.subCategories || category.subCategories.length === 0) && (
                <div className="px-6 py-4 text-center">
                  <p className="text-sm text-gray-500">No subcategories found for this category.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Click on a category to expand or collapse its subcategories. Use the "Add Subcategory" button to add new subcategories to a specific category. If you encounter any issues, please check the browser console for detailed error messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 