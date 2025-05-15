'use client';

import { useState, useEffect } from 'react';
import { supabase, type Wallet, type Category } from '@/lib/supabase';

const AddTransactionForm = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category_id: '',
    wallet_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchWallets(), fetchCategories()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchWallets = async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*');
    
    if (error) throw error;
    setWallets(data || []);
    if (data && data.length > 0) {
      setFormData(prev => ({ ...prev, wallet_id: data[0].id }));
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setCategories(data || []);
    if (data && data.length > 0) {
      setFormData(prev => ({ ...prev, category_id: data[0].id }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          { name: newCategory.trim(), type: formData.type }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCategories([...categories, data[0]]);
        setFormData({
          ...formData,
          category_id: data[0].id
        });
        setNewCategory('');
      }
    } catch (error) {
      console.error('Error adding category:', error);
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
        
        // Record balance history
        // First, get total balance across all wallets
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
          // Continue even if balance history recording fails
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
      
      alert('Transaction added successfully!');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
        <div className="mt-1 flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Expense</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Income</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">Rp</span>
          </div>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
            step="1"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="wallet_id" className="block text-sm font-medium text-gray-700">Wallet</label>
        <select
          id="wallet_id"
          name="wallet_id"
          value={formData.wallet_id}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          {wallets.length === 0 ? (
            <option value="">No wallets available</option>
          ) : (
            wallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
            ))
          )}
        </select>
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
        <div className="mt-1 flex space-x-2">
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories
              .filter(cat => cat.type === formData.type)
              .map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            {categories.filter(cat => cat.type === formData.type).length === 0 && (
              <option value="">No categories available</option>
            )}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Add New Category</label>
        <div className="mt-1 flex space-x-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Category name"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <button
          type="submit"
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {formData.type === 'expense' ? 'Add Expense' : 'Add Income'}
        </button>
      </div>
    </form>
  );
};

export default AddTransactionForm; 