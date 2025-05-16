'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, type Wallet, type Category } from '@/lib/supabase';

// Pre-fetch wallet and category data to reduce form load time
let cachedWallets: Wallet[] | null = null;
let cachedCategories: Category[] | null = null;

const fetchWalletsData = async () => {
  if (cachedWallets) return cachedWallets;
  
  try {
    const { data, error } = await supabase.from('wallets').select('*');
    if (error) throw error;
    cachedWallets = data || [];
    return cachedWallets;
  } catch (error) {
    console.error('Error pre-fetching wallets:', error);
    return [];
  }
};

const fetchCategoriesData = async () => {
  if (cachedCategories) return cachedCategories;
  
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    cachedCategories = data || [];
    return cachedCategories;
  } catch (error) {
    console.error('Error pre-fetching categories:', error);
    return [];
  }
};

// Start pre-fetching as soon as possible
if (typeof window !== 'undefined') {
  fetchWalletsData();
  fetchCategoriesData();
}

const AddTransactionForm = () => {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [wallets, setWallets] = useState<Wallet[]>(cachedWallets || []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedWallets || !cachedCategories);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category_id: '',
    wallet_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Focus amount input on mount - using a small timeout to ensure the DOM is ready
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
    }, 50);
    
    return () => clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!cachedWallets || !cachedCategories) {
          setLoading(true);
          const [walletsData, categoriesData] = await Promise.all([
            fetchWalletsData(),
            fetchCategoriesData()
          ]);
          
          setWallets(walletsData);
          setCategories(categoriesData);
          
          if (walletsData.length > 0) {
            setFormData(prev => ({ ...prev, wallet_id: walletsData[0].id }));
          }
          
          if (categoriesData.length > 0) {
            const expenseCategories = categoriesData.filter(c => c.type === 'expense');
            if (expenseCategories.length > 0) {
              setFormData(prev => ({ ...prev, category_id: expenseCategories[0].id }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter categories based on input and transaction type
  useEffect(() => {
    if (categoryInput) {
      const filtered = categories.filter(cat => 
        cat.type === formData.type && 
        cat.name.toLowerCase().includes(categoryInput.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories.filter(cat => cat.type === formData.type));
    }
  }, [categoryInput, categories, formData.type]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters
    const value = e.target.value.replace(/[^\d]/g, '');
    
    // Update form data
    setFormData({
      ...formData,
      amount: value
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTypeChange = (type: 'expense' | 'income') => {
    setFormData({
      ...formData,
      type,
      // Reset category when changing type
      category_id: categories.find(c => c.type === type)?.id || ''
    });
  };

  const handleWalletSelect = (walletId: string) => {
    setFormData({
      ...formData,
      wallet_id: walletId
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData({
      ...formData,
      category_id: categoryId
    });
    setCategoryInput('');
    setShowCategoryDropdown(false);
  };

  const handleAddCategory = async () => {
    if (!categoryInput.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          { name: categoryInput.trim(), type: formData.type }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newCategory = data[0];
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        cachedCategories = updatedCategories;
        
        setFormData({
          ...formData,
          category_id: newCategory.id
        });
        setCategoryInput('');
        setShowCategoryDropdown(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCategories.length > 0) {
        handleCategorySelect(filteredCategories[0].id);
      } else if (categoryInput.trim()) {
        handleAddCategory();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert amount to number
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      // Insert transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            amount,
            description: formData.description,
            type: formData.type,
            category_id: formData.category_id,
            wallet_id: formData.wallet_id,
            date: formData.date
          }
        ]);
      
      if (transactionError) throw transactionError;
      
      // Update wallet balance
      const wallet = wallets.find(w => w.id === formData.wallet_id);
      if (wallet) {
        const newBalance = formData.type === 'income' 
          ? wallet.balance + amount 
          : wallet.balance - amount;
        
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id);
        
        if (walletError) throw walletError;
        
        // Update cached wallet data
        const updatedWallets = wallets.map(w => 
          w.id === wallet.id ? {...w, balance: newBalance} : w
        );
        setWallets(updatedWallets);
        cachedWallets = updatedWallets;
        
        // Record balance history
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('balance');
          
        if (walletsError) throw walletsError;
        
        const totalBalance = walletsData?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
        
        // Insert balance history record
        const timestamp = new Date().toISOString();
        const { error: historyError } = await supabase
          .from('balance_history')
          .insert([
            {
              total_balance: totalBalance,
              timestamp: timestamp
            }
          ]);
        
        if (historyError) {
          console.error('Error recording balance history:', historyError);
        }
      }
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        type: 'expense',
        category_id: formData.category_id,
        wallet_id: formData.wallet_id,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Focus back on amount input for quick entry of multiple transactions
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }

      // Success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
      notification.textContent = 'Transaction added successfully!';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>;
  }

  // Get the selected category name for display
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  // Commented out unused variable 
  // const selectedWallet = wallets.find(w => w.id === formData.wallet_id);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-4 transition-colors duration-300 ${
        formData.type === 'expense' ? 'text-red-800' : 'text-green-800'
      }`}
    >
      {/* Amount Input - First field, auto-focused */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium">Amount</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">Rp</span>
          </div>
          <input
            ref={amountInputRef}
            type="text"
            id="amount"
            name="amount"
            value={formData.amount ? parseInt(formData.amount).toLocaleString('id-ID') : ''}
            onChange={handleAmountChange}
            className={`block w-full pl-10 pr-12 border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
              formData.type === 'expense' 
                ? 'focus:ring-red-500 focus:border-red-500' 
                : 'focus:ring-green-500 focus:border-green-500'
            }`}
            placeholder="0"
            required
          />
        </div>
      </div>

      {/* Transaction Type - Second field with animated selection */}
      <div>
        <label className="block text-sm font-medium">Transaction Type</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 px-4 rounded-lg text-center transition-colors duration-300 ${
              formData.type === 'expense'
                ? 'bg-red-100 border-2 border-red-500 text-red-800 font-semibold'
                : 'bg-gray-100 border border-gray-300 text-gray-600'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 px-4 rounded-lg text-center transition-colors duration-300 ${
              formData.type === 'income'
                ? 'bg-green-100 border-2 border-green-500 text-green-800 font-semibold'
                : 'bg-gray-100 border border-gray-300 text-gray-600'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Wallet Selection - Toggleable boxes */}
      <div>
        <label className="block text-sm font-medium">Wallet</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {wallets.map(wallet => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => handleWalletSelect(wallet.id)}
              className={`py-2 px-4 text-left rounded-lg transition-colors duration-200 ${
                formData.wallet_id === wallet.id
                  ? formData.type === 'expense'
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              <span className="block font-medium truncate">{wallet.name}</span>
              <span className="block text-sm truncate">Rp {wallet.balance.toLocaleString('id-ID')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection - Autocomplete with dropdown */}
      <div>
        <label className="block text-sm font-medium">Category</label>
        <div className="mt-1 relative">
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => {
              setCategoryInput(e.target.value);
              setShowCategoryDropdown(true);
            }}
            onFocus={() => setShowCategoryDropdown(true)}
            onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
            onKeyDown={handleCategoryKeyDown}
            placeholder={selectedCategory?.name || "Select or create category"}
            className={`block w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
              formData.type === 'expense' 
                ? 'focus:ring-red-500 focus:border-red-500' 
                : 'focus:ring-green-500 focus:border-green-500'
            }`}
          />
          
          {showCategoryDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
              <ul className="py-1">
                {filteredCategories.map(category => (
                  <li 
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {category.name}
                  </li>
                ))}
                {categoryInput && filteredCategories.length === 0 && (
                  <li 
                    onClick={handleAddCategory}
                    className={`px-3 py-2 cursor-pointer font-medium ${
                      formData.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    Create &quot;{categoryInput}&quot;
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={2}
          className={`mt-1 block w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
            formData.type === 'expense' 
              ? 'focus:ring-red-500 focus:border-red-500' 
              : 'focus:ring-green-500 focus:border-green-500'
          }`}
        />
      </div>

      {/* Date Selection */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium">Date</label>
        <div className="mt-1 relative">
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`block w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
              formData.type === 'expense' 
                ? 'focus:ring-red-500 focus:border-red-500' 
                : 'focus:ring-green-500 focus:border-green-500'
            }`}
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
            formData.type === 'expense'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {formData.type === 'expense' ? 'Add Expense' : 'Add Income'}
        </button>
      </div>
    </form>
  );
};

export default AddTransactionForm; 